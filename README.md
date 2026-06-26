# RealPFP — Profile Picture Generator

Generate realistic, natural-looking AI profile photos — not the glossy, plastic kind. Live at **[realpfp.vercel.app](https://realpfp.vercel.app)**.

You bring your own [fal.ai](https://fal.ai) API key (stored only in your browser), pick how you want the photos to look, and generate as many as you like.

## What it does

- **Three looks** — choose the vibe:
  - **Aspirational** — polished and professional, but still a believable real photo.
  - **Profile picture** — flattering but natural, like a photo you'd actually post.
  - **Authentic candid** — gritty, documentary, real-life imperfect.
- **Control who appears** — dial in the distribution of ethnicity and gender with simple sliders, or leave it to an even random mix.
- **Control what appears** — sliders for how often glasses, jewellery, hats, formal wear, pets, named locations and more show up.
- **Coherent scenes** — time of day, weather and lighting always make sense together (no smiling in a thunderstorm).
- **Variety** — age range, camera type, shot distance, poses, backgrounds, and real-world locations (Lisbon, Tokyo, NYC…).
- **Batch & export** — generate many at once, save favourites to a library, download single images or a ZIP. You can also write a custom prompt or upload a CSV of prompts.

## Getting started

You'll need [Node.js](https://nodejs.org) and a free [fal.ai API key](https://fal.ai/dashboard/keys).

```bash
npm install
npm run dev
```

Open **[http://localhost:2929](http://localhost:2929)**, click **Settings** (top right), and paste your fal.ai key. That's it — keys are kept in your browser and never sent to any server but fal.ai's.

## How it works

Each generation builds a detailed, randomised prompt from your chosen settings — combining traits, scene, lighting, camera and framing into natural-sounding descriptions — then sends it to fal.ai's image model. The prompt logic is deliberately tuned to avoid the usual "AI giveaways" (plastic skin, garbled text, mangled logos, every face dead-centre).

## Tech

Next.js · React · TypeScript · Tailwind CSS · fal.ai image API · deployed on Vercel.
