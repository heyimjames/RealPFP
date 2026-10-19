---
name: realpfp
description: "Generates realistic AI photos and profile pictures of people that don't look AI-generated. It writes prompts with the RealPFP engine and runs them on whatever image model is available: the project's own image API, an image MCP tool, or fal.ai, Gemini, OpenAI, xAI or Replicate. Use when someone needs portraits, headshots, avatars, placeholder faces for a mockup or demo, test users, team-page photos, or a batch of varied people, either random or matching a brief. Triggers on: profile picture, pfp, avatar, headshot, generate a photo of a person, fake face, placeholder people, realistic portrait, AI portrait, stock-style photo of someone, sample users, realpfp."
---

# RealPFP

**What it does:** turns a request for photos of people into finished image
files. It builds prompts with the RealPFP engine (traits, scene, light, camera,
framing, tuned to avoid plastic skin and mangled hands) and generates them
with whichever image generator the user has: their project's own, an MCP tool,
or one of five built-in APIs.

Everything runs through one script in this skill's folder. Below, `$RP` means
`node <this skill's folder>/scripts/realpfp.mjs` (usually
`~/.claude/skills/realpfp`, or `.claude/skills/realpfp` in a project). Needs
Node 18 or later.

```bash
$RP --help
```

## 1. Read the request

Work out, without asking unless it is truly unclear:

- **How many.** One portrait, or a batch (max 50 per run).
- **Random or specific.** "20 avatars for a dashboard mockup" is random.
  "A 40-something Irish nurse in scrubs" is a brief.
- **Mode.** `aspirational` (polished, LinkedIn-ready, the default), `profile`
  (natural phone snapshot), `candid` (documentary, any weather). Pick by who
  the people are meant to be: staff of a company (team list, team page, About
  page, headshot) is aspirational; customers or users of a product (user
  avatars, test accounts, comments, reviews in a mockup) is profile; "real",
  "gritty", "street" is candid.
- **Shape.** Square `1:1` for avatars, `4:5` or `3:4` for portraits, `16:9`
  for hero images.
- **Where to save.** The path the user gave; else inside their project if one
  is open (for example `public/avatars/`); else the current directory. Give
  each kind of image its own folder (`avatars/team`, `avatars/ceo`). Runs into
  an existing folder continue the numbering, so nothing is overwritten.

## 2. Choose the image generator

Never assume fal. Find every option first, then let the user pick.

1. **The project's own image API.** If a project is open, search it for
   existing image generation: `generateImage` / `experimental_generateImage`
   (Vercel AI SDK), `google.image(`, `openai.image(`, `xai.image(`,
   `images.generate` (OpenAI SDK), `@fal-ai/client`, `fal.subscribe`,
   `replicate.run`, `generateContent` with an image model, `grok-imagine`,
   or an API route whose name mentions image or generate. Read what you find:
   its model, the request body it takes (prompt, aspect or size), what it
   returns (base64, URL), and whether it is a dev-server route or only library
   code. A route still counts when the dev server isn't running; say in the
   question that it needs starting.
2. **Keys the script can use.** Run, passing the project's env file if it has
   one (names and sources are printed, never values):
   ```bash
   $RP --detect --env-file .env.local
   ```
   It checks fal, gemini, openai, xai and replicate in the environment, that
   file, and `~/.config/realpfp/.env`.
3. **Image MCP tools in this session**, such as a fal, Replicate or other
   image generation server. Only count a server that is connected and has a
   generate tool. One that still needs authentication counts as an option
   only if the user is willing to sign in.

Then decide:

- **Exactly one option:** say which one you're using and carry on. If it is
  the project's route and the server isn't up, ask the user to start it (or
  start it yourself if they say so).
- **Several:** ask with one AskUserQuestion, listing each option with its
  model. Put the project's own API first, marked recommended: it matches what
  the product ships, and it uses the account the project already pays for.
- **None:** ask which they want to set up. Keys come from fal.ai/dashboard/keys,
  aistudio.google.com/apikey, platform.openai.com/api-keys, console.x.ai or
  replicate.com/account/api-tokens. Offer to save it as `NAME=value` in
  `~/.config/realpfp/.env` (chmod 600). Never print a key, write one into a
  project, or commit it.

**Use the newest model.** The script's defaults were the newest on
2026-10-19 (Nano Banana 2.1 on fal, Gemini and Replicate; GPT Image 2.5 Flare
on OpenAI; Grok Imagine 2.0 on xAI), but these change every few weeks. Before
generating with a built-in provider, ask it what it has now:

```bash
$RP --list-models --provider openai --env-file .env.local
```

If a newer image model is listed than the default, pass it with `--model` and
tell the user which you used. For fal (no listing call), check
fal.ai/explore or search the web for its newest image endpoint. For the
project's own API, use whatever model it already calls; if that is clearly
outdated, mention it but don't change their code unasked.

`--dry-run` needs no key, so you can show sample prompts while this is
settled. The prompts were tuned on Nano Banana. They work on other models, but
check the first results more closely on OpenAI or xAI.

## 3. Build the command

**Random people** (let the engine vary everything):

```bash
$RP --count 12 --mode profile --out public/avatars
```

Narrow it with `--age 25-40`, `--gender woman`, `--ethnicity "Japanese"`,
`--even-mix` (uniform mix instead of the default Western skew), and
`--freq glasses=40,pets=0,hats=0` to set how often details appear.

For a set that sits side by side (a team list, a grid of avatars):

- Pass `--framing headshot` so every crop matches. Otherwise the engine varies
  it from extreme close-up to waist-up.
- Turn off details that stand out in a row:
  `--freq blackAndWhite=0,sunglasses=0,pets=0,onPhone=0,hats=0`.
- Gender is a coin flip per image, so 8 images can land 6/2. Pass `--balance`
  to alternate woman and man.

**A specific person or scene:** write a brief and pass it with `--brief`. Read
[references/prompt-craft.md](references/prompt-craft.md) first; it lists what
to describe, in what order, and the words that make results look fake. The
script appends the mode's realism, anatomy, text and no-border guidance.

```bash
$RP --mode aspirational --aspect 4:5 \
  --brief "Head-and-shoulders portrait. A 52-year-old Irish woman, ..."
```

Add `--raw` only if the user hands you a finished prompt they want sent
verbatim. `--dry-run` prints prompts without generating. `--seed <n>` repeats
an image exactly when the prompt is unchanged; use it to re-run one result at
a higher `--resolution`.

## 4. Run it and look

Each image costs credits on the chosen account. Confirm first for runs over
20 images or at 2K or 4K.

**Screen the prompts before paying for them.** For a batch, write them out
first, keeping the file out of the project (`public/` would serve it):

```bash
$RP <same flags> --out public/avatars \
  --prompts-only --prompts-file <scratchpad>/realpfp/prompts.json
```

Read them. The engine combines traits freely, so some contradict themselves:
a pose the crop can't show ("walking mid-stride" on a headshot, trousers in a
head-and-shoulders), two cameras ("iPhone" and "85mm f/1.4"), light that fights
the place (dappled tree shade in an office), flash at golden hour. Fix each
one by deleting the clashing phrase in the file. Leave the appended tail alone.

Then generate:

- **Built-in provider:** `--from-prompts <file> --out <dir> --provider <name>`,
  plus `--env-file` if the key lives in the project's env file. `--model <id>`
  overrides the default; on a "model not found" error, look up the provider's
  current model ID rather than guessing. (For one image, skip the file and run
  the command directly.)
- **The project's own API or an MCP tool:** send each entry's `prompt`, with
  its `aspect` if the generator takes one (if not, say the images come out at
  its default size). Save each image in `--out` as `<file>.<ext>`, taking the
  extension from what came back (PNG starts `89 50`, JPEG `FF D8`). Add
  `"generator": "<route or tool> / <model>"` to each entry in the prompts file
  so there's a record. Don't add code to the project for this; call what is
  there, or write a throwaway script in the scratchpad.

Then **open the saved images with Read** (a sample of a big batch) and check
for the tells: waxy skin, wrong finger counts, garbled text, mismatched light,
a crop that doesn't match its siblings. Regenerate the bad ones and delete the
rejects before handing over. A new run into the same folder continues the
numbering; `--from-prompts` with an edited entry replaces that one file.

Built-in providers also write `manifest.json` to the output folder (each
image's prompt, provider and model). For other generators the prompts file is
the record. Either way, any result can be reproduced or varied.

## 5. Report

Tell the user where the files are, which generator and model made them, how
many succeeded, and any failures with the error (out of credits, auth, rate
limit, model not found). If they are for a product, remind them these are synthetic people: fine for mockups, demos and
placeholders, not for passing off as real customers or reviewers.

## Keeping in step with the app

`scripts/engine.mjs` is generated from the RealPFP app's `app/page.tsx`. When
the app's prompt logic changes, run `bash scripts/sync-engine.sh <RealPFP
checkout>` from this skill's folder. Inside the RealPFP repo it finds the app
by itself.

Source: https://github.com/heyimjames/RealPFP (web app at realpfp.vercel.app).
