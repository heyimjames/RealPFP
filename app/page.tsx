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
    "mid-yawn they're trying to suppress",
    "concentrating expression, lips pressed together",
  ],
  clothing: [
    "a navy crewneck sweater", "a charcoal suit jacket and white open-collar shirt",
    "a vintage denim jacket with a fraying collar", "a light blue Oxford shirt",
    "a white linen blouse", "a dark green flannel shirt with the top button undone",
    "a mustard yellow turtleneck", "a fitted black turtleneck",
    "a heather grey hoodie with the strings uneven",
    "a white button-down shirt with sleeves rolled to the elbows",
    "a cream cable-knit sweater", "a dark olive henley shirt",
    "a slightly wrinkled linen shirt", "a faded band t-shirt under an open flannel",
    "a well-worn leather jacket", "a rain jacket half-zipped",
    "a simple grey v-neck t-shirt", "a puffer vest over a long-sleeve thermal",
    "scrubs with a lanyard visible", "a plaid shirt with one side untucked",
    "a zip-up fleece", "a denim jacket layered over a hoodie",
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
    "grocery store parking lot",
    "hotel lobby with generic art on the wall",
    "gym entrance, glass door reflecting behind them",
  ],
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
  ],
  accessories: [
    "wire-frame glasses sitting slightly crooked",
    "thick-rimmed glasses",
    "small gold hoop earrings",
    "a silver chain necklace tucked under the collar",
    "a beat-up digital watch",
    "no accessories",
    "no accessories",
    "no accessories",
    "a baseball cap worn slightly back",
    "a beanie pulled down to the eyebrows",
    "reading glasses pushed up on top of the head",
    "AirPods in, one ear only",
    "a thin gold wedding band",
    "stud earrings",
    "a lanyard with an ID badge clipped to the shirt",
    "sunglasses pushed up on the forehead",
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

const AI_PARAM_DEFS = [
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

function generateRandomPrompt(): string {
  const age = randomPick(RANDOM_TRAITS.ages);
  const ethnicity = randomPick(RANDOM_TRAITS.ethnicities);
  const gender = randomPick(RANDOM_TRAITS.genders);
  const hairStyle = randomPick(RANDOM_TRAITS.hairStyles);
  const hairColor = randomPick(RANDOM_TRAITS.hairColors);
  const expression = randomPick(RANDOM_TRAITS.expressions);
  const clothing = randomPick(RANDOM_TRAITS.clothing);
  const lighting = randomPick(RANDOM_TRAITS.lighting);
  const setting = randomPick(RANDOM_TRAITS.settings);
  const filmStyle = randomPick(RANDOM_TRAITS.filmStyles);
  const bodyAngle = randomPick(RANDOM_TRAITS.bodyAngles);
  const pose = randomPick(RANDOM_TRAITS.poses);
  const dof = randomPick(RANDOM_TRAITS.depthsOfField);
  const candidness = randomPick(RANDOM_TRAITS.candidnessLevels);
  const camera = randomPick(RANDOM_TRAITS.cameraTypes);
  const skin = randomPick(RANDOM_TRAITS.skinDetails);
  const accessory = randomPick(RANDOM_TRAITS.accessories);
  const imperfection = randomPick(RANDOM_TRAITS.photoImperfections);

  // Randomly include optional details to break the formula
  const skinPart = Math.random() > 0.25 ? `, ${skin}` : "";
  const accessoryPart = accessory !== "no accessories" ? `, ${accessory}` : "";
  const imperfectionPart = Math.random() > 0.45 ? `. ${imperfection}` : "";
  const filmPart = Math.random() > 0.15 ? `, ${filmStyle}` : "";

  // Multiple template structures so prompts don't all read identically
  const templates = [
    // Scene-first: leads with where, then who
    () =>
      `${setting}, ${lighting}. A ${age}-year-old ${ethnicity} ${gender} with ${hairColor} ${hairStyle}${skinPart}, ${pose}, wearing ${clothing}${accessoryPart}. ${expression}, ${bodyAngle}. ${dof}, ${candidness}${filmPart}. ${camera}${imperfectionPart}`,
    // Action-first: leads with what the person is doing
    () =>
      `A ${age}-year-old ${ethnicity} ${gender} ${pose}, ${candidness}. ${hairColor} ${hairStyle}, wearing ${clothing}${accessoryPart}. ${expression}${skinPart}. ${setting}, ${lighting}. ${bodyAngle}, ${dof}${filmPart}. ${camera}${imperfectionPart}`,
    // Camera-first: leads with the technical look
    () =>
      `${camera}. ${age}-year-old ${ethnicity} ${gender}, ${expression}, ${bodyAngle}. ${hairColor} ${hairStyle}${skinPart}, wearing ${clothing}${accessoryPart}. ${pose}, ${setting}. ${lighting}, ${dof}. ${candidness}${filmPart}${imperfectionPart}`,
    // Descriptive: reads more like a caption
    () =>
      `Photo of a ${age}-year-old ${ethnicity} ${gender} with ${hairColor} ${hairStyle}${skinPart}${accessoryPart}, ${pose}. Wearing ${clothing}, ${expression}. ${setting}, ${lighting}. ${bodyAngle}, ${dof}, ${candidness}, ${camera}${filmPart}${imperfectionPart}`,
  ];

  return randomPick(templates)()
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .replace(/,\s*\./g, ".")
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
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>FAL API Key</Label>
        <Input
          type="password"
          placeholder="Your fal.ai API key"
          value={falApiKey}
          onChange={(e) => setFalApiKey(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
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

      <div className="space-y-2">
        <Label>Safety Tolerance</Label>
        <Select
          value={settings.safety_tolerance}
          onValueChange={(v) =>
            v != null && setSettings((s) => ({ ...s, safety_tolerance: v }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 (Most strict)</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4 (Default)</SelectItem>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="6">6 (Least strict)</SelectItem>
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
        <p className="text-xs text-muted-foreground">
          Set a seed for reproducible results
        </p>
      </div>

      <div className="space-y-2">
        <Label>Thinking Level</Label>
        <Select
          value={settings.thinking_level ?? "none"}
          onValueChange={(v) =>
            v != null &&
            setSettings((s) => ({
              ...s,
              thinking_level: v === "none" ? null : v,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="minimal">Minimal (+$0.002)</SelectItem>
            <SelectItem value="high">High (+$0.002)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="web-search"
          checked={settings.enable_web_search}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              enable_web_search: e.target.checked,
            }))
          }
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="web-search" className="text-sm font-normal">
          Enable web search (+$0.015)
        </Label>
      </div>

      <Separator />

      <div className="rounded-md bg-muted p-3 text-sm">
        <p className="font-medium">Estimated cost</p>
        <p className="text-muted-foreground">
          $0.08 per image at 1K
          {settings.resolution === "2K" && " ($0.12 at 2K)"}
          {settings.resolution === "4K" && " ($0.16 at 4K)"}
          {settings.resolution === "0.5K" && " ($0.06 at 0.5K)"}
        </p>
      </div>
    </div>
  );
}

// ---------- Main component ----------
function Home() {
  const isMobile = useIsMobile();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [singlePrompt, setSinglePrompt] = useState("");
  const [bulkPrompts, setBulkPrompts] = useState("");
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
    bodyAngle: { enabled: true, selected: [...RANDOM_TRAITS.bodyAngles] },
    pose: { enabled: true, selected: [...RANDOM_TRAITS.poses] },
    depthOfField: { enabled: true, selected: [...RANDOM_TRAITS.depthsOfField] },
    candidness: { enabled: true, selected: [...RANDOM_TRAITS.candidnessLevels] },
    cameraType: { enabled: true, selected: [...RANDOM_TRAITS.cameraTypes] },
  });
  const [expandedParam, setExpandedParam] = useState<string | null>(null);
  const [paramDrawerKey, setParamDrawerKey] = useState<string | null>(null);
  const [aiPromptCount, setAiPromptCount] = useState(5);
  const [aiPrompts, setAiPrompts] = useState("");
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

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

  // Track whether localStorage has been loaded
  const hydratedRef = useRef(false);

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
    hydratedRef.current = true;
  }, []);

  // Persist images to localStorage on change (skip initial empty render)
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem("ppg-images", JSON.stringify(images));
    } catch {}
  }, [images]);

  // Persist saved images to localStorage on change (skip initial empty render)
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem("ppg-saved", JSON.stringify(savedImages));
    } catch {}
  }, [savedImages]);

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

      for (let i = 0; i < prompts.length; i++) {
        if (abortRef.current) {
          toast.info("Generation cancelled");
          // Mark all remaining queued images as cancelled
          const remainingIds = new Set(
            newImages.slice(i).map((img) => img.id)
          );
          setImages((prev) =>
            prev.map((img) =>
              remainingIds.has(img.id) && img.status === "pending"
                ? { ...img, status: "error", error: "Cancelled" }
                : img
            )
          );
          break;
        }

        setImages((prev) =>
          prev.map((img) =>
            img.id === newImages[i].id
              ? { ...img, status: "generating" }
              : img
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

          setProgress({ current: i + 1, total: prompts.length });
        } catch (err) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === newImages[i].id
                ? {
                    ...img,
                    status: "error",
                    error:
                      err instanceof Error ? err.message : "Unknown error",
                  }
                : img
            )
          );
          setProgress({ current: i + 1, total: prompts.length });
        }
      }

      setIsGenerating(false);
      if (!abortRef.current) {
        toast.success(
          `Generated ${prompts.length} image${prompts.length > 1 ? "s" : ""}`
        );
      }
    },
    [settings, falApiKey]
  );

  const handleSingleGenerate = () => {
    const prompt = singlePrompt.trim();
    if (!prompt) {
      toast.error("Enter a prompt first");
      return;
    }
    generateImages([prompt]);
  };

  const handleRandomGenerate = () => {
    const prompt = generateRandomPrompt();
    setSinglePrompt(prompt);
    generateImages([prompt]);
  };

  const handleBulkGenerate = () => {
    const prompts = bulkPrompts
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (prompts.length === 0) {
      toast.error("No prompts found. Enter one prompt per line.");
      return;
    }
    generateImages(prompts);
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

      setBulkPrompts(cleaned.join("\n"));
      toast.success(`Loaded ${cleaned.length} prompts from file`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleGenerateAIPrompts = async () => {
    setIsGeneratingPrompts(true);
    try {
      const paramSelections: Record<string, string[]> = {};
      for (const [key, cfg] of Object.entries(aiParams)) {
        if (cfg.enabled && cfg.selected.length > 0) {
          paramSelections[key] = cfg.selected;
        }
      }

      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: aiPromptCount, paramSelections }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setAiPrompts(data.prompts.join("\n"));
      toast.success(`Generated ${data.prompts.length} prompts`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate prompts"
      );
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleAIGenerate = () => {
    const prompts = aiPrompts
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (prompts.length === 0) {
      toast.error("Generate prompts first");
      return;
    }
    generateImages(prompts);
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

    toast.info("Preparing ZIP file...");

    const zip = new JSZip();

    for (let i = 0; i < doneImages.length; i++) {
      try {
        const response = await fetch(doneImages[i].imageUrl);
        const blob = await response.blob();
        zip.file(
          `profile-${String(i + 1).padStart(2, "0")}.${settings.output_format}`,
          blob
        );
      } catch {
        console.error(`Failed to fetch image ${i + 1}`);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
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

    const newPrompt = generateRandomPrompt();

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
          className="text-xs text-blue-600 hover:underline"
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
          className="text-xs text-blue-600 hover:underline"
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
            className="h-3.5 w-3.5 rounded border-input"
          />
          <span className="text-xs">{opt}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Profile Picture Generator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Generate realistic AI profile photos using fal.ai
          </p>
        </div>
        {/* Mobile settings button (top right) */}
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
              <Tabs defaultValue="single">
                <TabsList className="mb-4 w-full justify-start overflow-x-auto">
                  <TabsTrigger value="single" className="text-xs sm:text-sm">
                    Single
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="text-xs sm:text-sm">
                    Bulk
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs sm:text-sm">
                    CSV
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs sm:text-sm">
                    AI Prompts
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="single" className="space-y-3">
                  <Textarea
                    placeholder="Describe the profile photo you want to generate..."
                    value={singlePrompt}
                    onChange={(e) => setSinglePrompt(e.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={handleSingleGenerate}
                      disabled={isGenerating || !singlePrompt.trim()}
                      className="w-full sm:w-auto"
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSinglePrompt(generateRandomPrompt())}
                      disabled={isGenerating}
                      className="w-full sm:w-auto"
                    >
                      Randomize
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRandomGenerate}
                      disabled={isGenerating}
                      className="w-full sm:w-auto"
                    >
                      Randomize & Generate
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-3">
                  <Textarea
                    placeholder={
                      "Paste one prompt per line...\n\nPortrait of a 30-year-old woman with brown hair...\nHeadshot of a 45-year-old man with glasses..."
                    }
                    value={bulkPrompts}
                    onChange={(e) => setBulkPrompts(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {
                        bulkPrompts
                          .split("\n")
                          .filter((p) => p.trim().length > 0).length
                      }{" "}
                      prompts detected
                    </span>
                    <Button
                      onClick={handleBulkGenerate}
                      disabled={isGenerating || !bulkPrompts.trim()}
                    >
                      {isGenerating ? "Generating..." : "Generate All"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-3">
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
                  {bulkPrompts && (
                    <p className="text-sm text-muted-foreground">
                      {
                        bulkPrompts
                          .split("\n")
                          .filter((p) => p.trim().length > 0).length
                      }{" "}
                      prompts loaded - switch to Bulk tab to review and generate
                    </p>
                  )}
                </TabsContent>

                {/* AI Prompts Tab */}
                <TabsContent value="ai" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Photography Parameters
                    </Label>
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
                              className="h-4 w-4 shrink-0 rounded border-input"
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
                                <span className="text-sm font-medium">
                                  {label}
                                </span>
                                <p className="text-xs text-muted-foreground truncate">
                                  {desc}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                {aiParams[key].selected.length}/
                                {options.length}{" "}
                                <span
                                  className={`inline-block transition-transform ${
                                    expandedParam === key ? "rotate-180" : ""
                                  }`}
                                >
                                  ▼
                                </span>
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

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-1">
                      <Label className="text-sm">Number of prompts</Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={aiPromptCount}
                        onChange={(e) =>
                          setAiPromptCount(
                            Math.min(
                              50,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-full sm:w-24"
                      />
                    </div>
                    <Button
                      onClick={handleGenerateAIPrompts}
                      disabled={isGeneratingPrompts}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      {isGeneratingPrompts
                        ? "Generating Prompts..."
                        : "Generate Prompts with AI"}
                    </Button>
                  </div>

                  {aiPrompts && (
                    <>
                      <Textarea
                        value={aiPrompts}
                        onChange={(e) => setAiPrompts(e.target.value)}
                        rows={isMobile ? 8 : 12}
                        className="font-mono text-sm"
                        placeholder="AI-generated prompts will appear here..."
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {
                            aiPrompts
                              .split("\n")
                              .filter((p) => p.trim().length > 0).length
                          }{" "}
                          prompts ready
                        </span>
                        <Button
                          onClick={handleAIGenerate}
                          disabled={isGenerating}
                        >
                          {isGenerating
                            ? "Generating..."
                            : `Generate ${
                                aiPrompts
                                  .split("\n")
                                  .filter((p) => p.trim().length > 0).length
                              } Images`}
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Progress */}
          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>
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
                  <h2 className="text-lg font-semibold sm:text-xl">
                    Generated Images
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
                      className={`group relative overflow-hidden rounded-lg border bg-muted transition-all ${
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
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm hover:bg-black/70 active:scale-95"
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
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm hover:bg-black/70 active:scale-95"
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
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm hover:bg-red-600/80 active:scale-95"
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
                        <div className="flex aspect-square flex-col items-center justify-center gap-1 p-3 text-center sm:gap-2 sm:p-4">
                          <span className="text-xl sm:text-2xl">!</span>
                          <p className="text-xs text-destructive line-clamp-2">
                            {image.error || "Failed"}
                          </p>
                          <button
                            onClick={() => regenerateOne(image.id)}
                            className="mt-1 text-xs text-blue-600 hover:underline"
                          >
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
                  <h2 className="text-lg font-semibold sm:text-xl">
                    Saved Library
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
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm hover:bg-black/70 active:scale-95"
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
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-sm hover:bg-red-600/80 active:scale-95"
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
                    className="text-sm text-blue-600 hover:underline"
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
                    className="text-sm text-blue-600 hover:underline"
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
                        className="h-4 w-4 shrink-0 rounded border-input"
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
                    className="w-full rounded-lg object-contain"
                  />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lightboxImage.prompt}
                  </p>
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
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div
            className="absolute inset-0 bg-black/80 transition-opacity duration-200"
            style={{ opacity: lightboxVisible ? 1 : 0 }}
          />
          <div
            className="relative z-10 flex max-h-[90vh] max-w-[90vw] items-center gap-6 transition-all duration-200"
            style={{
              opacity: lightboxVisible ? 1 : 0,
              transform: lightboxVisible ? "scale(1)" : "scale(0.95)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.prompt.slice(0, 80)}
              className="max-h-[80vh] max-w-[60vw] rounded-lg object-contain shadow-2xl"
            />
            <div className="flex max-w-sm flex-col gap-4">
              <p className="rounded-md bg-black/50 px-4 py-3 text-sm leading-relaxed text-white/90 backdrop-blur-sm">
                {lightboxImage.prompt}
              </p>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => toggleSaveImage(lightboxImage)}
                >
                  {isImageSaved(lightboxImage.id) ? "Unsave" : "Save"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => downloadImage(lightboxImage)}
                >
                  Download
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    const id = lightboxImage.id;
                    closeLightbox();
                    regenerateOne(id);
                  }}
                >
                  Redo
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    const id = lightboxImage.id;
                    closeLightbox();
                    deleteImage(id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
            <button
              onClick={closeLightbox}
              className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(Home), { ssr: false });
