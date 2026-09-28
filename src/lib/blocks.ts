import * as THREE from "three";

export type BlockType =
  | "grass"
  | "dirt"
  | "stone"
  | "cobblestone"
  | "sand"
  | "oakLog"
  | "oakLeaves"
  | "planks"
  | "bricks"
  | "glass"
  | "water"
  | "lava"
  | "glowstone"
  | "coalOre"
  | "diamondOre"
  | "obsidian"
  | "snow";

export type BlockCategory = "nature" | "building" | "ores" | "special";

export interface BlockDef {
  type: BlockType;
  name: string;
  category: BlockCategory;
  /** Average colour, used for UI chips and particle tints. */
  swatch: string;
  emissive?: boolean;
  transparent?: boolean;
}

export const BLOCKS: BlockDef[] = [
  { type: "grass", name: "Трава", category: "nature", swatch: "#6aa33c" },
  { type: "dirt", name: "Земля", category: "nature", swatch: "#8a6242" },
  { type: "sand", name: "Песок", category: "nature", swatch: "#e0d29a" },
  { type: "oakLog", name: "Дуб", category: "nature", swatch: "#6f5334" },
  { type: "oakLeaves", name: "Листва", category: "nature", swatch: "#3e7a2a" },
  { type: "snow", name: "Снег", category: "nature", swatch: "#f2f6fb" },
  { type: "stone", name: "Камень", category: "building", swatch: "#8a8a8a" },
  { type: "cobblestone", name: "Булыжник", category: "building", swatch: "#7a7a7a" },
  { type: "planks", name: "Доски", category: "building", swatch: "#b5854c" },
  { type: "bricks", name: "Кирпичи", category: "building", swatch: "#a15244" },
  { type: "glass", name: "Стекло", category: "building", swatch: "#bfe6f2", transparent: true },
  { type: "water", name: "Вода", category: "special", swatch: "#3d78d8", transparent: true },
  { type: "lava", name: "Лава", category: "special", swatch: "#ff8a1f", emissive: true },
  { type: "coalOre", name: "Уголь", category: "ores", swatch: "#4a4a4a" },
  { type: "diamondOre", name: "Алмаз", category: "ores", swatch: "#4fd6d2" },
  { type: "glowstone", name: "Светокамень", category: "ores", swatch: "#f5c66b", emissive: true },
  { type: "obsidian", name: "Обсидиан", category: "special", swatch: "#2b2340" },
];

export const BLOCK_BY_TYPE: Record<BlockType, BlockDef> = BLOCKS.reduce(
  (acc, block) => {
    acc[block.type] = block;
    return acc;
  },
  {} as Record<BlockType, BlockDef>,
);

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  nature: "Природа",
  building: "Строение",
  ores: "Руды",
  special: "Особые",
};

/** Deterministic PRNG so every generated texture/model is stable between renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const TEX_SIZE = 16;
const textureCache = new Map<string, THREE.Texture>();
const materialCache = new Map<string, THREE.Material | THREE.Material[]>();

type Face = "top" | "side" | "bottom";

interface Recipe {
  base: string[];
  /** Optional darker speckles, e.g. ore blobs. */
  spots?: { color: string; count: number; size: number }[];
  stripes?: "vertical" | "horizontal" | "bricks";
  rings?: boolean;
  overlayTop?: { color: string; height: number };
  border?: string;
  alpha?: number;
}

const RECIPES: Record<BlockType, Record<Face, Recipe>> = {
  grass: {
    top: { base: ["#6aa33c", "#7cb84a", "#5c9232", "#88c356"] },
    side: {
      base: ["#8a6242", "#7a563a", "#946c4a", "#6f4e35"],
      overlayTop: { color: "#6aa33c", height: 4 },
    },
    bottom: { base: ["#8a6242", "#7a563a", "#946c4a", "#6f4e35"] },
  },
  dirt: { top: dirtFaces(), side: dirtFaces(), bottom: dirtFaces() },
  sand: { top: sandFaces(), side: sandFaces(), bottom: sandFaces() },
  snow: {
    top: { base: ["#f4f8fd", "#e8eff8", "#ffffff", "#dde7f2"] },
    side: {
      base: ["#8a6242", "#7a563a", "#946c4a", "#6f4e35"],
      overlayTop: { color: "#f4f8fd", height: 4 },
    },
    bottom: { base: ["#e8eff8", "#f4f8fd", "#dde7f2", "#ffffff"] },
  },
  stone: { top: stoneFaces(), side: stoneFaces(), bottom: stoneFaces() },
  cobblestone: {
    top: { base: ["#7d7d7d", "#6c6c6c", "#8a8a8a"], stripes: "bricks" },
    side: { base: ["#7d7d7d", "#6c6c6c", "#8a8a8a"], stripes: "bricks" },
    bottom: { base: ["#6c6c6c", "#7d7d7d", "#5e5e5e"], stripes: "bricks" },
  },
  oakLog: {
    top: { base: ["#9c7a4a", "#8a6a3e", "#b08c58"], rings: true },
    side: { base: ["#6f5334", "#5d4429", "#7d5f3c", "#513a23"], stripes: "vertical" },
    bottom: { base: ["#9c7a4a", "#8a6a3e", "#b08c58"], rings: true },
  },
  oakLeaves: {
    top: leavesFaces(),
    side: leavesFaces(),
    bottom: leavesFaces(),
  },
  planks: {
    top: { base: ["#b5854c", "#a2763f", "#c49559"], stripes: "horizontal" },
    side: { base: ["#b5854c", "#a2763f", "#c49559"], stripes: "horizontal" },
    bottom: { base: ["#a2763f", "#b5854c", "#96692f"], stripes: "horizontal" },
  },
  bricks: {
    top: { base: ["#a15244", "#8e4438", "#b2604f"], stripes: "bricks" },
    side: { base: ["#a15244", "#8e4438", "#b2604f"], stripes: "bricks" },
    bottom: { base: ["#8e4438", "#a15244", "#7f3a30"], stripes: "bricks" },
  },
  glass: {
    top: { base: ["#bfe6f2", "#cdeef7"], border: "#e8f7fc", alpha: 0.35 },
    side: { base: ["#bfe6f2", "#cdeef7"], border: "#e8f7fc", alpha: 0.28 },
    bottom: { base: ["#bfe6f2", "#cdeef7"], border: "#e8f7fc", alpha: 0.35 },
  },
  water: {
    top: { base: ["#3d78d8", "#4a86e6", "#3369c4"], alpha: 0.72 },
    side: { base: ["#3568c4", "#3d78d8", "#2c58a8"], alpha: 0.66 },
    bottom: { base: ["#2c58a8", "#3568c4"], alpha: 0.7 },
  },
  lava: {
    top: {
      base: ["#ff8a1f", "#e0661a", "#ffa94d"],
      spots: [{ color: "#ffd27a", count: 12, size: 3 }],
    },
    side: {
      base: ["#d15a15", "#b8470f", "#e0661a"],
      spots: [{ color: "#ffb347", count: 10, size: 2 }],
    },
    bottom: { base: ["#b8470f", "#d15a15"], spots: [{ color: "#ff8a1f", count: 6, size: 2 }] },
  },
  glowstone: {
    top: { base: ["#f5c66b", "#e0a94c"], spots: [{ color: "#fff3c4", count: 10, size: 2 }] },
    side: {
      base: ["#f5c66b", "#e0a94c"],
      spots: [{ color: "#fff3c4", count: 14, size: 2 }],
    },
    bottom: { base: ["#e0a94c", "#c9923d"], spots: [{ color: "#fff3c4", count: 8, size: 2 }] },
  },
  coalOre: {
    top: oreFaces("#2b2b2b", 5),
    side: oreFaces("#2b2b2b", 6),
    bottom: oreFaces("#2b2b2b", 4),
  },
  diamondOre: {
    top: oreFaces("#4fd6d2", 5),
    side: oreFaces("#4fd6d2", 6),
    bottom: oreFaces("#4fd6d2", 4),
  },
  obsidian: {
    top: { base: ["#2b2340", "#221b33", "#372c4f"], spots: [{ color: "#5b4a86", count: 6, size: 2 }] },
    side: {
      base: ["#2b2340", "#221b33", "#372c4f"],
      spots: [{ color: "#5b4a86", count: 9, size: 2 }],
    },
    bottom: { base: ["#221b33", "#2b2340"], spots: [{ color: "#5b4a86", count: 4, size: 2 }] },
  },
};

function dirtFaces() {
  return { base: ["#8a6242", "#7a563a", "#946c4a", "#6f4e35"] };
}
function sandFaces() {
  return { base: ["#e0d29a", "#d6c78c", "#ecdfa8", "#cab98a"] };
}
function stoneFaces() {
  return { base: ["#8a8a8a", "#7d7d7d", "#969696", "#717171"] };
}
function leavesFaces() {
  return {
    base: ["#3e7a2a", "#356b23", "#4a8c33", "#2c5a1d"],
    spots: [{ color: "#2a5418", count: 12, size: 2 }],
  };
}
function oreFaces(color: string, count: number) {
  return {
    base: ["#8a8a8a", "#7d7d7d", "#969696", "#717171"],
    spots: [{ color, count, size: 3 }],
  };
}

function drawTexture(type: BlockType, face: Face): THREE.Texture {
  const recipe = RECIPES[type][face];
  const canvas = document.createElement("canvas");
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(hashString(`${type}:${face}`));

  for (let y = 0; y < TEX_SIZE; y += 1) {
    for (let x = 0; x < TEX_SIZE; x += 1) {
      const color = recipe.base[Math.floor(rand() * recipe.base.length)];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  if (recipe.stripes === "vertical") {
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    for (let x = 1; x < TEX_SIZE; x += 4) ctx.fillRect(x, 0, 1, TEX_SIZE);
  }
  if (recipe.stripes === "horizontal") {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 5; y < TEX_SIZE; y += 5) ctx.fillRect(0, y, TEX_SIZE, 1);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let y = 6; y < TEX_SIZE; y += 5) ctx.fillRect(0, y, TEX_SIZE, 1);
  }
  if (recipe.stripes === "bricks") {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    for (let y = 0; y < TEX_SIZE; y += 5) ctx.fillRect(0, y, TEX_SIZE, 1);
    for (let row = 0; row < 4; row += 1) {
      const offset = row % 2 === 0 ? 0 : 4;
      for (let x = offset; x < TEX_SIZE; x += 8) ctx.fillRect(x, row * 4, 1, 4);
    }
  }
  if (recipe.rings) {
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(3.5, 3.5, 9, 9);
    ctx.strokeRect(6.5, 6.5, 3, 3);
  }
  if (recipe.overlayTop) {
    ctx.fillStyle = recipe.overlayTop.color;
    for (let x = 0; x < TEX_SIZE; x += 1) {
      const jag = Math.floor(rand() * 2);
      ctx.fillRect(x, 0, 1, recipe.overlayTop.height - jag);
    }
  }
  if (recipe.spots) {
    for (let i = 0; i < recipe.spots.length; i += 1) {
      const spot = recipe.spots[i];
      for (let j = 0; j < spot.count; j += 1) {
        const sx = Math.floor(rand() * (TEX_SIZE - spot.size));
        const sy = Math.floor(rand() * (TEX_SIZE - spot.size));
        ctx.fillStyle = spot.color;
        ctx.fillRect(sx, sy, spot.size, spot.size);
      }
    }
  }
  if (recipe.border) {
    ctx.strokeStyle = recipe.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, TEX_SIZE - 1, TEX_SIZE - 1);
  }
  if (recipe.alpha !== undefined) {
    const image = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 3; i < image.data.length; i += 4) {
      image.data[i] = Math.round(image.data[i] * recipe.alpha);
    }
    ctx.putImageData(image, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function blockTexture(type: BlockType, face: Face): THREE.Texture {
  const key = `${type}:${face}`;
  let texture = textureCache.get(key);
  if (!texture) {
    texture = drawTexture(type, face);
    textureCache.set(key, texture);
  }
  return texture;
}

/**
 * BoxGeometry accepts a 6-material array in this order:
 * +x, -x, +y, -y, +z, -z.
 */
export function blockMaterials(type: BlockType): THREE.Material[] {
  let materials = materialCache.get(type);
  if (!materials) {
    const make = (face: Face) => {
      const def = BLOCK_BY_TYPE[type];
      return new THREE.MeshLambertMaterial({
        map: blockTexture(type, face),
        transparent: Boolean(def.transparent),
        opacity: type === "glass" ? 0.55 : 1,
        emissive: def.emissive ? new THREE.Color(def.swatch) : new THREE.Color("#000000"),
        emissiveIntensity: def.emissive ? 0.5 : 0,
      });
    };
    materials = [make("side"), make("side"), make("top"), make("bottom"), make("side"), make("side")];
    materialCache.set(type, materials);
  }
  return materials as THREE.Material[];
}

/** Flat untextured material — used for instanced decorative blocks in the landing scenes. */
export function solidMaterial(color: string): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}
