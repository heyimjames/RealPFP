// Image generation backends. Each takes a prompt plus shared options and
// returns raw image bytes. Model IDs move fast: each default below was the
// newest on 2026-10-19, --model overrides it, and listModels() asks the
// provider what it has today.

const ext = (buf) =>
  buf[0] === 0x89 ? "png" : buf[0] === 0xff ? "jpg" : buf.slice(8, 12).toString() === "WEBP" ? "webp" : "png";

async function fail(res, provider) {
  let msg = await res.text();
  try {
    const j = JSON.parse(msg);
    const d = j?.detail ?? j?.error?.message ?? j?.message ?? j?.error;
    msg = typeof d === "string" ? d : d ? JSON.stringify(d) : msg;
  } catch {}
  if (/locked.*exhausted|insufficient|quota|billing|credit/i.test(msg)) msg = `${provider} account is out of credits or over quota: ${msg}`;
  else if (res.status === 401 || res.status === 403) msg = `${provider} rejected the key (${res.status}): ${msg}`;
  else if (res.status === 404) msg = `${provider} model not found (${res.status}); pass a current --model: ${msg}`;
  else if (res.status === 429) msg = `${provider} rate limit; wait and retry`;
  throw new Error(msg.slice(0, 500));
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

const fromB64 = (b64) => Buffer.from(b64, "base64");

// Portrait / landscape / square for APIs that take fixed sizes.
function orientation(aspect) {
  const [w, h] = aspect.split(":").map(Number);
  return w > h ? "landscape" : w < h ? "portrait" : "square";
}

// GPT Image 2 and later take any WIDTHxHEIGHT: edges multiples of 16, at most
// 3840, ratio within 3:1, 655,360 to 8,294,400 pixels in total.
function openaiSize(aspect, resolution) {
  let [w, h] = aspect.split(":").map(Number);
  const ratio = Math.min(3, Math.max(1 / 3, w / h));
  const target = { "1K": 1024 * 1024, "2K": 2048 * 2048, "4K": 8_294_400 }[resolution] ?? 1024 * 1024;
  w = Math.sqrt(target * ratio);
  h = w / ratio;
  const scale = Math.min(1, 3840 / Math.max(w, h));
  const snap = (n) => Math.max(16, Math.floor((n * scale) / 16) * 16);
  w = snap(w);
  h = snap(h);
  while (w * h < 655_360) { w += 16; h = Math.round((w / ratio) / 16) * 16; }
  return `${w}x${h}`;
}

async function getJSON(url, headers, provider) {
  const res = await fetch(url, { headers });
  if (!res.ok) await fail(res, provider);
  return res.json();
}

export const PROVIDERS = {
  fal: {
    label: "fal.ai (Nano Banana 2.1 by default; any fal endpoint via --model)",
    keys: ["FAL_KEY", "FAL_API_KEY"],
    model: "google/nano-banana-2.1",
    // No listing API worth trusting; point at the catalogue instead.
    async listModels() {
      return ["fal has no model-list call here. Browse https://fal.ai/explore/models?categories=text-to-image",
        "Known good: google/nano-banana-2.1, fal-ai/nano-banana-2 (what the RealPFP app uses), fal-ai/nano-banana-pro"];
    },
    async generate(prompt, o, key) {
      const body = {
        prompt,
        num_images: 1,
        aspect_ratio: o.aspect,
        output_format: o.format,
        safety_tolerance: "4",
        resolution: o.resolution,
        limit_generations: true,
      };
      if (o.seed != null) body.seed = o.seed;
      const res = await fetch(`https://fal.run/${o.model}`, {
        method: "POST",
        headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) await fail(res, "fal.ai");
      const url = (await res.json()).images?.[0]?.url;
      if (!url) throw new Error("fal.ai returned no image");
      return download(url);
    },
  },

  gemini: {
    label: "Google Gemini API (Nano Banana 2.1)",
    keys: ["GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    model: "gemini-nano-banana-2.1",
    async listModels(key) {
      const out = [];
      let page = "";
      do {
        const j = await getJSON(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000${page ? `&pageToken=${page}` : ""}`, { "x-goog-api-key": key }, "Gemini");
        for (const m of j.models ?? []) if (/image|banana|imagen/i.test(m.name)) out.push(`${m.name.replace("models/", "")}  ${m.displayName ?? ""}`);
        page = j.nextPageToken;
      } while (page);
      return out;
    },
    async generate(prompt, o, key) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${o.model}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE"],
              imageConfig: { aspectRatio: o.aspect, imageSize: o.resolution },
              ...(o.seed != null ? { seed: o.seed } : {}),
            },
          }),
        }
      );
      if (!res.ok) await fail(res, "Gemini");
      const data = await res.json();
      // Thinking models can return draft images marked `thought`; take the final one.
      const parts = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => (p.inlineData || p.inline_data) && !p.thought);
      const part = parts[parts.length - 1];
      const b64 = part?.inlineData?.data ?? part?.inline_data?.data;
      if (!b64) throw new Error(`Gemini returned no image (finishReason: ${data.candidates?.[0]?.finishReason ?? "unknown"})`);
      return fromB64(b64);
    },
  },

  openai: {
    label: "OpenAI (GPT Image 2.5 Flare; gpt-image-2.5-sunburst for more detail, slower)",
    keys: ["OPENAI_API_KEY"],
    model: "gpt-image-2.5-flare",
    async listModels(key) {
      const j = await getJSON("https://api.openai.com/v1/models", { Authorization: `Bearer ${key}` }, "OpenAI");
      return (j.data ?? []).filter((m) => /image/i.test(m.id)).sort((a, b) => b.created - a.created)
        .map((m) => `${m.id}  ${new Date(m.created * 1000).toISOString().slice(0, 10)}`);
    },
    async generate(prompt, o, key) {
      // Custom sizes from GPT Image 2 on; older models only take the three fixed ones.
      const size = /gpt-image-([2-9]|\d{2})|chatgpt-image/.test(o.model)
        ? openaiSize(o.aspect, o.resolution)
        : { square: "1024x1024", portrait: "1024x1536", landscape: "1536x1024" }[orientation(o.aspect)];
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: o.model, prompt, n: 1, size, output_format: o.format === "jpg" ? "jpeg" : o.format }),
      });
      if (!res.ok) await fail(res, "OpenAI");
      const img = (await res.json()).data?.[0];
      if (img?.b64_json) return fromB64(img.b64_json);
      if (img?.url) return download(img.url);
      throw new Error("OpenAI returned no image");
    },
  },

  xai: {
    label: "xAI (Grok Imagine)",
    keys: ["XAI_API_KEY"],
    model: "grok-imagine-image-2.0",
    async listModels(key) {
      const j = await getJSON("https://api.x.ai/v1/image-generation-models", { Authorization: `Bearer ${key}` }, "xAI");
      return (j.models ?? j.data ?? []).map((m) => `${m.id}${m.aliases?.length ? `  (aliases: ${m.aliases.join(", ")})` : ""}`);
    },
    async generate(prompt, o, key) {
      const res = await fetch("https://api.x.ai/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: o.model,
          prompt,
          aspect_ratio: o.aspect,
          resolution: o.resolution === "1K" ? "1k" : "2k",
        }),
      });
      if (!res.ok) await fail(res, "xAI");
      const img = (await res.json()).data?.[0];
      if (img?.b64_json) return fromB64(img.b64_json);
      if (img?.url) return download(img.url);
      throw new Error("xAI returned no image");
    },
  },

  replicate: {
    label: "Replicate (any hosted model, default Nano Banana 2.1)",
    keys: ["REPLICATE_API_TOKEN"],
    model: "google/nano-banana-2.1",
    async listModels(key) {
      const j = await getJSON("https://api.replicate.com/v1/collections/text-to-image", { Authorization: `Bearer ${key}` }, "Replicate");
      return (j.models ?? []).map((m) => `${m.owner}/${m.name}  ${m.description?.slice(0, 70) ?? ""}`);
    },
    async generate(prompt, o, key) {
      const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
      const res = await fetch(`https://api.replicate.com/v1/models/${o.model}/predictions`, {
        method: "POST",
        headers: { ...headers, Prefer: "wait=60" },
        body: JSON.stringify({
          input: { prompt, aspect_ratio: o.aspect, resolution: o.resolution, output_format: o.format, ...(o.seed != null ? { seed: o.seed } : {}) },
        }),
      });
      if (!res.ok) await fail(res, "Replicate");
      let pred = await res.json();
      // Still running after the sync wait: poll until it settles.
      for (let i = 0; i < 60 && ["starting", "processing"].includes(pred.status); i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const poll = await fetch(pred.urls.get, { headers });
        if (!poll.ok) await fail(poll, "Replicate");
        pred = await poll.json();
      }
      if (pred.status !== "succeeded") throw new Error(`Replicate prediction ${pred.status}: ${pred.error ?? ""}`);
      const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
      if (typeof url !== "string") throw new Error("Replicate returned no image URL");
      return download(url);
    },
  },
};

export { ext };
