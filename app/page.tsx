"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { AlertTriangleIcon, ChevronDownIcon, RotateCwIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type GeneratedImage = {
  id: string;
  prompt: string;
  imageUrl: string;
  description: string;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
};

type Settings = {
  aspect_ratio: string;
  resolution: string;
  output_format: string;
  safety_tolerance: string;
  seed: number | null;
  enable_web_search: boolean;
  thinking_level: string | null;
};

type ParamConfig = { enabled: boolean; selected: string[] };

const RANDOM_TRAITS = {
  ages: [20, 22, 24, 25, 27, 28, 30, 32, 34, 35, 37, 39, 40, 42, 45, 48, 50, 55, 60, 63],
  ethnicities: [
    "East Asian", "South Asian", "Black", "White", "Hispanic", "Latino", "Latina",
    "Middle Eastern", "Southeast Asian", "Korean", "Japanese", "Chinese",
    "Ethiopian", "Filipino", "Indigenous American", "Biracial", "Pacific Islander",
    "North African", "Central Asian", "Caribbean",
  ],
  genders: ["woman", "man"],
  hairStyles: [
    "short hair", "shoulder-length hair", "long hair", "curly hair",
    "wavy hair", "straight hair", "a pixie cut", "a bob", "braids",
    "a fade haircut", "natural TWA hair", "a high top fade", "a bald head",
    "hair in a loose bun", "hair in a low ponytail", "hair pulled back",
    "a messy side part", "hair tucked behind one ear with loose strands falling out",
    "air-dried wavy hair", "a slightly grown-out buzz cut",
    "a half-up half-down style coming undone",
  ],
  hairColors: [
    "black", "dark brown", "light brown", "auburn", "blonde", "dirty blonde",
    "red", "ginger", "silver-streaked", "grey", "salt-and-pepper",
    "dark roots growing into bleached ends", "sun-lightened brown",
  ],
  expressions: [
    "warm smile showing teeth", "slight closed-mouth smile",
    "confident smirk", "relaxed half-smile", "big genuine laugh with eyes squeezed shut",
    "gentle warm smile", "easygoing grin", "soft shy smile",
    "thoughtful expression with slightly furrowed brow", "neutral resting face",
    "squinting slightly against the light",
    "caught mid-sentence with mouth slightly open",
    "subtle smirk like they just heard something funny",
    "looking slightly past the camera, distracted",
    "eyes crinkled from laughing a moment ago",
    "resting face with a hint of tiredness around the eyes",
    "one eyebrow slightly raised, skeptical look",
    "concentrating expression, lips pressed together",
  ],
  // Everyday/casual clothing — the base pool. Formal wear, big hoodies, etc.
  // live in their own frequency-gated pools (see FORMAL_CLOTHING / HOODIES).
  clothing: [
    "a navy crewneck sweater",
    "a vintage denim jacket with a fraying collar", "a light blue Oxford shirt",
    "a white linen blouse", "a dark green flannel shirt with the top button undone",
    "a mustard yellow turtleneck", "a fitted black turtleneck",
    "a white button-down shirt with sleeves rolled to the elbows",
    "a cream cable-knit sweater", "a dark olive henley shirt",
    "a slightly wrinkled linen shirt", "a faded band t-shirt under an open flannel",
    "a well-worn leather jacket", "a rain jacket half-zipped",
    "a simple grey v-neck t-shirt", "a puffer vest over a long-sleeve thermal",
    "a plaid shirt with one side untucked",
    "a zip-up fleece", "a denim jacket layered over a hoodie",
    "lightly baggy brown smart trousers and a tucked plain white tee",
    "a boxy short-sleeve cream t-shirt",
    "an oversized beige linen shirt, slightly creased",
    "wide-leg charcoal trousers with a soft grey crewneck tucked in",
    "a chunky cable-knit roll-neck jumper",
    "a crisp white shirt under a fine-gauge merino sweater",
  ],
  lighting: [
    "soft overcast light, no hard shadows",
    "golden hour sunlight from the side casting a long shadow",
    "natural window light from the left, one side of face darker",
    "bright midday sun creating hard shadows under the nose and chin",
    "soft diffused indoor lighting",
    "dappled light filtering through tree canopy, uneven across the face",
    "warm lamp light mixed with cool daylight from a window",
    "late afternoon light going orange",
    "harsh fluorescent overhead lighting",
    "backlit with sun creating a rim of light around the hair",
    "mixed color temperature — warm tungsten indoors and cool daylight from outside",
    "flat cloudy day light with no visible shadows",
    "single overhead kitchen light, unflattering angle",
    "porch light at dusk, yellowish",
    "bright open shade, even and cool",
    "phone camera flatness, slightly overexposed and washed out",
    "tungsten interior with no white balance correction, warm-yellow cast",
    "cool blue twilight, slightly underexposed",
    "uneven exposure with a bright window blown out behind them",
    "slightly muted indoor light, shadows a touch deeper than ideal",
    "iPhone HDR look, slightly crunchy with shadows lifted unnaturally",
    "overcast daylight with cool flat tones, slightly low contrast",
    "soft directional light from one side, a single realistic catchlight in the eyes",
    "window light from camera-left, gentle fill, natural soft shadow on the far cheek",
  ],
  settings: [
    "outdoors with blurred greenery behind",
    "busy sidewalk with pedestrians blurred behind",
    "outdoor park with a bench and trash can slightly visible",
    "office with a monitor glow and sticky notes on the wall behind",
    "hiking trail with dirt and rocks visible",
    "sitting near a window with condensation on the glass",
    "autumn leaves on the ground, some stuck to their shoe",
    "rocky beach with overcast sky",
    "university hallway with lockers",
    "plain apartment wall with a light switch visible",
    "busy coffee shop with other people blurred in the background",
    "parking lot with cars behind them",
    "kitchen with clutter slightly visible on the counter",
    "concrete stairwell in an apartment building",
    "standing in a doorway, half-inside half-outside",
    "backyard patio with string lights out of focus behind",
    "subway platform, tiled wall behind",
    "luxury hotel lobby with warm wood paneling and soft amber lamp light behind them",
    "gym entrance, glass door reflecting behind them",
    "framed through a car window, soft reflections on the glass",
    "in the passenger seat of a car, window light on the face",
    "in an airport terminal, departure boards softly blurred behind",
    "at an airport gate, large windows and a plane out of focus behind",
    "at a conference, lanyards and banners blurred in the background",
    "on a conference stage edge, stage lighting spill behind them",
    "at a café table, a flat white and a folded newspaper in front",
    "sitting on a low brick garden wall, hedge behind",
    "perched on a stone harbour wall, water out of focus behind",
  ],
  // Geographic settings. Kept deliberately time- and weather-neutral so the
  // Atmosphere axis stays in charge of light and sky — a location never says
  // "sunlit" or "at dusk" itself. When the Location control is on, one of these
  // replaces the generic setting above.
  locations: [
    "on a quiet street in Lisbon, pastel tiled buildings behind",
    "in a Tokyo backstreet, neon signs blurred behind",
    "on a New York City sidewalk, a yellow cab blurred behind",
    "in a Paris café, a zinc bar behind",
    "on a London street, a red double-decker bus blurred behind",
    "in a Barcelona plaza, Gothic stonework behind",
    "on an Amsterdam canal bridge, bikes blurred behind",
    "in a Marrakech medina, warm ochre walls behind",
    "on a Mexico City rooftop, the skyline behind",
    "in a Seoul side street, hangul signage behind",
    "on a Sydney coastal path, the harbour behind",
    "in an Istanbul market, hanging lamps blurred behind",
    "on a cobbled Rome street, a stone fountain behind",
    "in a Berlin courtyard, soft graffiti out of focus behind",
    "on a Rio beach boardwalk, palms behind",
    "in a Mumbai street scene, colour and motion blurred behind",
    "on a Scottish Highlands hillside, heather and stone behind",
    "in a Copenhagen square, cyclists blurred behind",
  ],
  // How far the subject sits from the camera. Becomes the framing prefix and
  // applies in both modes, so faces aren't all locked at the same crop.
  shotDistances: [
    "Extreme close-up, face fills the frame, cropped just above the brow and below the chin",
    "Close-up portrait, head and the top of the shoulders",
    "Head-and-shoulders portrait",
    "Chest-up medium close-up",
    "Waist-up medium shot, a little room around the subject",
    "Three-quarter shot from the knees up, environment visible",
    "Wider environmental shot, full upper body with space around them",
  ],
  // Pets: see the decomposed COMPANION model below — type / colour / coat /
  // size / action are now independent axes assembled at generation time.
  filmStyles: [
    "natural film grain, Kodak Portra 400 tones",
    "warm color grading, medium format feel",
    "clean digital, minimal post-processing",
    "analog warmth, visible grain",
    "Fuji Pro 400H color rendering",
    "earthy muted palette with gentle grain",
    "rich deep shadows, medium format quality",
    "soft matte color grading",
    "slightly desaturated, understated color",
    "straight out of camera JPEG with auto white balance",
    "slightly overexposed with blown-out highlights on one side",
    "crunchy high-contrast black levels",
  ],
  bodyAngles: [
    "slight three-quarter turn away from camera",
    "angled slightly to the left",
    "turned at a gentle angle to the right",
    "over-the-shoulder glance back at camera",
    "body turned sideways, head looking toward camera",
    "leaning slightly to one side",
    "body angled away, looking back over shoulder",
    "subtle diagonal angle, not straight-on",
  ],
  poses: [
    "sitting on a chair leaning slightly forward",
    "standing with arms loosely crossed",
    "leaning against a wall casually",
    "walking and caught mid-stride",
    "chin resting on hand",
    "hands in jacket pockets",
    "sitting on steps with elbows on knees",
    "perched on a stool, one foot on the rung",
    "mid-gesture while talking",
    "standing with one hand brushing hair back",
    "looking down at something in their hands",
    "standing relaxed with weight on one leg",
    "holding a coffee cup in one hand",
    "adjusting their glasses with one hand",
    "arms at their sides, slightly awkward",
    "leaning on a railing",
    "one hand running through their hair",
    "looking off to the side with a slight smile",
    "head tilted slightly, considering something",
    "hands clasped loosely in front, fingers interlaced",
    "one hand resting on the opposite forearm, arms folded casually",
    "leaning forward slightly with elbows on knees, hands clasped",
    "hand lifted to chin, lightly thoughtful",
    "leaning casually against a doorframe",
    "looking back over one shoulder, soft eye contact",
    "one hand tucked into a back pocket, the other relaxed",
    "lifting a coffee cup partway toward the mouth",
    "sleeves pushed up, hands clasped at the wrist",
    "sitting on a wall with one knee drawn up, relaxed",
    "perched on a wall, leaning back on both hands",
  ],
  depthsOfField: [
    "everything sharp like an iPhone photo, deep focus",
    "slight background softness, shot on 50mm f/2.8",
    "moderate bokeh, 85mm f/2 lens",
    "heavy creamy bokeh, 85mm f/1.4 wide open",
    "phone-camera sharp with no blur, everything in focus",
    "medium format shallow focus with smooth background separation",
    "point-and-shoot compact camera look, mostly sharp",
    "35mm f/1.8 with gentle background blur",
  ],
  candidnessLevels: [
    "polished professional headshot, subject aware of camera",
    "caught mid-laugh, natural documentary moment",
    "looking away from camera, lost in thought",
    "mid-conversation with someone off-frame",
    "glancing over shoulder as if just noticed the camera",
    "reacting to something off-camera with genuine surprise",
    "candid street photography style, unaware of photographer",
    "semi-posed but natural, like a friend took the photo",
  ],
  cameraTypes: [
    "shot on iPhone, natural phone photography look",
    "compact point-and-shoot camera",
    "DSLR with 50mm kit lens",
    "professional 85mm f/1.4 portrait lens",
    "medium format Hasselblad",
    "35mm film camera, Kodak Portra 400",
    "disposable camera with on-camera flash",
    "vintage film camera with slight light leak",
  ],
  skinDetails: [
    "visible forehead creases",
    "light freckles across the nose and cheeks",
    "faint acne scarring on one cheek",
    "visible smile lines around the mouth",
    "dark circles under the eyes",
    "a small mole near the jawline",
    "sun spots on the temples",
    "slightly chapped lips",
    "crow's feet visible when smiling",
    "light stubble shadow on the jaw",
    "slightly flushed cheeks from the cold",
    "a faint scar through one eyebrow",
    "dry skin patch on the forehead",
    "uneven skin tone, slightly redder around the nose",
    "visible pores on the nose and cheeks",
    "a few grey eyebrow hairs",
    "peeling skin on the nose from sunburn",
    "sweat visible on the forehead",
    "fine vellus hairs catching the light along the jaw and cheek",
    "natural under-eye shadow, slightly puffy",
    "subtle shine on the nose and forehead, matte elsewhere",
  ],
  photoImperfections: [
    "slightly off-center framing",
    "small lens flare in the corner",
    "faint sensor dust spot in the upper area",
    "slight vignetting at the edges",
    "horizon tilted a couple degrees",
    "background slightly more in focus than intended",
    "a stray hair across the forehead",
    "shirt collar popped up on one side",
    "shadow of the photographer barely visible at the bottom edge",
    "slight red-eye from the flash",
    "one hand slightly motion-blurred",
    "a flyaway hair catching the backlight",
    "fingerprint smudge on the lens causing slight haze on one side",
  ],
};

// Pets the subject is holding / interacting with. Decomposed into independent
// axes — TYPE, COLOUR, COAT, SIZE and the hold/ACTION all vary on their own —
// so results never repeat the same canned phrase. `type` carries its species,
// so a dog is never coloured like a cat, and `patterned` types (tabby, calico…)
// already encode colour, so the colour axis is skipped for them.
type CompanionType = {
  noun: string;
  species: "cat" | "dog";
  patterned?: boolean;
};
const COMPANION = {
  types: [
    { noun: "tabby cat", species: "cat", patterned: true },
    { noun: "calico cat", species: "cat", patterned: true },
    { noun: "tortoiseshell cat", species: "cat", patterned: true },
    { noun: "tuxedo cat", species: "cat", patterned: true },
    { noun: "shorthair cat", species: "cat" },
    { noun: "Persian cat", species: "cat" },
    { noun: "Siamese cat", species: "cat" },
    { noun: "Maine Coon cat", species: "cat" },
    { noun: "Bengal cat", species: "cat" },
    { noun: "Ragdoll cat", species: "cat" },
    { noun: "golden retriever", species: "dog" },
    { noun: "Labrador", species: "dog" },
    { noun: "dachshund", species: "dog" },
    { noun: "corgi", species: "dog" },
    { noun: "French bulldog", species: "dog" },
    { noun: "border collie", species: "dog" },
    { noun: "Samoyed", species: "dog" },
    { noun: "Weimaraner", species: "dog" },
    { noun: "beagle", species: "dog" },
    { noun: "cocker spaniel", species: "dog" },
    { noun: "Shiba Inu", species: "dog" },
    { noun: "Jack Russell terrier", species: "dog" },
  ] as CompanionType[],
  colours: [
    "ginger", "grey", "black", "white", "cream", "brown", "tan",
    "golden", "sandy", "chocolate-brown", "silver-grey", "black-and-white",
  ],
  // "" = no coat-texture word that time (keeps phrasing from getting samey).
  coats: ["", "fluffy", "sleek", "long-haired", "short-haired", "fuzzy", "scruffy"],
  sizes: ["", "tiny", "small", "large"],
  // Hold / interaction. `build` receives the assembled animal noun phrase.
  actions: [
    { label: "Held against the chest", build: (np: string) => `holding ${np} against their chest` },
    { label: "Cradled in both hands", build: (np: string) => `cradling ${np} in both hands` },
    { label: "Draped over one shoulder", build: (np: string) => `${np} draped over one shoulder` },
    { label: "Curled in the crook of the arm", build: (np: string) => `${np} curled in the crook of their arm` },
    { label: "Playing on their lap", build: (np: string) => `playing with ${np} on their lap` },
    { label: "Kneeling beside it", build: (np: string) => `kneeling beside ${np}, a hand resting on its back` },
    { label: "Held up near the face", build: (np: string) => `holding ${np} up near their face` },
    { label: "Sitting in their lap", build: (np: string) => `${np} sitting in their lap, looking up` },
    { label: "Scratching its ears", build: (np: string) => `scratching the ears of ${np} beside them` },
    { label: "Tucked under one arm", build: (np: string) => `holding ${np} tucked under one arm` },
    { label: "Leaning into them", build: (np: string) => `${np} leaning into them` },
    { label: "Held close", build: (np: string) => `holding ${np} close` },
  ],
};

// Assemble a pet clause from the independent axes, honouring each axis's
// enable/selection toggle. Returns null when the type axis is off (→ no pet).
function buildCompanion(
  pick: (key: string, defaults: readonly string[]) => string | null
): string | null {
  const noun = pick("petType", COMPANION.types.map((t) => t.noun));
  if (!noun) return null;
  const type = COMPANION.types.find((t) => t.noun === noun);
  if (!type) return null;

  const colour = type.patterned ? null : pick("petColour", COMPANION.colours);
  const coat = randomPick([...COMPANION.coats]);
  const size = randomPick([...COMPANION.sizes]);

  // ~30% of the time it's a young animal → kitten / puppy.
  let animalNoun = type.noun;
  if (Math.random() < 0.3) {
    animalNoun =
      type.species === "cat"
        ? animalNoun.replace(/\bcat\b/, "kitten")
        : `${animalNoun} puppy`;
  }

  const descriptors = [size, coat, colour, animalNoun].filter(Boolean);
  const np = `a ${descriptors.join(" ")}`.replace(/^a (?=[aeiou])/i, "an ");

  const actLabel = pick("petAction", COMPANION.actions.map((a) => a.label));
  const action =
    COMPANION.actions.find((a) => a.label === actLabel) ??
    randomPick([...COMPANION.actions]);
  return action.build(np);
}

// Expressions that read as overtly happy. Suppressed when an atmosphere has
// allowJoy: false — you don't grin through a thunderstorm.
const JOYFUL_EXPRESSIONS = new Set<string>([
  "warm smile showing teeth",
  "slight closed-mouth smile",
  "relaxed half-smile",
  "big genuine laugh with eyes squeezed shut",
  "gentle warm smile",
  "easygoing grin",
  "soft shy smile",
  "eyes crinkled from laughing a moment ago",
]);

// Time of day + weather + sky, bundled so they can never contradict each other
// (no "stormy golden hour"). Each entry also owns the matching `lighting`.
//   profileSafe  — appears in Profile mode (only pleasant weather does).
//   allowJoy     — joyful expressions allowed (false for dramatic weather).
//   outdoor      — scene is outside (gates the Location axis).
//   settingOverride — dramatic weather forces a sheltered backdrop so the
//                     person isn't implausibly out in it.
//   aspFavored   — the most flattering light; Aspirational mode biases to these.
type Atmosphere = {
  label: string;
  phrase: string;
  lighting: string;
  profileSafe: boolean;
  allowJoy: boolean;
  outdoor: boolean;
  settingOverride?: string;
  aspFavored?: boolean;
};

const ATMOSPHERES: Atmosphere[] = [
  // — Pleasant: available everywhere —
  { label: "Golden hour", phrase: "golden hour, clear sky", lighting: "warm golden-hour sunlight from the side, soft and low", profileSafe: true, allowJoy: true, outdoor: true, aspFavored: true },
  { label: "Bright clear midday", phrase: "clear blue sky, midday", lighting: "bright midday sun, clear sky, crisp natural shadows", profileSafe: true, allowJoy: true, outdoor: true },
  { label: "Soft overcast", phrase: "soft overcast, mild", lighting: "soft overcast daylight, no hard shadows", profileSafe: true, allowJoy: true, outdoor: true, aspFavored: true },
  { label: "Fresh sunny morning", phrase: "clear sky, early morning", lighting: "bright clear morning light, fresh and cool", profileSafe: true, allowJoy: true, outdoor: true },
  { label: "Hazy late afternoon", phrase: "light haze, late afternoon", lighting: "warm late-afternoon sun going orange, faint haze", profileSafe: true, allowJoy: true, outdoor: true, aspFavored: true },
  { label: "Blue-hour dusk", phrase: "clear, just after sunset", lighting: "cool blue twilight just after sunset, soft and even", profileSafe: true, allowJoy: true, outdoor: true, aspFavored: true },
  { label: "Light snowfall", phrase: "gentle snowfall, calm", lighting: "soft flat light through gently falling snow", profileSafe: true, allowJoy: true, outdoor: true },
  { label: "Dappled tree shade", phrase: "sunny, under tree canopy", lighting: "dappled light filtering through tree canopy, uneven across the face", profileSafe: true, allowJoy: true, outdoor: true },
  { label: "Backlit sun", phrase: "clear, sun behind them", lighting: "backlit by the sun, a soft rim of light around the hair, face a touch underexposed", profileSafe: true, allowJoy: true, outdoor: true, aspFavored: true },
  { label: "Window light indoors", phrase: "daytime, by a window", lighting: "natural window light from the side, one side of the face softly darker", profileSafe: true, allowJoy: true, outdoor: false, aspFavored: true },
  { label: "Sunlit indoors", phrase: "daytime, indoors", lighting: "soft daylight through a window, warm indoor tones, slightly uneven exposure", profileSafe: true, allowJoy: true, outdoor: false },
  { label: "Warm lamplit evening", phrase: "evening, indoors", lighting: "warm lamp light indoors in the evening", profileSafe: true, allowJoy: true, outdoor: false, aspFavored: true },
  // — Dramatic: Candid mode only, joy suppressed, sheltered backdrop —
  { label: "Overcast drizzle — candid only", phrase: "grey, light drizzle", lighting: "flat grey light from a drizzly overcast sky", profileSafe: false, allowJoy: false, outdoor: true, settingOverride: "sheltering under an awning, light rain falling behind them" },
  { label: "Heavy rain — candid only", phrase: "wet, heavy rain", lighting: "dim flat light, heavy rain streaking past", profileSafe: false, allowJoy: false, outdoor: true, settingOverride: "standing in a doorway out of the rain, wet street behind" },
  { label: "Thunderstorm — candid only", phrase: "dark storm outside", lighting: "dark stormy light, heavy clouds, low and moody", profileSafe: false, allowJoy: false, outdoor: false, settingOverride: "indoors at a window, rain lashing the glass, storm outside" },
  { label: "Thick fog — candid only", phrase: "thick fog, low visibility", lighting: "diffuse grey light in thick fog, very low contrast", profileSafe: false, allowJoy: false, outdoor: true, settingOverride: "on a foggy street, shapes dissolving into grey behind them" },
  { label: "Cold winter dusk — candid only", phrase: "overcast, cold dusk", lighting: "cold dim blue-grey winter dusk light", profileSafe: false, allowJoy: false, outdoor: true },
];

// ---- Frequency-gated content pools ----
// These used to live inside the flat clothing/accessory lists, which made
// "special" looks appear far too often (a uniform pick over ~36 items gives
// each ~3%, but with several suits in the list, formal wear hit ~20%). Pulling
// them into dedicated pools lets each be injected at a realistic, independent
// rate (see FREQUENCY_DEFAULTS), tunable per-option via the Appearance
// frequency sliders.
const FORMAL_CLOTHING = [
  "a well-cut navy suit with a slim tie",
  "a charcoal three-piece suit, top button done up",
  "a black tuxedo with a satin bow tie",
  "formal wedding attire, a fresh boutonnière on the lapel",
  "a tailored beige linen suit, no tie, collar open",
  "a charcoal suit jacket and a white open-collar shirt",
];
const HOODIE_CLOTHING = [
  "a big thick oversized knit hoodie, drawstrings hanging loose",
  "a heather grey hoodie with uneven strings",
  "a heavyweight charcoal hoodie under a wool overcoat",
];
const BW_FILM = [
  "black and white film, Kodak Tri-X 400 grain",
  "classic monochrome, deep blacks and soft greys",
  "high-contrast black and white, strong shadows",
];
const PHONE_POSES = [
  "holding a phone to the ear, mid-call, half-smiling",
  "glancing down at their phone, a faint smile",
];
const GLASSES = [
  "wire-frame glasses sitting slightly crooked",
  "thick-rimmed glasses",
  "reading glasses pushed up on top of the head",
  "round wire-frame glasses",
  "bold acetate-frame glasses",
  "thin rimless glasses",
];
const SUNGLASSES = [
  "sunglasses pushed up on the forehead",
  "dark sunglasses on, lenses reflecting the surroundings",
  "round tortoiseshell sunglasses worn",
  "aviator sunglasses pushed up into the hair",
];
const JEWELLERY = [
  "small gold hoop earrings",
  "a silver chain necklace tucked under the collar",
  "a thin gold wedding band",
  "stud earrings",
  "a single delicate chain bracelet",
  "a bold statement necklace catching the light",
  "layered fine gold necklaces",
  "a chunky signet ring on one finger",
  "small diamond stud earrings",
];
const HATS = [
  "a baseball cap worn slightly back",
  "a beanie pulled down to the eyebrows",
  "a felt fedora worn at a slight angle",
  "a smart charcoal flat cap",
  "a wide-brim wool hat",
  "a structured wool beret",
];
const MISC_ACCESSORIES = [
  "a beat-up digital watch",
  "a slim leather watch with a worn-in band",
  "AirPods in, one ear only",
  "over-ear headphones resting loose around the neck",
  "wired earphones in, the cord trailing into a pocket",
  "a lanyard with an ID badge clipped to the shirt",
  "a hoodie tied loosely around the neck by the sleeves",
  "a canvas tote bag strap visible over one shoulder",
  "a leather crossbody bag strap across the chest",
  "a knit scarf loose around the neck",
  "a vintage film camera slung around the neck on a leather strap",
  "a 35mm camera held casually at chest level",
];

// Appearance frequencies (% of photos). Realistic, independent defaults — each
// is its own probability, NOT a share of a whole. Surfaced as fill-sliders.
type FreqKey =
  | "namedLocation" | "glasses" | "sunglasses" | "jewellery" | "hats"
  | "formalWear" | "bigHoodie" | "blackAndWhite" | "pets" | "onPhone"
  | "miscAccessory";

const FREQUENCY_DEFS: { key: FreqKey; label: string; desc: string }[] = [
  { key: "namedLocation", label: "Named location / country", desc: "A real place (Lisbon, Tokyo…) instead of a generic backdrop" },
  { key: "glasses", label: "Glasses", desc: "Prescription eyewear" },
  { key: "jewellery", label: "Jewellery", desc: "Necklaces, earrings, rings, bracelets" },
  { key: "miscAccessory", label: "Other accessories", desc: "Watches, headphones, bags, scarves" },
  { key: "formalWear", label: "Formal wear", desc: "Suits, tuxedos, wedding attire" },
  { key: "hats", label: "Hats", desc: "Caps, fedoras, beanies, berets" },
  { key: "bigHoodie", label: "Big hoodies", desc: "Thick oversized hoodies" },
  { key: "sunglasses", label: "Sunglasses", desc: "Worn or pushed up" },
  { key: "blackAndWhite", label: "Black & white", desc: "Monochrome film look" },
  { key: "pets", label: "Pets", desc: "Cats & dogs of varied breeds" },
  { key: "onPhone", label: "On the phone", desc: "Mid-call or glancing at their phone" },
];

const FREQUENCY_DEFAULTS: Record<FreqKey, number> = {
  namedLocation: 30,
  glasses: 22,
  jewellery: 30,
  miscAccessory: 18,
  formalWear: 8,
  hats: 8,
  bigHoodie: 6,
  sunglasses: 5,
  blackAndWhite: 6,
  pets: 4,
  onPhone: 4,
};

// Default ethnicity weights — a Western/English-internet skew (a starting point
// the user re-dials with the sliders). Relative weights, normalised at pick.
const ETHNICITY_DEFAULT_WEIGHTS: Record<string, number> = {
  White: 55, Black: 13,
  Hispanic: 5, Latino: 4, Latina: 3,
  "East Asian": 3, "Southeast Asian": 2, Korean: 1, Japanese: 2, Chinese: 2, Filipino: 1,
  "South Asian": 6,
  "Middle Eastern": 2, Ethiopian: 1, "Indigenous American": 1, Biracial: 2,
  "Pacific Islander": 1, "North African": 1, "Central Asian": 1, Caribbean: 1,
};

// Fully-populated default weights map (every ethnicity in RANDOM_TRAITS gets a
// value), used for both the initial state and the control's Reset button.
const DEFAULT_ETHNICITY_WEIGHTS_STATE: Record<string, number> = Object.fromEntries(
  RANDOM_TRAITS.ethnicities.map((e) => [e, ETHNICITY_DEFAULT_WEIGHTS[e] ?? 1])
);

const AI_PARAM_DEFS = [
  {
    key: "location",
    label: "Location / country",
    desc: "Swap the generic backdrop for a real place — Lisbon, Tokyo, NYC…",
    options: RANDOM_TRAITS.locations,
  },
  {
    key: "atmosphere",
    label: "Time of day & weather",
    desc: "Coherent light + sky. Storms etc. are candid-only and never joyful.",
    options: ATMOSPHERES.map((a) => a.label),
  },
  {
    key: "shotDistance",
    label: "Shot distance",
    desc: "Extreme close-up through to a wider environmental shot",
    options: RANDOM_TRAITS.shotDistances,
  },
  {
    key: "petType",
    label: "Pet type & breed",
    desc: "Which cats & dogs are eligible (how often is set under Appearance frequency).",
    options: COMPANION.types.map((t) => t.noun),
  },
  {
    key: "petColour",
    label: "Pet colour",
    desc: "Coat colours drawn for non-patterned pets (tabby, calico etc. keep their own).",
    options: COMPANION.colours,
  },
  {
    key: "petAction",
    label: "Pet pose",
    desc: "How the pet is held or interacting — cradled, on the lap, leaning in…",
    options: COMPANION.actions.map((a) => a.label),
  },
  {
    key: "bodyAngle",
    label: "Body Angle",
    desc: "Three-quarter turns, over-shoulder, never straight-on",
    options: RANDOM_TRAITS.bodyAngles,
  },
  {
    key: "pose",
    label: "Pose",
    desc: "Sitting, leaning, walking, chin on hand, etc.",
    options: RANDOM_TRAITS.poses,
  },
  {
    key: "depthOfField",
    label: "Depth of Field",
    desc: "Phone-sharp to heavy 85mm f/1.4 bokeh",
    options: RANDOM_TRAITS.depthsOfField,
  },
  {
    key: "candidness",
    label: "Candidness",
    desc: "Pro headshot to caught-mid-moment documentary",
    options: RANDOM_TRAITS.candidnessLevels,
  },
  {
    key: "cameraType",
    label: "Camera Type",
    desc: "iPhone, DSLR, medium format, film, disposable",
    options: RANDOM_TRAITS.cameraTypes,
  },
] as const;

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Combine a hair colour with a hair style into a grammatical phrase. Naive
// concatenation broke on two fronts: "dark brown a bald head" (a bald head has
// no colour) and "dark brown a pixie cut" (the article landed before the
// colour). This inserts the colour after any leading article, and drops it
// entirely for bald/shaved styles.
function hairPhrase(color: string, style: string): string {
  if (/\b(bald|shaved)\b/i.test(style)) return style; // "a bald head" — no colour
  const m = style.match(/^(an?|the)\s+(.*)$/i);
  if (m) return `${m[1]} ${color} ${m[2]}`; // "a" + colour + "pixie cut"
  return `${color} ${style}`; // "dark brown short hair"
}

// Weighted random selection. Each key's chance is its weight ÷ the sum of all
// weights, so the numbers act as relative proportions, not absolutes — a 60/40
// split and a 6/4 split pick identically. Entries with weight <= 0 are skipped.
// Returns null when nothing is eligible (all weights 0), letting the caller
// fall back to uniform random.
function weightedPick(weights: Record<string, number>): string | null {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r < 0) return key;
  }
  // Float-rounding safety net: r should have crossed 0 above, but return the
  // last eligible entry just in case it didn't.
  return entries[entries.length - 1][0];
}

// Three points on a polish spectrum:
//   aspirational — most polished: beautified-but-real skin, quality cameras,
//                  flattering bokeh and light. The default.
//   profile      — flattering but realistic, phone-snapshot energy.
//   candid       — gritty documentary; nothing filtered out.
type GenerationMode = "aspirational" | "profile" | "candid";

// In Profile (and Aspirational) mode we filter out entries that produce
// real-but-unflattering photos — harsh lighting, tired/distracted expressions,
// drab backdrops. In Candid mode these all stay in for the documentary feel.
const PROFILE_MODE_EXCLUDES = {
  expressions: [
    "looking slightly past the camera, distracted",
    "resting face with a hint of tiredness around the eyes",
    "one eyebrow slightly raised, skeptical look",
  ],
  lighting: [
    "bright midday sun creating hard shadows under the nose and chin",
    "harsh fluorescent overhead lighting",
    "single overhead kitchen light, unflattering angle",
  ],
  settings: [
    "parking lot with cars behind them",
    "plain apartment wall with a light switch visible",
    "concrete stairwell in an apartment building",
    "subway platform, tiled wall behind",
    "university hallway with lockers",
  ],
  depthsOfField: [
    "heavy creamy bokeh, 85mm f/1.4 wide open",
    "medium format shallow focus with smooth background separation",
    "moderate bokeh, 85mm f/2 lens",
    "slight background softness, shot on 50mm f/2.8",
  ],
  // Profile pics live close to the face — drop the loosest crops so a PFP never
  // ends up as a distant full-body shot. Candid keeps the full range.
  shotDistances: [
    "Three-quarter shot from the knees up, environment visible",
    "Wider environmental shot, full upper body with space around them",
  ],
} as const;

// Aspirational mode is stricter than Profile about drab backdrops and flat
// phone-camera light, but LESS strict about depth of field — flattering bokeh
// is desirable here, so the DoF exclusions are lifted.
const ASPIRATIONAL_EXTRA_EXCLUDES: Partial<
  Record<keyof typeof PROFILE_MODE_EXCLUDES, readonly string[]>
> = {
  lighting: [
    "phone camera flatness, slightly overexposed and washed out",
    "iPhone HDR look, slightly crunchy with shadows lifted unnaturally",
    "uneven exposure with a bright window blown out behind them",
    "flat cloudy day light with no visible shadows",
    "porch light at dusk, yellowish",
    "slightly muted indoor light, shadows a touch deeper than ideal",
    "tungsten interior with no white balance correction, warm-yellow cast",
  ],
  settings: [
    "kitchen with clutter slightly visible on the counter",
    "gym entrance, glass door reflecting behind them",
    "office with a monitor glow and sticky notes on the wall behind",
    "busy sidewalk with pedestrians blurred behind",
    "standing in a doorway, half-inside half-outside",
  ],
};

// Aspirational curates toward quality glass and flattering separation.
const ASPIRATIONAL_CAMERAS = [
  "DSLR with 50mm kit lens",
  "professional 85mm f/1.4 portrait lens",
  "medium format Hasselblad",
  "35mm film camera, Kodak Portra 400",
];
const ASPIRATIONAL_DOF = [
  "heavy creamy bokeh, 85mm f/1.4 wide open",
  "medium format shallow focus with smooth background separation",
  "moderate bokeh, 85mm f/2 lens",
  "35mm f/1.8 with gentle background blur",
];
// When Aspirational does show a skin note, keep it flattering, never a flaw.
// Phrased toward real, matte, textured skin — not "radiant/glow" beauty-filter
// language, which on this model triggers the waxy, over-smoothed AI look.
const ASPIRATIONAL_SKIN = [
  "light freckles across the nose and cheeks",
  "healthy, even skin with natural texture and a soft matte finish",
  "soft, faint smile lines",
  "a small beauty mark near the jawline",
  "well-rested skin with visible pores and fine vellus hairs",
  "lightly sun-kissed skin with subtle natural texture",
];
// Subtle authenticity touches for Aspirational. A flawless, perfectly clean
// frame reads as stock/AI; these keep it a believable real photograph WITHOUT
// being unflattering — natural, not flaws.
const ASPIRATIONAL_REALISM = [
  "a few natural flyaway hairs catching the light",
  "a single realistic catchlight in the eyes from one light source",
  "slightly off-center, naturally composed framing",
  "a relaxed, candid micro-expression with a slightly asymmetric smile",
  "soft natural shadows on one side of the face, not studio-even",
  "fine natural skin texture, visible pores and vellus hairs in the light",
];
// Aspirational draws from elevated pools: well-groomed (but still natural) hair,
// smart-casual clothing, and tasteful accessories. The deliberately undone /
// scruffy options stay exclusive to Profile and Candid, where they read as real.
const ASPIRATIONAL_HAIR = [
  "short hair", "shoulder-length hair", "long hair", "wavy hair",
  "straight hair", "a pixie cut", "a bob", "curly hair", "braids",
  "a fade haircut", "a high top fade", "natural TWA hair", "a bald head",
  "hair in a neat low bun", "hair in a low ponytail", "hair pulled back",
  "a fresh, well-groomed cut", "a sleek blow-dried style",
  "softly styled glossy waves", "a sharp, clean fade",
];
const ASPIRATIONAL_CLOTHING = [
  "a well-cut navy blazer over a plain tee",
  "a tailored charcoal overcoat over a fine roll-neck",
  "a fine-gauge cashmere sweater",
  "a crisp white shirt under a fine-gauge merino sweater",
  "a pressed light blue Oxford shirt",
  "a smart camel coat over a crewneck",
  "a structured blazer with an open-collar shirt",
  "a polished black turtleneck",
  "a cream cable-knit sweater",
  "a navy crewneck sweater",
  "a well-fitted denim jacket over a clean white tee",
  "a wool overcoat over a soft grey crewneck",
  "a tailored knit polo",
  "wide-leg charcoal trousers with a soft grey crewneck tucked in",
];
const ASPIRATIONAL_MISC = [
  "a refined minimalist watch",
  "a slim leather watch with a worn-in band",
  "a leather crossbody bag strap across the chest",
  "a fine knit scarf draped at the neck",
  "over-ear headphones resting loose around the neck",
];
// Options that read as awkward, fidgety, or unposed-documentary — fine for
// Profile/Candid realism, but they undercut a polished Aspirational portrait.
// Filtered from the relevant pools only when mode === "aspirational".
const ASPIRATIONAL_POOL_EXCLUDES: Record<string, readonly string[]> = {
  pose: [
    "looking down at something in their hands",
    "arms at their sides, slightly awkward",
    "adjusting their glasses with one hand",
  ],
  candidness: [
    "reacting to something off-camera with genuine surprise",
    "candid street photography style, unaware of photographer",
    "glancing over shoulder as if just noticed the camera",
  ],
};

function applyModeFilter<K extends keyof typeof PROFILE_MODE_EXCLUDES>(
  list: readonly string[],
  category: K,
  mode: GenerationMode
): string[] {
  if (mode === "candid") return [...list];
  const excludes = new Set<string>(PROFILE_MODE_EXCLUDES[category]);
  if (mode === "aspirational") {
    // Flattering bokeh is wanted here — don't strip depth of field.
    if (category === "depthsOfField") excludes.clear();
    ASPIRATIONAL_EXTRA_EXCLUDES[category]?.forEach((e) => excludes.add(e));
  }
  return list.filter((item) => !excludes.has(item));
}

type PromptOptions = {
  params?: Record<string, ParamConfig>;
  ageRange?: [number, number];
  mode?: GenerationMode;
  /** Relative weights per ethnicity; omitted/all-zero falls back to uniform. */
  ethnicityWeights?: Record<string, number>;
  /** Relative weights per gender ("woman"/"man"); same fallback. */
  genderWeights?: Record<string, number>;
  /** Per-content appearance rates as percentages (0–100). */
  frequencies?: Partial<Record<FreqKey, number>>;
};

function generateRandomPrompt(opts: PromptOptions = {}): string {
  const { params, ageRange, mode = "profile", ethnicityWeights, genderWeights, frequencies } = opts;
  const [ageMin, ageMax] = ageRange ?? [25, 45];
  const age = Math.floor(Math.random() * (ageMax - ageMin + 1)) + ageMin;

  // Independent appearance-rate roll: each content type fires at its own % and
  // does not compete with the others.
  const freq = (k: FreqKey) => frequencies?.[k] ?? FREQUENCY_DEFAULTS[k];
  const roll = (k: FreqKey) => Math.random() * 100 < freq(k);

  // Ethnicity & gender honour a user-dialled distribution when present, else
  // uniform random. weightedPick returns null if every weight is 0.
  const ethnicity =
    (ethnicityWeights && weightedPick(ethnicityWeights)) ??
    randomPick(RANDOM_TRAITS.ethnicities);
  const gender =
    (genderWeights && weightedPick(genderWeights)) ??
    randomPick(RANDOM_TRAITS.genders);

  const hairStyle =
    mode === "aspirational"
      ? randomPick(ASPIRATIONAL_HAIR)
      : randomPick(RANDOM_TRAITS.hairStyles);
  const hairColor = randomPick(RANDOM_TRAITS.hairColors);
  const hair = hairPhrase(hairColor, hairStyle);

  // Clothing: formal wear and big hoodies are injected at their own rates;
  // otherwise the base pool — elevated smart-casual for Aspirational, everyday
  // casual for Profile/Candid.
  const baseClothing =
    mode === "aspirational" ? ASPIRATIONAL_CLOTHING : RANDOM_TRAITS.clothing;
  const clothing = roll("formalWear")
    ? randomPick(FORMAL_CLOTHING)
    : roll("bigHoodie")
      ? randomPick(HOODIE_CLOTHING)
      : randomPick(baseClothing);

  // Film look: occasional black & white, otherwise the colour grades. A B&W
  // roll is a deliberate choice, so it forces the film clause to be expressed
  // (see filmPart below) rather than being subject to the usual attach gate.
  const isBlackAndWhite = roll("blackAndWhite");
  const filmStyle = isBlackAndWhite
    ? randomPick(BW_FILM)
    : randomPick(RANDOM_TRAITS.filmStyles);

  // Controllable params: respect aiParams toggles + apply mode filter so
  // Profile mode can override even an explicit user selection of pro-bokeh.
  const pickControlled = (
    key: string,
    defaults: readonly string[],
    modeCategory?: keyof typeof PROFILE_MODE_EXCLUDES
  ): string | null => {
    if (params && !params[key]?.enabled) return null;
    let pool = params?.[key]?.selected?.length ? [...params[key].selected] : [...defaults];
    if (modeCategory) pool = applyModeFilter(pool, modeCategory, mode);
    // Aspirational drops the awkward/documentary options from pose & candidness.
    if (mode === "aspirational" && ASPIRATIONAL_POOL_EXCLUDES[key]) {
      const ex = new Set(ASPIRATIONAL_POOL_EXCLUDES[key]);
      const filtered = pool.filter((p) => !ex.has(p));
      if (filtered.length) pool = filtered;
    }
    if (!pool.length) pool = [...defaults];
    return randomPick(pool);
  };

  // Atmosphere = time of day + weather + sky, bundled so they can't contradict.
  // When on, it OWNS the lighting (and, for dramatic weather, the setting).
  let atmosphere: Atmosphere | null = null;
  if (!params || params.atmosphere?.enabled) {
    // Profile/Aspirational only ever see pleasant weather — no happy-in-a-storm.
    let pool = ATMOSPHERES.filter((a) => mode === "candid" || a.profileSafe);
    const selected = params?.atmosphere?.selected;
    if (selected?.length) {
      const sel = new Set(selected);
      const narrowed = pool.filter((a) => sel.has(a.label));
      if (narrowed.length) pool = narrowed;
    }
    // Aspirational biases toward the most flattering light within whatever's
    // allowed (soft, golden, window) — applied after user narrowing so an
    // explicit selection still wins.
    if (mode === "aspirational") {
      const favored = pool.filter((a) => a.aspFavored);
      if (favored.length) pool = favored;
    }
    if (pool.length) atmosphere = randomPick(pool);
  }

  // Lighting: atmosphere wins; otherwise the original independent pick.
  const lighting = atmosphere
    ? atmosphere.lighting
    : randomPick(applyModeFilter(RANDOM_TRAITS.lighting, "lighting", mode));

  // Expression: drop overtly joyful options when the weather forbids joy.
  let expressionPool = applyModeFilter(RANDOM_TRAITS.expressions, "expressions", mode);
  if (atmosphere && !atmosphere.allowJoy) {
    const sober = expressionPool.filter((e) => !JOYFUL_EXPRESSIONS.has(e));
    if (sober.length) expressionPool = sober;
  }
  const expression = randomPick(expressionPool);

  // Setting precedence: dramatic-weather shelter > named location (at its own
  // rate) > generic backdrop. The Location checkbox list still governs *which*
  // countries are eligible; the "namedLocation" frequency governs *how often*.
  const locationEnabled = !params || params.location?.enabled;
  const locationSel = params?.location?.selected;
  const locationPool = locationSel?.length
    ? RANDOM_TRAITS.locations.filter((l) => locationSel.includes(l))
    : RANDOM_TRAITS.locations;
  let setting: string;
  if (atmosphere?.settingOverride) {
    setting = atmosphere.settingOverride;
  } else if (locationEnabled && locationPool.length && roll("namedLocation")) {
    setting = randomPick(locationPool);
  } else {
    setting = randomPick(applyModeFilter(RANDOM_TRAITS.settings, "settings", mode));
  }

  const shotDistance = pickControlled("shotDistance", RANDOM_TRAITS.shotDistances, "shotDistances");
  const bodyAngle = pickControlled("bodyAngle", RANDOM_TRAITS.bodyAngles);
  // Pose: occasionally on the phone (at its own rate), otherwise the usual pool.
  // Aspirational never shows the phone — it reads too casual for a polished
  // portrait, regardless of the on-phone frequency.
  const pose =
    mode !== "aspirational" && roll("onPhone")
      ? randomPick(PHONE_POSES)
      : pickControlled("pose", RANDOM_TRAITS.poses);
  const candidness = pickControlled("candidness", RANDOM_TRAITS.candidnessLevels);

  // Aspirational curates camera & depth of field toward quality glass and
  // flattering bokeh, while still honouring the enable toggle and intersecting
  // any explicit user selection.
  const aspirationalPick = (key: string, quality: readonly string[]): string | null => {
    if (params && !params[key]?.enabled) return null;
    const sel = params?.[key]?.selected;
    const pool = sel?.length ? quality.filter((q) => sel.includes(q)) : [...quality];
    return randomPick(pool.length ? pool : [...quality]);
  };
  const dof =
    mode === "aspirational"
      ? aspirationalPick("depthOfField", ASPIRATIONAL_DOF)
      : pickControlled("depthOfField", RANDOM_TRAITS.depthsOfField, "depthsOfField");
  const camera =
    mode === "aspirational"
      ? aspirationalPick("cameraType", ASPIRATIONAL_CAMERAS)
      : pickControlled("cameraType", RANDOM_TRAITS.cameraTypes);

  // Pets: at their own rate, never on an extreme face-only crop (the animal
  // couldn't be seen), and never in Aspirational — a pet reads too casual for a
  // polished professional portrait.
  const tooTightForPet = !!shotDistance?.startsWith("Extreme close-up");
  const companion =
    mode !== "aspirational" && !tooTightForPet && roll("pets")
      ? buildCompanion(pickControlled)
      : null;

  // Aspirational draws only flattering skin notes; the others use the full
  // (mostly imperfection) list.
  const skin =
    mode === "aspirational"
      ? randomPick(ASPIRATIONAL_SKIN)
      : randomPick(RANDOM_TRAITS.skinDetails);

  // Accessories: independent rolls per category rather than one pick from a big
  // list, so each kind appears at a realistic, separately-tunable rate. Glasses
  // and sunglasses are mutually exclusive (can't wear both).
  const accessoryClauses: string[] = [];
  if (roll("glasses")) accessoryClauses.push(randomPick(GLASSES));
  else if (roll("sunglasses")) accessoryClauses.push(randomPick(SUNGLASSES));
  if (roll("jewellery")) accessoryClauses.push(randomPick(JEWELLERY));
  if (roll("hats")) accessoryClauses.push(randomPick(HATS));
  if (roll("miscAccessory"))
    accessoryClauses.push(
      randomPick(mode === "aspirational" ? ASPIRATIONAL_MISC : MISC_ACCESSORIES)
    );

  // Aspirational uses subtle authenticity touches (flyaway hair, real
  // catchlight) instead of the generic flaw list — they keep it a believable
  // real photo without being unflattering.
  const imperfection =
    mode === "aspirational"
      ? randomPick(ASPIRATIONAL_REALISM)
      : randomPick(RANDOM_TRAITS.photoImperfections);

  // Randomly include optional details to break the formula. Higher threshold =
  // rarer. Aspirational keeps flattering skin notes rare, but applies its
  // authenticity touches fairly often (~35%) so polished never tips into glossy
  // stock/AI. Profile is moderate; Candid keeps the original gritty-real rates.
  const skinThreshold = mode === "aspirational" ? 0.85 : mode === "profile" ? 0.5 : 0.25;
  const imperfectionThreshold = mode === "aspirational" ? 0.65 : mode === "profile" ? 0.75 : 0.45;
  const skinPart = Math.random() > skinThreshold ? `, ${skin}` : "";
  const accessoryPart = accessoryClauses.length ? `, ${accessoryClauses.join(", ")}` : "";
  const imperfectionPart = Math.random() > imperfectionThreshold ? `. ${imperfection}` : "";
  // Film-style references heavily steer toward graded/cinematic looks — the
  // biggest single AI-tell after smooth skin. Profile mode uses them sparingly;
  // Aspirational leans into a tasteful editorial grade a bit more.
  const filmThreshold = mode === "aspirational" ? 0.5 : mode === "profile" ? 0.65 : 0.15;
  const filmPart = isBlackAndWhite || Math.random() > filmThreshold ? `, ${filmStyle}` : "";
  const companionPart = companion ? `. ${companion[0].toUpperCase()}${companion.slice(1)}` : "";

  // Shot distance drives framing in BOTH modes so subjects aren't all locked at
  // the same crop. Profile mode's pool is pre-trimmed of the loosest crops
  // (see PROFILE_MODE_EXCLUDES.shotDistances) to keep results PFP-appropriate.
  const framingPrefix = shotDistance ? `${shotDistance}. ` : "";

  // Multiple template structures so prompts don't all read identically
  const templates = [
    // Scene-first: leads with where, then who
    () =>
      `${setting}, ${lighting}. A ${age}-year-old ${ethnicity} ${gender} with ${hair}${skinPart}${pose ? `, ${pose}` : ""}, wearing ${clothing}${accessoryPart}. ${expression}${bodyAngle ? `, ${bodyAngle}` : ""}. ${[dof, candidness].filter(Boolean).join(", ")}${filmPart}${camera ? `. ${camera}` : ""}${imperfectionPart}`,
    // Action-first: leads with what the person is doing
    () =>
      `A ${age}-year-old ${ethnicity} ${gender}${pose ? ` ${pose}` : ""}${candidness ? `, ${candidness}` : ""}. ${hair}, wearing ${clothing}${accessoryPart}. ${expression}${skinPart}. ${setting}, ${lighting}. ${[bodyAngle, dof].filter(Boolean).join(", ")}${filmPart}${camera ? `. ${camera}` : ""}${imperfectionPart}`,
    // Camera-first: leads with the technical look
    () =>
      `${camera ? `${camera}. ` : ""}${age}-year-old ${ethnicity} ${gender}, ${expression}${bodyAngle ? `, ${bodyAngle}` : ""}. ${hair}${skinPart}, wearing ${clothing}${accessoryPart}. ${[pose, setting].filter(Boolean).join(", ")}. ${lighting}${dof ? `, ${dof}` : ""}. ${candidness ?? ""}${filmPart}${imperfectionPart}`,
    // Descriptive: reads more like a caption
    () =>
      `Photo of a ${age}-year-old ${ethnicity} ${gender} with ${hair}${skinPart}${accessoryPart}${pose ? `, ${pose}` : ""}. Wearing ${clothing}, ${expression}. ${setting}, ${lighting}. ${[bodyAngle, dof, candidness, camera].filter(Boolean).join(", ")}${filmPart}${imperfectionPart}`,
  ];

  // Mode-specific quality suffix. Order matters: skin/exposure language goes
  // first because it's the most common AI giveaway in the model's baseline
  // output. Candid adds nothing (the gritty look is already in the traits).
  let qualitySuffix = "";
  if (mode === "profile") {
    qualitySuffix =
      ". Real matte skin showing visible pores, fine lines, natural blemishes and a slightly asymmetric face. Ordinary uneven lighting and exposure, true-to-life muted color with a neutral white balance. Background mostly in sharp focus, deep depth of field, everything roughly equally sharp. Off-center, casually-framed composition with the subject not perfectly centered. Looks like an ordinary phone snapshot a friend took. Keep skin texture real and unretouched — not airbrushed, not AI-smooth, no creamy background blur";
  } else if (mode === "aspirational") {
    // Beautified BUT real — the hard part. We explicitly forbid the plastic,
    // waxy, over-smoothed AI look while asking for a flattering light retouch,
    // so it reads as a great real photo rather than an obvious AI render.
    qualitySuffix =
      ". A real, authentic photograph of a real person, genuinely shot on a real camera in a real place — candid, believable and editorial-quality, the kind of photo you'd be proud to use professionally. Real human skin with a light, tasteful retouch: healthy and even, yet keeping its natural pores, fine vellus hairs, faint texture and tiny real-world irregularities clearly visible up close, with a soft matte finish and subtle shine only on the nose and forehead. Flattering soft directional light that shapes the face, with a single realistic catchlight in the eyes and gentle natural shadow on one side. True-to-life, slightly muted color with a neutral white balance. A relaxed, composed, slightly asymmetric expression. Clean, intentional composition with a natural shallow depth of field at about f/2 that gently separates the subject from the background. Keep it a genuine photograph — real skin texture, not plastic, waxy, over-airbrushed or AI-smooth, and not a glossy stock photo or 3D render";
  }
  const noBorderSuffix =
    ". Full-bleed photograph, no Polaroid frame, no white border around the image, no decorative edges";

  // Text & logos: garbled lettering and mangled logos are among the strongest
  // AI giveaways. Demand any incidental text/signage/branding be rendered
  // perfectly — correctly spelled, cleanly formed, accurate proportions — and
  // tell the model it is better to omit text or a logo entirely than to render
  // it badly. Applies in both modes.
  const textAndLogoSuffix =
    ". Any text, signage, or branding in the scene must be rendered with extra care: correctly spelled real words, cleanly formed and legible letterforms, no garbled, warped, or nonsensical text. Real brand names and logos are allowed only if reproduced accurately with correct shapes, proportions, and colors; if a logo or piece of text cannot be rendered cleanly and correctly, leave it out or keep it blurred and out of focus rather than showing a malformed version — badly rendered text and logos are a dead giveaway of a fake photo";

  // Anatomy: distorted limbs and hands are the single strongest AI giveaway
  // after skin, and crossed-arm / hand-near-face poses are where the model
  // slips. Phrased positive-first (nano-banana-2 has no negative-prompt field
  // and can *summon* what it's told to avoid), with a short negation tail and
  // the same "hide it rather than mangle it" fallback used for text. Applies in
  // every mode.
  const anatomySuffix =
    ". Anatomically correct and naturally proportioned: a real human body with believable bone structure, shoulders, arms and hands resting in natural, relaxed positions, every limb connected and bending correctly at real joints, each hand with exactly five normally-shaped fingers, and true-to-life head-to-body and facial proportions. Keep any visible hands, fingers, arms and shoulders clean, correctly formed and correctly counted; if a hand or arm cannot be rendered cleanly, let it fall naturally out of frame or rest relaxed and partly hidden rather than showing warped, extra, missing or fused fingers or limbs — mangled hands and distorted anatomy are a dead giveaway of a fake photo";

  return (framingPrefix + randomPick(templates)() + companionPart + qualitySuffix + noBorderSuffix + textAndLogoSuffix + anatomySuffix)
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .replace(/,\s*\./g, ".")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*$/, "")
    .trim();
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

// ---------- Settings content (shared between sidebar card and mobile drawer) ----------
function SettingsContent({
  settings,
  setSettings,
  falApiKey,
  setFalApiKey,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  falApiKey: string;
  setFalApiKey: (key: string) => void;
}) {
  // Auto-expand the API key panel when no key is set so first-time users
  // can see immediately where to paste it.
  const [apiKeyOpen, setApiKeyOpen] = useState(!falApiKey);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <button
          type="button"
          className="flex w-full items-center justify-between p-3 text-left"
          onClick={() => setApiKeyOpen(!apiKeyOpen)}
        >
          <div className="flex items-center gap-2">
            <Label className="cursor-pointer">FAL API Key</Label>
            {falApiKey && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-muted-foreground transition-transform duration-200 ${apiKeyOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {apiKeyOpen && (
          <div className="space-y-2 border-t px-3 pb-3 pt-2">
            <Input
              type="password"
              placeholder="Your fal.ai API key"
              value={falApiKey}
              onChange={(e) => setFalApiKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Get a key at{" "}
              <a
                href="https://fal.ai/dashboard/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                fal.ai/dashboard/keys
              </a>
            </p>
          </div>
        )}
      </div>

      <Separator />
      <div className="space-y-2">
        <Label>Aspect Ratio</Label>
        <Select
          value={settings.aspect_ratio}
          onValueChange={(v) =>
            v != null && setSettings((s) => ({ ...s, aspect_ratio: v }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="4:5">4:5 (Portrait)</SelectItem>
            <SelectItem value="3:4">3:4</SelectItem>
            <SelectItem value="2:3">2:3</SelectItem>
            <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
            <SelectItem value="4:3">4:3</SelectItem>
            <SelectItem value="3:2">3:2</SelectItem>
            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
            <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Resolution</Label>
        <Select
          value={settings.resolution}
          onValueChange={(v) =>
            v != null && setSettings((s) => ({ ...s, resolution: v }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5K">0.5K (Budget - 0.75x)</SelectItem>
            <SelectItem value="1K">1K (Standard)</SelectItem>
            <SelectItem value="2K">2K (1.5x cost)</SelectItem>
            <SelectItem value="4K">4K (2x cost)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Output Format</Label>
        <Select
          value={settings.output_format}
          onValueChange={(v) =>
            v != null && setSettings((s) => ({ ...s, output_format: v }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Seed (optional)</Label>
        <Input
          type="number"
          placeholder="Random"
          value={settings.seed ?? ""}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              seed: e.target.value ? parseInt(e.target.value) : null,
            }))
          }
        />
        <p className="text-sm text-muted-foreground">
          Same seed + same prompt = same image.{" "}
          <span className="cursor-help underline decoration-dotted" title="A seed is a number that controls the randomness of generation. Leave blank for a random result each time. Set a specific number (e.g. 42) to get the exact same image when using the same prompt — useful for tweaking a prompt while keeping the same face.">
            How does this work?
          </span>
        </p>
      </div>

      <Separator />

      <div className="rounded-md bg-muted p-3">
        <p className="text-foreground">Estimated cost</p>
        <p className="text-sm text-muted-foreground">
          $0.08 per image at 1K
          {settings.resolution === "2K" && " ($0.12 at 2K)"}
          {settings.resolution === "4K" && " ($0.16 at 4K)"}
          {settings.resolution === "0.5K" && " ($0.06 at 0.5K)"}
        </p>
      </div>
    </div>
  );
}

// Drag-to-fill scrubber: the whole row is the control. The label sits on the
// left, the value on the right, and a bar fills from the left in proportion to
// the value (Framer-style). Pointer-draggable and keyboard-accessible.
function FillSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  suffix = "",
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const snap = (v: number) =>
    Math.min(max, Math.max(min, Math.round(v / step) * step));
  const fromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return value;
    const r = el.getBoundingClientRect();
    return snap(min + ((clientX - r.left) / r.width) * (max - min));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = snap(value + step);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = snap(value - step);
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    else return;
    e.preventDefault();
    onChange(next);
  };
  const fillPct = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value}${suffix}`}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange(fromClientX(e.clientX));
      }}
      onPointerMove={(e) => {
        if (dragging.current) onChange(fromClientX(e.clientX));
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onKeyDown={onKeyDown}
      className="group/fill relative flex h-10 w-full cursor-ew-resize touch-none items-center justify-between overflow-hidden rounded-[5px] bg-stone px-3 outline-none select-none transition-colors fine-hover:hover:bg-[color-mix(in_srgb,var(--stone)_88%,var(--charcoal))] focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* No width transition: the fill pins to the cursor during a drag.
          Keyboard/click steps are small enough to read as instant. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--charcoal)_16%,var(--stone))] transition-colors group-hover/fill:bg-[color-mix(in_srgb,var(--charcoal)_22%,var(--stone))]"
        style={{ width: `${Math.max(0, Math.min(100, fillPct))}%` }}
      />
      <span className="relative z-10 truncate pr-2 text-sm text-foreground">
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </span>
      <span className="relative z-10 flex shrink-0 items-baseline gap-1.5 text-sm text-foreground tabular-nums">
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        <span>{value}{suffix}</span>
      </span>
    </div>
  );
}

// Distribution control (ethnicity, gender): an enable toggle plus a FillSlider
// per option. The slider value is a *relative weight*; the muted hint shows the
// resulting normalised share so the user can read the real percentages.
function WeightControl({
  title,
  description,
  enabled,
  onToggle,
  weights,
  defaults,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  weights: Record<string, number>;
  defaults: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  const keys = Object.keys(weights);
  const total = keys.reduce((s, k) => s + Math.max(0, weights[k]), 0);
  const activeCount = keys.filter((k) => weights[k] > 0).length;
  const pct = (k: string) =>
    total > 0 && weights[k] > 0 ? Math.round((weights[k] / total) * 100) : 0;

  return (
    <div className="rounded-md border p-3 space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-5 w-5 shrink-0 rounded border-input"
        />
        <span className="min-w-0 flex-1">
          <span className="text-sm text-foreground">{title}</span>
          <span className="block text-xs text-body-muted">{description}</span>
        </span>
        {enabled && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {activeCount}/{keys.length}
          </span>
        )}
      </label>

      {enabled && (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
              onClick={() => onChange({ ...defaults })}
            >
              Reset
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
              onClick={() => onChange(Object.fromEntries(keys.map((k) => [k, 50])))}
            >
              All equal
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
              onClick={() => onChange(Object.fromEntries(keys.map((k) => [k, 0])))}
            >
              Clear all
            </button>
            {total === 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                All zero → uniform
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {keys.map((k) => (
              <FillSlider
                key={k}
                label={k}
                value={weights[k]}
                min={0}
                max={100}
                step={1}
                hint={total > 0 ? `${pct(k)}%` : undefined}
                onChange={(v) => onChange({ ...weights, [k]: v })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Appearance-frequency control: a FillSlider per content type, each an
// independent 0–100% chance with a realistic default.
function FrequencyControl({
  defs,
  values,
  defaults,
  onChange,
}: {
  defs: { key: FreqKey; label: string; desc: string }[];
  values: Record<FreqKey, number>;
  defaults: Record<FreqKey, number>;
  onChange: (next: Record<FreqKey, number>) => void;
}) {
  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="text-sm text-foreground">Appearance frequency</span>
          <span className="block text-xs text-body-muted">
            How often each appears, as a % of photos. Drag to taste.
          </span>
        </span>
        <button
          type="button"
          className="shrink-0 text-sm text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
          onClick={() => onChange({ ...defaults })}
        >
          Reset
        </button>
      </div>
      <div className="space-y-1.5">
        {defs.map(({ key, label }) => (
          <FillSlider
            key={key}
            label={label}
            value={values[key]}
            min={0}
            max={100}
            step={1}
            suffix="%"
            onChange={(v) => onChange({ ...values, [key]: v })}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Landing hero ----------
// A sample of real generations (stored in /public/faces) shown large and
// scattered around the headline + CTA, previewing the variety the generator
// produces before the user touches anything. Purely decorative (aria-hidden).
// Freshly generated in Profile-picture mode (2026-07) with the improved prompts.
// Order: 0–5 are the six shown on mobile (a diverse, striking subset); 6–13 fill
// out the desktop scatter. FACE_SPOTS indexes into this array.
const SAMPLE_FACES = [
  "face-00.webp",
  "face-01.webp",
  "face-02.webp",
  "face-03.webp",
  "face-04.webp",
  "face-05.webp",
  "face-06.webp",
  "face-07.webp",
  "face-08.webp",
  "face-09.webp",
  "face-10.webp",
  "face-11.webp",
  "face-12.webp",
  "face-13.webp",
];

/* ─────────────────────────────────────────────────────────
 * LANDING HERO — full-screen scattered face preview + CTA
 *
 *   Large sample faces are hand-scattered around generous
 *   whitespace; the headline + button sit centred on top. The
 *   button is an in-page anchor that smooth-scrolls to #generator.
 *
 *   • Outer <span> owns positioning; inner <img> owns the bob,
 *     so the float never fights the centring transform.
 *   • Each circle floats on its own clock (varied dur/delay).
 *   • Decorative: faces are aria-hidden; motion respects
 *     prefers-reduced-motion (see .face-float in globals.css).
 * ───────────────────────────────────────────────────────── */
// Hand-placed scatter — percentages locate each circle's CENTRE. `s` scales the
// shared base diameter (--face-d); the denser inner circles are hidden on small
// screens so the centred copy keeps its breathing room.
type FaceSpot = {
  face: number;
  left: number;
  top: number;
  s: number;
  mobile?: boolean;
};
const FACE_SPOTS: FaceSpot[] = [
  // Mobile-visible six (faces 0–5) — kept inset (15–85%) so they stay fully round
  // and never clip into slivers at a phone-width edge; they frame the copy.
  { face: 0, left: 50, top: 11, s: 0.9, mobile: true },
  { face: 1, left: 16, top: 20, s: 1.0, mobile: true },
  { face: 2, left: 84, top: 18, s: 1.0, mobile: true },
  { face: 3, left: 17, top: 80, s: 0.85, mobile: true },
  { face: 4, left: 83, top: 79, s: 0.95, mobile: true },
  { face: 5, left: 50, top: 90, s: 0.8, mobile: true },
  // Desktop-only (faces 6–13) — inset enough that the full circle always clears
  // the edge (no half-moon clipping); the viewport is wide so they sit outward.
  { face: 6, left: 8, top: 49, s: 1.2 },
  { face: 7, left: 31, top: 33, s: 0.7 },
  { face: 8, left: 34, top: 87, s: 0.9 },
  { face: 9, left: 67, top: 22, s: 0.7 },
  { face: 10, left: 91, top: 43, s: 0.8 },
  { face: 11, left: 72, top: 85, s: 0.85 },
  { face: 12, left: 90, top: 87, s: 0.72 },
  { face: 13, left: 66, top: 67, s: 0.72 },
];

function LandingHero() {
  // Scroll parallax: publish window.scrollY onto the faces container as
  // --scroll-y (rAF-throttled); each face multiplies it by its own --depth.
  // One variable write drives every face. Skipped under reduced-motion.
  const facesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = facesRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--scroll-y", `${window.scrollY}px`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden px-6 [--face-d:clamp(76px,11vmin,150px)]">
      {/* Scattered floating faces — decorative preview of real generations */}
      <div
        ref={facesRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 animate-in fade-in duration-1000"
      >
        {FACE_SPOTS.map((spot, i) => (
          <span
            key={i}
            className={`face-spot pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 ${spot.mobile ? "" : "hidden sm:block"}`}
            style={{ left: `${spot.left}%`, top: `${spot.top}%` }}
          >
            {/* Layers, outer→inner: parallax (scroll) · float (idle bob,
                pauses on hover) · lift (hover pick-up) · img. Each owns one
                motion so they never fight. */}
            <div
              className="face-parallax"
              style={{ ["--depth" as string]: -(0.12 + (i % 5) * 0.05) }}
            >
              <div
                className="face-float"
                style={{
                  ["--float-dur" as string]: `${6 + (i % 5)}s`,
                  ["--float-delay" as string]: `-${(i % 7) * 0.8}s`,
                }}
              >
                <div
                  className="face-lift aspect-square overflow-hidden rounded-full ring-1 ring-black/[0.08] transition-[transform,box-shadow] duration-[350ms] ease-[cubic-bezier(0.34,1.4,0.5,1)] will-change-transform"
                  style={{ width: `calc(var(--face-d) * ${spot.s})` }}
                >
                  <img
                    src={`/faces/${SAMPLE_FACES[spot.face]}`}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </span>
        ))}
      </div>

      {/* Centred headline + CTA */}
      <div className="animate-in fade-in slide-in-from-bottom-2 relative z-10 flex max-w-xl flex-col items-center text-center duration-700 lg:max-w-5xl">
        <h1 className="text-4xl tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl lg:whitespace-nowrap">
          Profile pictures that look{" "}
          {/* Desktop: force exactly two lines (break after "look", no earlier wrap). Mobile: flows naturally. */}
          <br className="hidden lg:block" />
          like real people.
        </h1>
        <a
          href="#generator"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground transition-[transform,opacity] duration-200 active:scale-[0.97] fine-hover:hover:opacity-90"
        >
          Open the generator
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </a>
      </div>
    </section>
  );
}

// ---------- Main component ----------
function Home() {
  const isMobile = useIsMobile();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generateCountInput, setGenerateCountInput] = useState("1");
  const generateCount = Math.min(50, Math.max(1, parseInt(generateCountInput) || 1));
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [csvPrompts, setCsvPrompts] = useState<string[]>([]);
  const [falApiKey, setFalApiKeyState] = useState("");
  const abortRef = useRef(false);

  // Persist FAL API key to localStorage
  const setFalApiKey = (key: string) => {
    setFalApiKeyState(key);
    try {
      if (key) localStorage.setItem("ppg-fal-key", key);
      else localStorage.removeItem("ppg-fal-key");
    } catch {}
  };

  // AI Prompts tab state
  const [aiParams, setAiParams] = useState<Record<string, ParamConfig>>({
    location: { enabled: true, selected: [...RANDOM_TRAITS.locations] },
    atmosphere: { enabled: true, selected: ATMOSPHERES.map((a) => a.label) },
    shotDistance: { enabled: true, selected: [...RANDOM_TRAITS.shotDistances] },
    petType: { enabled: true, selected: COMPANION.types.map((t) => t.noun) },
    petColour: { enabled: true, selected: [...COMPANION.colours] },
    petAction: { enabled: true, selected: COMPANION.actions.map((a) => a.label) },
    bodyAngle: { enabled: true, selected: [...RANDOM_TRAITS.bodyAngles] },
    pose: { enabled: true, selected: [...RANDOM_TRAITS.poses] },
    depthOfField: { enabled: true, selected: [...RANDOM_TRAITS.depthsOfField] },
    candidness: { enabled: true, selected: [...RANDOM_TRAITS.candidnessLevels] },
    cameraType: { enabled: true, selected: [...RANDOM_TRAITS.cameraTypes] },
  });
  // Ethnicity distribution defaults to a realistic Western/internet skew and is
  // on by default; gender defaults to an even 50/50. Both are re-dialled with
  // the fill-sliders, or toggled off for a flat uniform random mix.
  const [ethnicityEnabled, setEthnicityEnabled] = useState(true);
  const [ethnicityWeights, setEthnicityWeights] = useState<Record<string, number>>(
    () => ({ ...DEFAULT_ETHNICITY_WEIGHTS_STATE })
  );
  const [genderEnabled, setGenderEnabled] = useState(false);
  const [genderWeights, setGenderWeights] = useState<Record<string, number>>({
    woman: 50,
    man: 50,
  });
  // Appearance frequencies (% per content type) — always applied; realistic defaults.
  const [frequencies, setFrequencies] = useState<Record<FreqKey, number>>({
    ...FREQUENCY_DEFAULTS,
  });
  const [ageRange, setAgeRange] = useState<[number, number]>([25, 45]);
  const [mode, setMode] = useState<GenerationMode>("aspirational");
  const [expandedParam, setExpandedParam] = useState<string | null>(null);
  const [paramDrawerKey, setParamDrawerKey] = useState<string | null>(null);

  // Saved library state
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);

  // Selection / regeneration state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const regeneratingRef = useRef<Set<string>>(new Set());

  // Lightbox / image detail state
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(
    null
  );
  const [lightboxVisible, setLightboxVisible] = useState(false);
  // Prompt disclosure inside the lightbox — collapsed by default so the image
  // is the hero; the prompt is power-user info revealed on demand.
  const [promptExpanded, setPromptExpanded] = useState(false);

  // Settings drawer (mobile)
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<Settings>({
    aspect_ratio: "1:1",
    resolution: "1K",
    output_format: "png",
    safety_tolerance: "4",
    seed: null,
    enable_web_search: false,
    thinking_level: null,
  });

  // Lightbox open/close
  const openLightbox = (image: GeneratedImage) => {
    setPromptExpanded(false); // always start collapsed
    if (isMobile) {
      setLightboxImage(image);
    } else {
      setLightboxImage(image);
      requestAnimationFrame(() => setLightboxVisible(true));
    }
  };

  const closeLightbox = () => {
    if (isMobile) {
      setLightboxImage(null);
    } else {
      setLightboxVisible(false);
      setTimeout(() => setLightboxImage(null), 200);
    }
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Prompt copied"))
      .catch(() => toast.error("Couldn't copy prompt"));
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxImage && !isMobile) {
        setLightboxVisible(false);
        setTimeout(() => setLightboxImage(null), 200);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxImage, isMobile]);

  // Track whether localStorage has been loaded. This is STATE, not a ref, on
  // purpose: the persist effects below must not observe it flip during the same
  // mount commit as the restore effect (that race would clobber restored data
  // with the initial empty array). As state, it only reads true on the *next*
  // render, so the persist effects skip the initial mount entirely.
  const [hydrated, setHydrated] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ppg-images");
      if (stored) {
        const parsed: GeneratedImage[] = JSON.parse(stored);
        const cleaned = parsed.map((img) =>
          img.status === "pending" || img.status === "generating"
            ? { ...img, status: "error" as const, error: "Session interrupted" }
            : img
        );
        setImages(cleaned);
      }
    } catch {}
    try {
      const storedKey = localStorage.getItem("ppg-fal-key");
      if (storedKey) setFalApiKeyState(storedKey);
    } catch {}
    try {
      const storedSaved = localStorage.getItem("ppg-saved");
      if (storedSaved) setSavedImages(JSON.parse(storedSaved));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist images to localStorage — only after hydration, so we never write
  // the initial empty array over restored data.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("ppg-images", JSON.stringify(images));
    } catch {}
  }, [hydrated, images]);

  // Persist saved images to localStorage — same hydration guard.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("ppg-saved", JSON.stringify(savedImages));
    } catch {}
  }, [hydrated, savedImages]);

  const generateImages = useCallback(
    async (prompts: string[]) => {
      if (prompts.length === 0) {
        toast.error("No prompts to generate");
        return;
      }

      abortRef.current = false;
      setIsGenerating(true);
      setProgress({ current: 0, total: prompts.length });

      const newImages: GeneratedImage[] = prompts.map((prompt, i) => ({
        id: `${Date.now()}-${i}`,
        prompt,
        imageUrl: "",
        description: "",
        status: "pending" as const,
      }));

      setImages((prev) => [...newImages, ...prev]);

      // Generate several at once instead of one-after-another. Capped so we
      // don't fire all N requests simultaneously and trip fal.ai rate limits.
      const CONCURRENCY = 4;
      let completed = 0;

      const processOne = async (i: number) => {
        // Honour cancellation: skip any image not yet started.
        if (abortRef.current) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === newImages[i].id && img.status === "pending"
                ? { ...img, status: "error", error: "Cancelled" }
                : img
            )
          );
          return;
        }

        setImages((prev) =>
          prev.map((img) =>
            img.id === newImages[i].id ? { ...img, status: "generating" } : img
          )
        );

        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompts: [prompts[i]],
              settings,
              ...(falApiKey && { falApiKey }),
            }),
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }
          const result = data.results[0];
          if (result.error) {
            throw new Error(result.error);
          }

          setImages((prev) =>
            prev.map((img) =>
              img.id === newImages[i].id
                ? {
                    ...img,
                    status: "done",
                    imageUrl: result.imageUrl,
                    description: result.description,
                  }
                : img
            )
          );
        } catch (err) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === newImages[i].id
                ? {
                    ...img,
                    status: "error",
                    error: err instanceof Error ? err.message : "Unknown error",
                  }
                : img
            )
          );
        } finally {
          completed += 1;
          setProgress({ current: completed, total: prompts.length });
        }
      };

      // Fixed-size worker pool: each worker pulls the next index until the
      // queue is drained. Images complete (and appear) as soon as they're ready.
      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < prompts.length) {
          const i = nextIndex++;
          await processOne(i);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, prompts.length) }, worker)
      );

      setIsGenerating(false);
      if (abortRef.current) {
        toast.info("Generation cancelled");
      } else {
        toast.success(
          `Generated ${prompts.length} image${prompts.length > 1 ? "s" : ""}`
        );
      }
    },
    [settings, falApiKey]
  );

  const handleGenerate = () => {
    const count = Math.max(1, Math.min(50, generateCount));
    const prompts = Array.from({ length: count }, () =>
      generateRandomPrompt({
        params: aiParams,
        ageRange,
        mode,
        ethnicityWeights: ethnicityEnabled ? ethnicityWeights : undefined,
        genderWeights: genderEnabled ? genderWeights : undefined,
        frequencies,
      })
    );
    generateImages(prompts);
  };

  const handleCustomGenerate = () => {
    const prompt = customPrompt.trim();
    if (!prompt) {
      toast.error("Enter a prompt first");
      return;
    }
    generateImages([prompt]);
  };

  const handleCSVGenerate = () => {
    if (csvPrompts.length === 0) {
      toast.error("Upload a file first");
      return;
    }
    generateImages(csvPrompts);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const prompts =
        lines[0]?.toLowerCase().includes("prompt") ? lines.slice(1) : lines;

      const cleaned = prompts.map((p) =>
        p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1) : p
      );

      setCsvPrompts(cleaned);
      toast.success(`Loaded ${cleaned.length} prompts from file`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };


  const downloadImage = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const filename = `profile-${image.id}.${settings.output_format}`;
      saveAs(blob, filename);
      toast.success("Image downloaded");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const downloadAllAsZip = async () => {
    const doneImages = images.filter((img) => img.status === "done");
    if (doneImages.length === 0) {
      toast.error("No images to download");
      return;
    }

    toast.info(`Preparing ZIP of ${doneImages.length} images...`);

    const zip = new JSZip();

    const fetched = await Promise.all(
      doneImages.map(async (img, i) => {
        try {
          const response = await fetch(img.imageUrl);
          const blob = await response.blob();
          return { i, blob };
        } catch {
          console.error(`Failed to fetch image ${i + 1}`);
          return null;
        }
      })
    );

    for (const result of fetched) {
      if (!result) continue;
      zip.file(
        `profile-${String(result.i + 1).padStart(2, "0")}.${settings.output_format}`,
        result.blob
      );
    }

    const content = await zip.generateAsync({
      type: "blob",
      compression: "STORE",
    });
    saveAs(content, `profile-pictures-${Date.now()}.zip`);
    toast.success(`Downloaded ${doneImages.length} images as ZIP`);
  };

  const clearImages = () => {
    setImages([]);
    setProgress({ current: 0, total: 0 });
    setSelectMode(false);
    setSelectedIds(new Set());
    try {
      localStorage.removeItem("ppg-images");
    } catch {}
  };

  const cancelGeneration = () => {
    abortRef.current = true;
  };

  // Delete a single image from the gallery
  const deleteImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Delete all selected images
  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    setImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    toast.success(`Deleted ${selectedIds.size} image${selectedIds.size > 1 ? "s" : ""}`);
  };

  // Toggle save/unsave an image to the library
  const toggleSaveImage = (image: GeneratedImage) => {
    setSavedImages((prev) => {
      const exists = prev.some((img) => img.id === image.id);
      if (exists) {
        return prev.filter((img) => img.id !== image.id);
      }
      return [{ ...image }, ...prev];
    });
  };

  const isImageSaved = (id: string) => savedImages.some((img) => img.id === id);

  const removeSavedImage = (id: string) => {
    setSavedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Regenerate a single image in-place with a fresh random prompt
  const regenerateOne = async (id: string) => {
    if (regeneratingRef.current.has(id)) return;
    regeneratingRef.current.add(id);

    const newPrompt = generateRandomPrompt({
      params: aiParams,
      ageRange,
      mode,
      ethnicityWeights: ethnicityEnabled ? ethnicityWeights : undefined,
      genderWeights: genderEnabled ? genderWeights : undefined,
      frequencies,
    });

    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, status: "generating", prompt: newPrompt, error: undefined }
          : img
      )
    );

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: [newPrompt], settings, ...(falApiKey && { falApiKey }) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      const result = data.results[0];
      if (result.error) throw new Error(result.error);

      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, status: "done", imageUrl: result.imageUrl, description: result.description }
            : img
        )
      );
    } catch (err) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, status: "error", error: err instanceof Error ? err.message : "Failed" }
            : img
        )
      );
    } finally {
      regeneratingRef.current.delete(id);
    }
  };

  // Batch regenerate all selected images (fire them all concurrently)
  const regenerateSelected = () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    setSelectMode(false);
    ids.forEach((id) => regenerateOne(id));
    toast.info(`Regenerating ${ids.length} image${ids.length > 1 ? "s" : ""}...`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const doneCount = images.filter((i) => i.status === "done").length;
  const errorCount = images.filter((i) => i.status === "error").length;

  // Helper to get the current param drawer def
  const activeParamDef = paramDrawerKey
    ? AI_PARAM_DEFS.find((d) => d.key === paramDrawerKey)
    : null;

  // Param option toggle helper
  const toggleParamOption = (paramKey: string, opt: string) => {
    setAiParams((prev) => {
      const cur = prev[paramKey].selected;
      return {
        ...prev,
        [paramKey]: {
          ...prev[paramKey],
          selected: cur.includes(opt)
            ? cur.filter((s) => s !== opt)
            : [...cur, opt],
        },
      };
    });
  };

  // ---------- Inline param options (desktop) ----------
  const renderParamOptionsInline = (
    paramKey: string,
    options: readonly string[]
  ) => (
    <div className="border-t bg-muted/30 px-3 py-2 space-y-1">
      <div className="flex gap-2 mb-1">
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
          onClick={() =>
            setAiParams((prev) => ({
              ...prev,
              [paramKey]: { ...prev[paramKey], selected: [...options] },
            }))
          }
        >
          Select all
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
          onClick={() =>
            setAiParams((prev) => ({
              ...prev,
              [paramKey]: { ...prev[paramKey], selected: [] },
            }))
          }
        >
          Clear all
        </button>
      </div>
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-2 cursor-pointer py-0.5"
        >
          <input
            type="checkbox"
            checked={aiParams[paramKey].selected.includes(opt)}
            onChange={() => toggleParamOption(paramKey, opt)}
            className="h-5 w-5 rounded border-input"
          />
          <span className="text-xs">{opt}</span>
        </label>
      ))}
    </div>
  );

  return (
    <>
      {/* Full-screen scattered-faces intro; CTA scrolls down to #generator */}
      <LandingHero />

      <div
        id="generator"
        className="mx-auto max-w-7xl scroll-mt-4 px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:px-8 lg:pb-8"
      >
      {/* Header — editorial: title */}
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl tracking-tight text-foreground sm:text-4xl">
            Profile pictures that look like real people.
          </h1>
        </div>
        {/* Mobile settings button */}
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden shrink-0"
          onClick={() => setSettingsOpen(true)}
        >
          Settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Prompt Input */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle>Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="generate">
                <TabsList className="mb-4 w-full justify-start overflow-x-auto !h-11 p-1">
                  <TabsTrigger value="generate" className="text-xs sm:text-sm">
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="options" className="text-xs sm:text-sm">
                    Options
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="text-xs sm:text-sm">
                    CSV
                  </TabsTrigger>
                </TabsList>

                {/* Generate Tab */}
                <TabsContent value="generate" className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-1">
                      <Label className="text-sm">How many images?</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={generateCountInput}
                        onChange={(e) =>
                          setGenerateCountInput(e.target.value.replace(/\D/g, "").slice(0, 2))
                        }
                        onBlur={() => setGenerateCountInput(String(generateCount))}
                        className="w-full sm:w-24"
                      />
                    </div>
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full sm:w-auto"
                    >
                      {isGenerating
                        ? "Generating..."
                        : `Generate ${generateCount} Image${generateCount > 1 ? "s" : ""}`}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Random prompts are created automatically using your Options settings.
                  </p>

                  <Separator />

                  {/* Collapsible custom prompt */}
                  <div>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-200 ${showCustomPrompt ? "rotate-90" : ""}`}
                      >
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                      Custom prompt
                    </button>
                    {showCustomPrompt && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          placeholder="Describe the profile photo you want to generate..."
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          rows={3}
                        />
                        <Button
                          onClick={handleCustomGenerate}
                          disabled={isGenerating || !customPrompt.trim()}
                          variant="outline"
                          className="w-full sm:w-auto"
                        >
                          {isGenerating ? "Generating..." : "Generate from Prompt"}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Options Tab */}
                <TabsContent value="options" className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <span className="meta-label">Mode</span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {([
                          {
                            key: "aspirational",
                            title: "Aspirational",
                            desc: "Polished, professional, beautified-but-real — the most flattering look.",
                          },
                          {
                            key: "profile",
                            title: "Profile picture",
                            desc: "Flattering but real, phone-snapshot energy — the photo you'd actually post.",
                          },
                          {
                            key: "candid",
                            title: "Authentic candid",
                            desc: "Harsh light, tired faces, mundane spots — full documentary feel.",
                          },
                        ] as const).map(({ key, title, desc }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setMode(key)}
                            aria-pressed={mode === key}
                            className={`flex min-h-[60px] flex-col gap-1.5 rounded-[5px] p-3 text-left transition-colors touch-manipulation ${
                              mode === key
                                ? "bg-paper-3"
                                : "bg-card fine-hover:hover:bg-paper-3/60"
                            }`}
                          >
                            <span className="text-[15px] leading-none text-foreground">
                              {title}
                            </span>
                            <span className="text-xs leading-snug text-body-muted">
                              {desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="meta-label">Age range</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {ageRange[0]} – {ageRange[1]}
                        </span>
                      </div>
                      <Slider
                        min={18}
                        max={75}
                        step={1}
                        value={ageRange}
                        onValueChange={(v) =>
                          Array.isArray(v) && v.length === 2 &&
                          setAgeRange([v[0] as number, v[1] as number])
                        }
                      />
                    </div>
                    <WeightControl
                      title="Ethnicity distribution"
                      description="Drag each share; set to 0 to exclude. Off = even random mix."
                      enabled={ethnicityEnabled}
                      onToggle={setEthnicityEnabled}
                      weights={ethnicityWeights}
                      defaults={DEFAULT_ETHNICITY_WEIGHTS_STATE}
                      onChange={setEthnicityWeights}
                    />
                    <WeightControl
                      title="Gender distribution"
                      description="Off = even 50/50. On = set the balance of women and men."
                      enabled={genderEnabled}
                      onToggle={setGenderEnabled}
                      weights={genderWeights}
                      defaults={{ woman: 50, man: 50 }}
                      onChange={setGenderWeights}
                    />
                    <FrequencyControl
                      defs={FREQUENCY_DEFS}
                      values={frequencies}
                      defaults={FREQUENCY_DEFAULTS}
                      onChange={setFrequencies}
                    />
                    <span className="meta-label pt-2">Photography parameters</span>
                    <p className="text-xs text-body-muted">
                      Control which traits are included in randomly generated prompts.
                      {" "}
                      {(() => {
                        const enabled = AI_PARAM_DEFS.filter((d) => aiParams[d.key].enabled);
                        const totalSelected = enabled.reduce((sum, d) => sum + aiParams[d.key].selected.length, 0);
                        const totalOptions = enabled.reduce((sum, d) => sum + d.options.length, 0);
                        return `${totalSelected}/${totalOptions} options selected across ${enabled.length}/${AI_PARAM_DEFS.length} params.`;
                      })()}
                    </p>
                    <div className="space-y-2">
                      {AI_PARAM_DEFS.map(({ key, label, desc, options }) => (
                        <div key={key} className="rounded-md border">
                          <div className="flex items-center gap-2 p-2 sm:p-2.5">
                            <input
                              type="checkbox"
                              checked={aiParams[key].enabled}
                              onChange={(e) =>
                                setAiParams((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    enabled: e.target.checked,
                                  },
                                }))
                              }
                              className="h-5 w-5 shrink-0 rounded border-input"
                            />
                            <button
                              type="button"
                              className="flex flex-1 items-center justify-between text-left min-w-0"
                              onClick={() => {
                                if (isMobile) {
                                  setParamDrawerKey(
                                    paramDrawerKey === key ? null : key
                                  );
                                } else {
                                  setExpandedParam(
                                    expandedParam === key ? null : key
                                  );
                                }
                              }}
                            >
                              <div className="min-w-0">
                                <span className="text-sm text-foreground">
                                  {label}
                                </span>
                                <p className="text-xs text-body-muted truncate">
                                  {desc}
                                </p>
                              </div>
                              <span className="ml-2 flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                                {aiParams[key].selected.length}/
                                {options.length}
                                <ChevronDownIcon
                                  className={`size-3.5 motion-safe:transition-transform duration-200 ease-out ${
                                    expandedParam === key ? "rotate-180" : ""
                                  }`}
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                              </span>
                            </button>
                          </div>

                          {/* Desktop: inline expand */}
                          {!isMobile &&
                            expandedParam === key &&
                            renderParamOptionsInline(key, options)}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* CSV Tab */}
                <TabsContent value="csv" className="space-y-3">
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center sm:p-8">
                    <p className="mb-2 text-sm text-muted-foreground">
                      Upload a CSV or text file with one prompt per line
                    </p>
                    <Input
                      type="file"
                      accept=".csv,.txt,.md"
                      onChange={handleCSVUpload}
                      className="mx-auto max-w-xs"
                    />
                  </div>
                  {csvPrompts.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {csvPrompts.length} prompts loaded
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCsvPrompts([])}
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={handleCSVGenerate}
                          disabled={isGenerating}
                        >
                          {isGenerating
                            ? "Generating..."
                            : `Generate ${csvPrompts.length} Image${csvPrompts.length > 1 ? "s" : ""}`}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Progress */}
          {isGenerating && (
            <Card>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="tabular-nums">
                      Generating {progress.current} / {progress.total}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={cancelGeneration}
                    >
                      Cancel
                    </Button>
                  </div>
                  <Progress
                    value={
                      progress.total > 0
                        ? (progress.current / progress.total) * 100
                        : 0
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl tracking-tight text-foreground sm:text-2xl">
                    Generated images
                  </h2>
                  <Badge variant="secondary">{doneCount} done</Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} failed</Badge>
                  )}
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  {selectMode ? (
                    <>
                      <Button
                        size="sm"
                        onClick={regenerateSelected}
                        disabled={selectedIds.size === 0}
                      >
                        Redo {selectedIds.size > 0 ? selectedIds.size : ""}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={deleteSelected}
                        disabled={selectedIds.size === 0}
                      >
                        Delete {selectedIds.size > 0 ? selectedIds.size : ""}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exitSelectMode}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {doneCount > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectMode(true)}
                        >
                          Select
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadAllAsZip}
                        disabled={doneCount === 0}
                        className="hidden sm:inline-flex"
                      >
                        Download ZIP
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearImages}
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile: download ZIP row */}
              {!selectMode && doneCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAllAsZip}
                  className="w-full sm:hidden"
                >
                  Download All as ZIP
                </Button>
              )}

              {/* Select mode hint */}
              {selectMode && (
                <p className="text-sm text-muted-foreground">
                  Tap images to select them, then Redo or Delete
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                {images.map((image) => {
                  const isSelected = selectedIds.has(image.id);
                  const isDone = image.status === "done" && image.imageUrl;

                  return (
                    <div
                      key={image.id}
                      className={`group relative overflow-hidden rounded-[5px] bg-paper-3 motion-safe:transition-[box-shadow] duration-150 ease-out ${
                        selectMode && isDone ? "cursor-pointer" : ""
                      } ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      }`}
                      onClick={
                        selectMode && isDone
                          ? () => toggleSelect(image.id)
                          : undefined
                      }
                    >
                      {isDone ? (
                        <>
                          <img
                            src={image.imageUrl}
                            alt={image.prompt.slice(0, 80)}
                            className={`aspect-square w-full object-cover transition-opacity ${
                              selectMode
                                ? isSelected
                                  ? "opacity-80"
                                  : ""
                                : "cursor-pointer active:opacity-90"
                            }`}
                            loading="lazy"
                            onClick={
                              !selectMode
                                ? () => openLightbox(image)
                                : undefined
                            }
                          />

                          {/* Selection checkmark overlay */}
                          {selectMode && (
                            <div className="absolute top-2 left-2 pointer-events-none">
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-white/80 bg-black/30"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action buttons (top-right, visible on hover / always on mobile) */}
                          {!selectMode && (
                            <div className="absolute top-1.5 right-1.5 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveImage(image);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm fine-hover:hover:bg-black/70 active:scale-95"
                                aria-label={isImageSaved(image.id) ? "Unsave from library" : "Save to library"}
                                title={isImageSaved(image.id) ? "Unsave" : "Save to library"}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={isImageSaved(image.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  regenerateOne(image.id);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm fine-hover:hover:bg-black/70 active:scale-95"
                                aria-label="Regenerate this image"
                                title="Regenerate"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                  <path d="M3 3v5h5" />
                                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                  <path d="M16 16h5v5" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteImage(image.id);
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm fine-hover:hover:bg-red-600/80 active:scale-95"
                                aria-label="Delete this image"
                                title="Delete"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                </svg>
                              </button>
                            </div>
                          )}

                          {/* Desktop hover overlay */}
                          {!selectMode && (
                            <div
                              className="absolute inset-0 hidden cursor-pointer items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
                              onClick={() => openLightbox(image)}
                            >
                              <div className="flex w-full items-center justify-between p-2">
                                <p className="line-clamp-2 text-xs text-white">
                                  {image.prompt.slice(0, 80)}...
                                </p>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(image);
                                  }}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : image.status === "generating" ? (
                        <div className="flex aspect-square items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent sm:h-8 sm:w-8" />
                        </div>
                      ) : image.status === "error" ? (
                        <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-destructive/5 p-4 text-center sm:gap-3 sm:p-5">
                          <AlertTriangleIcon
                            className="size-5 text-destructive sm:size-6"
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          <p className="line-clamp-4 text-xs leading-snug text-foreground/80 sm:text-[13px]">
                            {image.error || "Something went wrong."}
                          </p>
                          <button
                            onClick={() => regenerateOne(image.id)}
                            className="inline-flex items-center gap-1 rounded-[5px] bg-stone px-2.5 py-1 text-xs text-charcoal transition-colors touch-manipulation fine-hover:hover:bg-[color-mix(in_srgb,var(--stone)_70%,var(--charcoal))] fine-hover:hover:text-white"
                          >
                            <RotateCwIcon className="size-3" aria-hidden />
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            Queued
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved Library */}
          {savedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl tracking-tight text-foreground sm:text-2xl">
                    Saved library
                  </h2>
                  <Badge variant="secondary">{savedImages.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSavedImages([]);
                    toast.success("Saved library cleared");
                  }}
                >
                  Clear Saved
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                {savedImages.map((image) => (
                  <div
                    key={`saved-${image.id}`}
                    className="group relative overflow-hidden rounded-lg border bg-muted"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.prompt.slice(0, 80)}
                      className="aspect-square w-full cursor-pointer object-cover active:opacity-90"
                      loading="lazy"
                      onClick={() => openLightbox(image)}
                    />

                    {/* Action buttons */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm fine-hover:hover:bg-black/70 active:scale-95"
                        aria-label="Download saved image"
                        title="Download"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedImage(image.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm fine-hover:hover:bg-red-600/80 active:scale-95"
                        aria-label="Remove from saved library"
                        title="Remove from saved"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>

                    {/* Desktop hover overlay */}
                    <div
                      className="absolute inset-0 hidden cursor-pointer items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
                      onClick={() => openLightbox(image)}
                    >
                      <div className="flex w-full items-center justify-between p-2">
                        <p className="line-clamp-2 text-xs text-white">
                          {image.prompt.slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings Sidebar (desktop only) */}
        <div className="hidden space-y-6 lg:block">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsContent settings={settings} setSettings={setSettings} falApiKey={falApiKey} setFalApiKey={setFalApiKey} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer — credit + source link */}
      <footer className="mt-12 flex items-center justify-between gap-4 border-t border-stone pt-6 pb-2 sm:mt-16 sm:pt-8">
        <p className="meta-label">
          Made by{" "}
          <img
            src="/james-frewin.webp"
            alt=""
            width={20}
            height={20}
            className="inline-block size-5 rounded-full object-cover align-[-0.35em] ring-1 ring-stone"
            aria-hidden
          />{" "}
          <a
            href="https://jamesfrewin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-[3px] decoration-charcoal/40 transition-colors fine-hover:hover:decoration-charcoal/80"
          >
            James Frewin
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          {" · "}
          <a
            href="https://github.com/heyimjames"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors fine-hover:hover:text-foreground"
          >
            github.com/heyimjames
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </p>
        {/* Direct link to the open-source repo */}
        <a
          href="https://github.com/heyimjames/RealPFP"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View source on GitHub"
          title="View source on GitHub"
          className="shrink-0 text-muted-foreground transition-colors fine-hover:hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.7-4.04-1.6-4.04-1.6-.55-1.36-1.33-1.72-1.33-1.72-1.09-.72.08-.71.08-.71 1.2.08 1.83 1.2 1.83 1.2 1.07 1.78 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.29-5.47-1.29-5.47-5.75 0-1.27.47-2.31 1.24-3.12-.12-.29-.54-1.46.12-3.05 0 0 1.01-.31 3.3 1.19a11.7 11.7 0 0 1 3-.39c1.02 0 2.05.13 3 .39 2.28-1.5 3.29-1.19 3.29-1.19.66 1.59.24 2.76.12 3.05.77.81 1.24 1.85 1.24 3.12 0 4.47-2.81 5.45-5.49 5.74.43.36.81 1.08.81 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.22.68.83.56A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5Z" />
          </svg>
          <span className="sr-only">View source on GitHub (opens in new tab)</span>
        </a>
      </footer>

      {/* ==================== DRAWERS ==================== */}

      {/* Mobile Settings Drawer */}
      <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Configure image generation settings
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-2">
            <SettingsContent settings={settings} setSettings={setSettings} falApiKey={falApiKey} setFalApiKey={setFalApiKey} />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Mobile Param Options Drawer */}
      <Drawer
        open={!!paramDrawerKey}
        onOpenChange={(open) => {
          if (!open) setParamDrawerKey(null);
        }}
      >
        <DrawerContent>
          {activeParamDef && (
            <>
              <DrawerHeader>
                <DrawerTitle>{activeParamDef.label}</DrawerTitle>
                <DrawerDescription>{activeParamDef.desc}</DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-2">
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
                    onClick={() =>
                      setAiParams((prev) => ({
                        ...prev,
                        [activeParamDef.key]: {
                          ...prev[activeParamDef.key],
                          selected: [...activeParamDef.options],
                        },
                      }))
                    }
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline-offset-2 fine-hover:hover:text-foreground hover:underline"
                    onClick={() =>
                      setAiParams((prev) => ({
                        ...prev,
                        [activeParamDef.key]: {
                          ...prev[activeParamDef.key],
                          selected: [],
                        },
                      }))
                    }
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-1">
                  {activeParamDef.options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 rounded-md px-2 py-2.5 cursor-pointer active:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={aiParams[activeParamDef.key].selected.includes(
                          opt
                        )}
                        onChange={() =>
                          toggleParamOption(activeParamDef.key, opt)
                        }
                        className="h-5 w-5 shrink-0 rounded border-input"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Done
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Image Detail - Mobile Drawer */}
      {isMobile && (
        <Drawer
          open={!!lightboxImage}
          onOpenChange={(open) => {
            if (!open) setLightboxImage(null);
          }}
        >
          <DrawerContent className="max-h-[92vh]">
            {lightboxImage && (
              <>
                <DrawerHeader className="pb-2">
                  <DrawerTitle className="sr-only">Image Detail</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 pb-2 space-y-3">
                  <img
                    src={lightboxImage.imageUrl}
                    alt={lightboxImage.prompt.slice(0, 80)}
                    className="img-outline w-full rounded-lg object-contain"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPromptExpanded((v) => !v)}
                      aria-expanded={promptExpanded}
                      className="-ml-1 flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground active:scale-[0.97]"
                    >
                      <ChevronDownIcon
                        className={`size-3.5 motion-safe:transition-transform duration-200 ease-out ${promptExpanded ? "" : "-rotate-90"}`}
                        strokeWidth={2}
                        aria-hidden
                      />
                      Prompt
                    </button>
                    <button
                      onClick={() => copyPrompt(lightboxImage.prompt)}
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors active:scale-[0.96]"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div
                    className="grid motion-safe:transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
                    style={{ gridTemplateRows: promptExpanded ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lightboxImage.prompt}
                      </p>
                    </div>
                  </div>
                </div>
                <DrawerFooter className="flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => toggleSaveImage(lightboxImage)}
                      variant={isImageSaved(lightboxImage.id) ? "secondary" : "default"}
                    >
                      {isImageSaved(lightboxImage.id) ? "Unsave" : "Save"}
                    </Button>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => downloadImage(lightboxImage)}
                    >
                      Download
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const id = lightboxImage.id;
                        setLightboxImage(null);
                        regenerateOne(id);
                      }}
                    >
                      Redo
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        const id = lightboxImage.id;
                        setLightboxImage(null);
                        deleteImage(id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="ghost" className="w-full">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </>
            )}
          </DrawerContent>
        </Drawer>
      )}

      {/* Image Detail - Desktop Lightbox */}
      {!isMobile && lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={closeLightbox}
        >
          <div
            className="absolute inset-0 bg-black/80 motion-safe:transition-opacity duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
            style={{ opacity: lightboxVisible ? 1 : 0 }}
          />
          {/* Close — fixed to the viewport so it's always reachable */}
          <button
            onClick={closeLightbox}
            aria-label="Close"
            className="fixed right-4 top-4 z-[60] flex size-10 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-md transition-[background-color,scale] duration-150 ease-out fine-hover:hover:bg-white/20 active:scale-[0.96]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative z-10 flex max-h-[92vh] flex-col items-center gap-3 motion-safe:transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
            style={{
              opacity: lightboxVisible ? 1 : 0,
              transform: lightboxVisible ? "scale(1)" : "scale(0.97)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image is the hero. It gently shrinks to make room when the prompt
                opens, so nothing ever overflows the viewport. */}
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.prompt.slice(0, 80)}
              className={`img-outline-ondark w-auto max-w-[88vw] rounded-2xl object-contain shadow-2xl motion-safe:transition-[max-height] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                promptExpanded ? "max-h-[46vh]" : "max-h-[72vh]"
              }`}
            />

            {/* One cohesive toolbar: image actions on the left, a divider, then
                the prompt toggle + copy. Icons match the gallery's controls. */}
            <div className="flex shrink-0 items-center gap-0.5 rounded-2xl bg-black/60 p-1.5 shadow-lg backdrop-blur-md">
              <button
                onClick={() => toggleSaveImage(lightboxImage)}
                aria-label={isImageSaved(lightboxImage.id) ? "Unsave" : "Save to library"}
                title={isImageSaved(lightboxImage.id) ? "Unsave" : "Save to library"}
                className={`flex size-9 items-center justify-center rounded-xl transition-[background-color,scale] duration-150 ease-out active:scale-[0.92] fine-hover:hover:bg-white/12 ${
                  isImageSaved(lightboxImage.id) ? "text-white" : "text-white/85"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isImageSaved(lightboxImage.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <button
                onClick={() => downloadImage(lightboxImage)}
                aria-label="Download"
                title="Download"
                className="flex size-9 items-center justify-center rounded-xl text-white/85 transition-[background-color,scale] duration-150 ease-out active:scale-[0.92] fine-hover:hover:bg-white/12"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const id = lightboxImage.id;
                  closeLightbox();
                  regenerateOne(id);
                }}
                aria-label="Regenerate"
                title="Regenerate"
                className="flex size-9 items-center justify-center rounded-xl text-white/85 transition-[background-color,scale] duration-150 ease-out active:scale-[0.92] fine-hover:hover:bg-white/12"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const id = lightboxImage.id;
                  closeLightbox();
                  deleteImage(id);
                }}
                aria-label="Delete"
                title="Delete"
                className="flex size-9 items-center justify-center rounded-xl text-white/85 transition-[background-color,scale] duration-150 ease-out active:scale-[0.92] fine-hover:hover:bg-red-600/80 fine-hover:hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>

              <div className="mx-1 h-6 w-px bg-white/15" />

              <button
                onClick={() => setPromptExpanded((v) => !v)}
                aria-expanded={promptExpanded}
                className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm transition-[background-color,scale] duration-150 ease-out active:scale-[0.97] fine-hover:hover:bg-white/12 ${
                  promptExpanded ? "text-white" : "text-white/85"
                }`}
              >
                <ChevronDownIcon
                  className={`size-3.5 motion-safe:transition-transform duration-200 ease-out ${promptExpanded ? "" : "-rotate-90"}`}
                  strokeWidth={2}
                  aria-hidden
                />
                Prompt
              </button>
              <button
                onClick={() => copyPrompt(lightboxImage.prompt)}
                aria-label="Copy prompt"
                title="Copy prompt"
                className="flex size-9 items-center justify-center rounded-xl text-white/85 transition-[background-color,scale] duration-150 ease-out active:scale-[0.92] fine-hover:hover:bg-white/12"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>

            {/* Prompt expands beneath the toolbar; grid 0fr→1fr animates height
                smoothly, and the text scrolls within bounds. */}
            <div
              className="grid w-full max-w-[640px] shrink-0 motion-safe:transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{ gridTemplateRows: promptExpanded ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="max-h-[26vh] overflow-y-auto rounded-2xl bg-black/55 p-4 text-sm leading-relaxed text-white/85 shadow-lg backdrop-blur-md">
                  {lightboxImage.prompt}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(Home), { ssr: false });
