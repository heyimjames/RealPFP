# Writing a brief that doesn't look AI-generated

Use this when writing a `--brief` for a specific person or scene. These rules
come from tuning RealPFP against `nano-banana-2`. The random engine leans on
them but combines traits freely, so its prompts break them now and then; a
hand-written brief can follow them every time.

**Brief versus tail.** The script appends a tail for the chosen mode: skin
finish, colour, depth of field (profile and aspirational), no border, clean
text, correct anatomy. Leave all of that out of the brief. The brief carries
who, what they wear, the expression, the place, the light and the camera.

## The core rule: describe what real photos have

`nano-banana-2` has no negative-prompt field, and naming a flaw can summon it.
Spend the words on **positive physical description** of a real photograph:
pore texture, one light source, a single catchlight, correct anatomy. Keep
negation to a short tail at the end (the script appends one for you).

## What to put in a brief, in order

1. **Framing.** One shot distance: "Head-and-shoulders portrait", "Chest-up
   medium close-up", "Waist-up medium shot". Profile pictures stay close.
2. **Who.** Age as a number, background, gender, build. Give range: AI defaults
   everyone to slim, symmetrical and 28. "A heavier, fuller build", "a soft,
   rounder face", "a slightly receding hairline" all read as real.
3. **Hair, specifically.** Colour + style, ideally slightly undone: "air-dried
   wavy hair", "dark roots growing into bleached ends", "a few flyaways".
4. **Clothes with wear.** "a slightly wrinkled linen shirt", "a cream cable-knit
   sweater", "one sleeve pushed up higher than the other".
5. **Expression and pose.** Asymmetric and mid-moment beats a centred grin:
   "relaxed half-smile", "caught mid-sentence", "glancing just past the camera",
   "slight three-quarter turn". Never straight-on and dead-centre.
6. **Place.** Concrete and slightly ordinary: "busy coffee shop, other people
   blurred behind", "concrete stairwell", "on a Lisbon street, pastel tiled
   buildings behind".
7. **Light that matches the place and time.** One source, named: "window light
   from camera-left, natural soft shadow on the far cheek", "overcast daylight,
   no hard shadows". In profile mode keep it ordinary; the tail asks for deep
   focus, so don't ask for shallow blur. Weather, time and mood must agree:
   no grin in a storm, no golden hour at noon.
8. **Camera.** Pick one and let it set the depth of field: "shot on iPhone,
   everything roughly sharp" (snapshot) or "85mm f/2, gentle background blur"
   (polished). Film stock names ("Kodak Portra 400") push toward a graded,
   cinematic look, so use them sparingly.
9. **One imperfection** (Profile and Candid): "slightly off-centre framing",
   "a stray hair across the forehead", "faint lens flare in one corner".

## Words that backfire

- "radiant", "glowing", "flawless", "perfect skin", "beautiful" push toward
  waxy, over-smoothed skin. If skin needs a word beyond the tail's, name a
  real feature (freckles, laugh lines, a small mole), not a quality.
- "hyperrealistic", "8k", "ultra-detailed", "masterpiece" read as render cues.
- "creamy bokeh" on everything is a tell; real phone photos are mostly sharp.
- Heavy crossed arms, hands on face, interlaced fingers are where anatomy
  breaks. Prefer hands relaxed, in pockets, or out of frame.
- Visible text and logos garble. Keep signage blurred or out of shot.

## The three modes

| Mode | Feels like | Skin | Depth of field | Weather |
|---|---|---|---|---|
| `aspirational` | A great real photo you'd use on LinkedIn | Lightly retouched, pores still visible | Shallow, about f/2 | Pleasant, flattering light |
| `profile` | A friend took it on their phone | Real, unretouched | Deep, mostly sharp | Pleasant |
| `candid` | Documentary, imperfect | Anything goes | Anything | Anything, including rain and fog |

## Example brief

> Chest-up medium close-up. A 41-year-old Nigerian man with a short, slightly
> patchy beard and a neat side part, a fuller build, wearing a navy crewneck
> sweater with the collar of a white shirt showing. Relaxed half-smile, slight
> three-quarter turn to the left, hands out of frame. Sitting at a café table
> by the window, a flat white in front of him, other customers soft behind.
> Window light from camera-left, gentle shadow on the far cheek. Shot on a
> 50mm lens at f/2.8.

Run it with `--mode profile` or `--mode aspirational` and the script appends the
matching realism, anatomy, text and no-border guidance.
