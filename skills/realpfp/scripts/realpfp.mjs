#!/usr/bin/env node
// RealPFP from the command line: build realistic portrait prompts with the
// RealPFP engine, then generate them with whichever image API is available
// (or hand the prompts to something else, like a project's own endpoint).
// Run `node realpfp.mjs --help` for options.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  generateRandomPrompt,
  AI_PARAM_DEFS,
  RANDOM_TRAITS,
  FREQUENCY_DEFAULTS,
  DEFAULT_ETHNICITY_WEIGHTS_STATE,
} from "./engine.mjs";
import { PROVIDERS, ext } from "./providers.mjs";

const MODES = ["aspirational", "profile", "candid"];
const CONCURRENCY = 4;
// --framing names mapped onto the engine's shot distances, tightest first.
const FRAMINGS = ["tight", "close", "headshot", "chest", "waist", "knees", "wide"];
const CONFIG_ENV = join(homedir(), ".config/realpfp/.env");

const HELP = `Usage: node realpfp.mjs [options]

Pick a backend
  --detect            list which image APIs have a key available, then exit
  --provider <p>      ${Object.keys(PROVIDERS).join(" | ")} (default: the only one
                      with a key; asks you to choose if several do)
  --model <id>        override the provider's default model
  --list-models       with --provider, ask that provider which image models it
                      offers right now (newest first where it says), then exit
  --env-file <path>   also read keys from this .env file (e.g. the project's)
  --prompts-only      write the prompts to a JSON file and stop: to review them
                      first, or to generate with something else (a project
                      endpoint, an MCP tool). Appends if the file exists
  --prompts-file <p>  where --prompts-only writes (default <out>/prompts.json)
  --from-prompts <p>  generate from a (reviewed, possibly edited) prompts file
                      instead of building new prompts

Who and how
  --mode <m>          aspirational (default) | profile | candid
  --count <n>         images to make, 1-50 (default 1)
  --age <n|a-b>       exact age or range (default 22-60)
  --gender <g>        woman | man (default 50/50 coin flip per image)
  --balance           alternate woman and man so a batch splits evenly
  --ethnicity <text>  any description, e.g. "Portuguese" (default: weighted mix)
  --even-mix          uniform ethnicity mix instead of the default skew
  --freq <k=v,...>    appearance rates in %, keys: ${Object.keys(FREQUENCY_DEFAULTS).join(", ")}
  --framing <f>       fix the crop for every image (default varies):
                      ${FRAMINGS.join(", ")}. knees and wide are candid only

Your own scene instead of a random one
  --brief <text>      describe the person and scene; the mode's realism and
                      anatomy/text/no-border guidance is appended for you
  --raw               with --brief, send the text exactly as written

Output
  --aspect <r>        1:1 (default), 4:5, 3:4, 2:3, 9:16, 16:9, 3:2, 4:3, 5:4, 21:9
                      (OpenAI clamps to 3:1; xAI's list differs slightly)
  --resolution <r>    1K (default) | 2K | 4K (xAI tops out at 2K)
  --format <f>        png (default) | jpg | webp, where the provider supports it
  --seed <n>          fixed seed where the provider supports it (fal, Gemini, Replicate)
  --out <dir>         output folder (default ./realpfp-<timestamp>); numbering
                      continues after files already there, nothing is overwritten
  --dry-run           print prompts only, no API call, no key needed

Keys are read from the environment, then --env-file, then ${CONFIG_ENV}
(KEY=value lines). Names per provider:
${Object.entries(PROVIDERS).map(([k, p]) => `  ${k.padEnd(10)} ${p.keys.join(", ")}`).join("\n")}`;

function parseArgs(argv) {
  const flags = new Set(["even-mix", "balance", "raw", "dry-run", "prompts-only", "detect", "list-models", "help"]);
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`Unexpected argument: ${a}`);
    const key = a.slice(2);
    if (flags.has(key)) out[key] = true;
    else {
      const v = argv[++i];
      if (v === undefined) throw new Error(`--${key} needs a value`);
      out[key] = v;
    }
  }
  return out;
}

// The engine bakes its realism guidance into the end of every prompt. Lift it
// off a freshly generated prompt so a hand-written brief gets the same tail.
function realismTail(mode) {
  const markers = {
    aspirational: "A real, authentic photograph of a real person",
    profile: "Real matte skin",
    candid: "Full-bleed photograph",
  };
  const p = generateRandomPrompt({ mode });
  const i = p.indexOf(markers[mode]);
  if (i < 0) throw new Error(`Engine changed: tail marker for ${mode} not found. Re-run sync-engine.sh and update realismTail().`);
  return p.slice(i);
}

function buildPrompts(o) {
  const mode = o.mode ?? "aspirational";
  if (!MODES.includes(mode)) throw new Error(`--mode must be one of ${MODES.join(", ")}`);
  const count = Math.max(1, Math.min(50, parseInt(o.count ?? "1", 10) || 1));

  if (o.brief) {
    const brief = o.brief.trim().replace(/\.\s*$/, "");
    return Array.from({ length: count }, () => (o.raw ? brief : `${brief}. ${realismTail(mode)}`));
  }

  let ageRange;
  if (o.age) {
    const [a, b] = o.age.split("-").map((n) => parseInt(n, 10));
    ageRange = [a, Number.isFinite(b) ? b : a];
  }
  const genderFor = (i) =>
    o.gender ? { [o.gender]: 1 } : o.balance ? { [i % 2 ? "man" : "woman"]: 1 } : undefined;
  const ethnicityWeights = o.ethnicity
    ? { [o.ethnicity]: 1 }
    : o["even-mix"] ? undefined : DEFAULT_ETHNICITY_WEIGHTS_STATE;
  const frequencies = { ...FREQUENCY_DEFAULTS };
  if (o.freq) {
    for (const pair of o.freq.split(",")) {
      const [k, v] = pair.split("=");
      if (!(k in FREQUENCY_DEFAULTS)) throw new Error(`Unknown --freq key: ${k}`);
      frequencies[k] = Math.max(0, Math.min(100, Number(v)));
    }
  }
  // Passing params switches the engine to "only what is enabled", so enable
  // every control and narrow just the shot distance.
  let params;
  if (o.framing) {
    const i = FRAMINGS.indexOf(o.framing);
    if (i < 0) throw new Error(`--framing must be one of ${FRAMINGS.join(", ")}`);
    if (i >= 5 && mode !== "candid") throw new Error(`--framing ${o.framing} only works with --mode candid; the other modes keep crops close`);
    params = Object.fromEntries(AI_PARAM_DEFS.map((d) => [d.key, { enabled: true, selected: [] }]));
    params.shotDistance.selected = [RANDOM_TRAITS.shotDistances[i]];
  }
  return Array.from({ length: count }, (_, i) =>
    generateRandomPrompt({ mode, ageRange, genderWeights: genderFor(i), ethnicityWeights, frequencies, params })
  );
}


// KEY=value lines; quotes stripped. Values are only ever used, never printed.
async function readEnvFile(path) {
  if (!path || !existsSync(path)) return {};
  const out = {};
  for (const line of (await readFile(path, "utf8")).split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

// Which providers have a key, and where it came from. The legacy
// ~/.config/realpfp/fal_key file still counts for fal.
async function findKeys(o) {
  const sources = [
    ["environment", process.env],
    [o["env-file"], await readEnvFile(o["env-file"])],
    [CONFIG_ENV, await readEnvFile(CONFIG_ENV)],
  ];
  const legacy = join(homedir(), ".config/realpfp/fal_key");
  const found = {};
  for (const [name, p] of Object.entries(PROVIDERS)) {
    for (const [where, vars] of sources) {
      const k = p.keys.find((k) => vars[k]?.trim());
      if (k) { found[name] = { key: vars[k].trim(), var: k, where }; break; }
    }
    if (!found[name] && name === "fal" && existsSync(legacy))
      found[name] = { key: (await readFile(legacy, "utf8")).trim(), var: "fal_key file", where: legacy };
  }
  return found;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) return console.log(HELP);

  if (o.detect) {
    const found = await findKeys(o);
    for (const [name, p] of Object.entries(PROVIDERS)) {
      const f = found[name];
      console.log(`${f ? "yes" : "no "}  ${name.padEnd(10)} ${p.label}${f ? `  [${f.var} from ${f.where}]` : ""}`);
    }
    return;
  }

  if (o["list-models"]) {
    const listKeys = await findKeys(o);
    const p = PROVIDERS[o.provider];
    if (!p) throw new Error(`--list-models needs --provider (${Object.keys(PROVIDERS).join(", ")})`);
    if (o.provider !== "fal" && !listKeys[o.provider]) throw new Error(`No key for ${o.provider}; listing needs one.`);
    console.log(`Default: ${p.model}\n${(await p.listModels(listKeys[o.provider]?.key)).join("\n") || "(no image models returned)"}`);
    return;
  }

  // From a reviewed prompts file, each entry keeps its own name and aspect.
  const fromFile = o["from-prompts"] ? JSON.parse(await readFile(o["from-prompts"], "utf8")) : null;
  const prompts = fromFile ? fromFile.map((e) => e.prompt) : buildPrompts(o);
  if (o["dry-run"]) {
    prompts.forEach((p, i) => console.log(`--- prompt ${i + 1} ---\n${p}\n`));
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = resolve(o.out ?? `realpfp-${stamp}`);
  await mkdir(outDir, { recursive: true });
  const aspect = o.aspect ?? "1:1";
  const promptsPath = resolve(o["prompts-file"] ?? join(outDir, "prompts.json"));
  const queued = !fromFile && existsSync(promptsPath) ? JSON.parse(await readFile(promptsPath, "utf8")) : [];
  // Numbering continues past saved images and prompts already queued, so
  // repeated runs into one folder never reuse a name.
  const index = (name) => Number(String(name).match(/^pfp-(\d+)/)?.[1] ?? 0);
  const offset = Math.max(0, ...(await readdir(outDir)).map(index), ...queued.map((e) => index(e.file)));
  const names = fromFile ? fromFile.map((e) => e.file) : prompts.map((_, i) => `pfp-${String(offset + i + 1).padStart(2, "0")}`);

  if (o["prompts-only"]) {
    const list = prompts.map((prompt, i) => ({ file: names[i], prompt, aspect, resolution: o.resolution ?? "1K" }));
    await mkdir(resolve(promptsPath, ".."), { recursive: true });
    await writeFile(promptsPath, JSON.stringify([...queued, ...list], null, 2));
    console.log(`${list.length} prompts added to ${promptsPath} (${queued.length + list.length} total)`);
    return;
  }

  const found = await findKeys(o);
  let name = o.provider;
  if (!name) {
    const avail = Object.keys(found);
    if (avail.length === 1) name = avail[0];
    else if (!avail.length) throw new Error("No image API key found. Run --detect, set a key, or use --prompts-only to generate some other way.");
    else throw new Error(`Several image APIs have keys (${avail.join(", ")}). Pick one with --provider.`);
  }
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown --provider ${name}. One of: ${Object.keys(PROVIDERS).join(", ")}`);
  if (!found[name]) throw new Error(`No key for ${name}. Expected one of ${provider.keys.join(", ")} in the environment, --env-file, or ${CONFIG_ENV}.`);

  const opts = {
    model: o.model ?? provider.model,
    aspect: fromFile?.[0]?.aspect ?? aspect,
    resolution: fromFile?.[0]?.resolution ?? o.resolution ?? "1K",
    format: o.format === "jpeg" ? "jpg" : o.format ?? "png",
    seed: o.seed != null ? Number(o.seed) : null,
  };
  if (name === "fal" && opts.format === "jpg") opts.format = "jpeg";
  console.log(`Generating ${prompts.length} with ${name} (${opts.model})`);

  const manifestPath = join(outDir, "manifest.json");
  const previous = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : [];
  const results = new Array(prompts.length);
  let next = 0;
  const worker = async () => {
    while (next < prompts.length) {
      const i = next++;
      const base = join(outDir, names[i]);
      try {
        const buf = await provider.generate(prompts[i], opts, found[name].key);
        const file = `${base}.${ext(buf)}`;
        await writeFile(file, buf);
        results[i] = { file, provider: name, model: opts.model, prompt: prompts[i], error: null };
        console.log(`ok   ${file}`);
      } catch (e) {
        results[i] = { file: null, provider: name, model: opts.model, prompt: prompts[i], error: e.message };
        console.log(`fail ${i + 1}: ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, prompts.length) }, worker));

  await writeFile(manifestPath, JSON.stringify([...previous, ...results], null, 2));
  const ok = results.filter((r) => !r.error).length;
  console.log(`\n${ok}/${prompts.length} saved to ${outDir} (prompts in manifest.json)`);
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
