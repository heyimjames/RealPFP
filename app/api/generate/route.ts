import { NextRequest } from "next/server";

const FAL_API_URL = "https://fal.run/fal-ai/nano-banana-2";

export async function POST(request: NextRequest) {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return Response.json({ error: "FAL_KEY not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { prompts, settings } = body as {
    prompts: string[];
    settings: {
      aspect_ratio?: string;
      resolution?: string;
      output_format?: string;
      safety_tolerance?: string;
      seed?: number | null;
      enable_web_search?: boolean;
      thinking_level?: string | null;
    };
  };

  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
    return Response.json({ error: "No prompts provided" }, { status: 400 });
  }

  if (prompts.length > 100) {
    return Response.json(
      { error: "Maximum 100 prompts per request" },
      { status: 400 }
    );
  }

  const results: Array<{
    prompt: string;
    imageUrl: string | null;
    description: string;
    error: string | null;
  }> = [];

  for (const prompt of prompts) {
    const payload: Record<string, unknown> = {
      prompt,
      num_images: 1,
      aspect_ratio: settings?.aspect_ratio || "1:1",
      output_format: settings?.output_format || "png",
      safety_tolerance: settings?.safety_tolerance || "4",
      resolution: settings?.resolution || "1K",
      limit_generations: true,
    };

    if (settings?.seed != null) {
      payload.seed = settings.seed;
    }
    if (settings?.enable_web_search) {
      payload.enable_web_search = true;
    }
    if (settings?.thinking_level) {
      payload.thinking_level = settings.thinking_level;
    }

    try {
      const response = await fetch(FAL_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        results.push({
          prompt,
          imageUrl: null,
          description: "",
          error: `API error ${response.status}: ${errorText}`,
        });
        continue;
      }

      const data = await response.json();
      results.push({
        prompt,
        imageUrl: data.images?.[0]?.url || null,
        description: data.description || "",
        error: null,
      });
    } catch (err) {
      results.push({
        prompt,
        imageUrl: null,
        description: "",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return Response.json({ results });
}
