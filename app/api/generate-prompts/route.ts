import Anthropic from "@anthropic-ai/sdk";

const PARAM_LABELS: Record<string, string> = {
  bodyAngle: "Body Angle",
  pose: "Pose",
  depthOfField: "Depth of Field",
  candidness: "Candidness",
  cameraType: "Camera Type",
};

const PARAM_GUIDANCE: Record<string, string> = {
  bodyAngle:
    "NEVER have the subject facing straight-on at the camera. Use ONLY the listed options.",
  pose: "Include the pose naturally in the scene. Use ONLY the listed options.",
  depthOfField:
    "Specify the lens or camera that produces the effect. Use ONLY the listed options.",
  candidness:
    "Not every subject should be aware of the camera. Use ONLY the listed options.",
  cameraType:
    "The camera choice should affect the overall image quality and feel. Use ONLY the listed options.",
};

const PARAM_DEFAULTS: Record<string, string> = {
  bodyAngle: "All subjects should face the camera directly.",
  depthOfField:
    'Default to "shallow depth of field, 85mm lens" for all shots.',
  candidness:
    "All subjects should be looking at the camera with a natural expression.",
  cameraType: "Default to professional DSLR quality for all shots.",
  pose: "Subject should be standing or sitting naturally.",
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { count, paramSelections } = body as {
    count: number;
    paramSelections: Record<string, string[]>;
  };

  if (!count || count < 1 || count > 50) {
    return Response.json(
      { error: "Count must be between 1 and 50" },
      { status: 400 }
    );
  }

  const enabledKeys = Object.keys(paramSelections || {});
  const allParamKeys = Object.keys(PARAM_LABELS);

  // Build instructions for enabled params with their specific options
  const paramInstructions = enabledKeys
    .filter((k) => PARAM_LABELS[k] && paramSelections[k]?.length > 0)
    .map((k) => {
      const options = paramSelections[k]
        .map((opt) => `"${opt}"`)
        .join(", ");
      return `- ${PARAM_LABELS[k]}: Choose from these options: ${options}. ${PARAM_GUIDANCE[k] || ""}`;
    })
    .join("\n");

  // Build defaults for disabled params
  const defaultInstructions = allParamKeys
    .filter((k) => !enabledKeys.includes(k))
    .map((k) => PARAM_DEFAULTS[k])
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are an expert portrait photography prompt writer for AI image generation. Your goal is to create prompts that produce photos indistinguishable from real photographs taken by real people in real life.

WHAT MAKES A PHOTO LOOK REAL (include these):
- Specific skin imperfections: name exactly what — forehead creases, acne scars on the left cheek, dark circles, a mole near the jaw, freckles across the nose, visible pores on the nose, chapped lips, crow's feet. Pick 1-2 per prompt, not all.
- Mundane real-world settings: parking lots, grocery stores, apartment hallways, office cubicles with monitors behind them, kitchen counters with clutter, subway platforms. Not just "park" or "city street."
- Imperfect clothing: a wrinkled linen shirt, a hoodie with uneven strings, a collar that's popped up on one side, sleeves pushed up unevenly, a jacket that's slightly too big.
- Natural awkward moments: caught mid-sentence, suppressing a yawn, squinting against the sun, one eye slightly closed, mid-blink, resting face with tiredness showing.
- Accessories that real people wear: crooked glasses, a beat-up watch, AirPods in one ear, a lanyard with an ID badge, a baseball cap, sunglasses pushed up on the forehead. Include in ~60% of prompts, skip the rest.
- Photo imperfections (include in ~40% of prompts): slightly off-center framing, a flyaway hair catching backlight, faint lens flare, slight motion blur on one hand, horizon tilted 2 degrees, fingerprint smudge on the lens.
- Vary the camera type: iPhone photos, disposable cameras, point-and-shoots, DSLRs, film cameras. Each produces very different looks. An iPhone photo looks nothing like a medium format Hasselblad shot.

WHAT MAKES A PHOTO LOOK AI (avoid these):
- Perfectly symmetrical faces or compositions
- Skin that's too smooth, poreless, or evenly lit
- Generic locations like "in a park" or "on a street" without specific details
- Every subject smiling warmly at camera — real photos catch people off-guard
- Identical prompt structure across all outputs — vary how you write them
- "Portrait photo of a..." as the start of every prompt
- Listing demographics like a police report (age, ethnicity, gender) at the very start every time

STRUCTURAL VARIETY:
- Start some prompts with the setting, some with the camera, some with what the person is doing
- Sometimes lead with the mood or moment, not the demographics
- Vary prompt length — some should be detailed, some more concise
- Write them like a photographer's shot notes, not like an AI prompt

CRITICAL RULES:
- Each prompt must describe a unique, specific person — vary age (18-65), ethnicity, gender, hair, clothing, setting
- Never repeat the same combination of traits across prompts
- Keep prompts as a single paragraph, no numbering or bullet points in the prompt itself

${paramInstructions ? `PHOTOGRAPHY PARAMETERS TO VARY:\n${paramInstructions}` : "Use default portrait photography settings."}

${defaultInstructions ? `DEFAULTS FOR OTHER PARAMETERS:\n${defaultInstructions}` : ""}

OUTPUT FORMAT: Return ONLY the prompts, one per line. No numbering, no explanations, no markdown. Just raw prompts separated by newlines.`;

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate exactly ${count} diverse portrait photography prompts. Each must describe a completely different person in a different setting. Write them like a photographer describing a shot they actually took — messy, specific, human. Include skin imperfections, real-world settings with mundane details, imperfect clothing, and natural expressions. Vary the structure of each prompt so they don't all read the same way.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const prompts = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return Response.json({ prompts });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate prompts",
      },
      { status: 500 }
    );
  }
}
