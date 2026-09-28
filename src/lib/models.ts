import type { BlockType } from "./blocks";
import { mulberry32 } from "./blocks";

export interface Voxel {
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

/** Tiny builder for composing voxel models out of primitive volumes. */
export class VoxelBuilder {
  blocks: Voxel[] = [];

  set(x: number, y: number, z: number, type: BlockType): this {
    this.blocks.push({ x: Math.round(x), y: Math.round(y), z: Math.round(z), type });
    return this;
  }

  box(x: number, y: number, z: number, w: number, h: number, d: number, type: BlockType): this {
    for (let i = 0; i < w; i += 1) {
      for (let j = 0; j < h; j += 1) {
        for (let k = 0; k < d; k += 1) {
          this.set(x + i, y + j, z + k, type);
        }
      }
    }
    return this;
  }

  /** Fills the volume but keeps the blocks that pass `keep`. */
  boxIf(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    type: BlockType,
    keep: (i: number, j: number, k: number) => boolean,
  ): this {
    for (let i = 0; i < w; i += 1) {
      for (let j = 0; j < h; j += 1) {
        for (let k = 0; k < d; k += 1) {
          if (keep(i, j, k)) this.set(x + i, y + j, z + k, type);
        }
      }
    }
    return this;
  }

  build(): Voxel[] {
    return this.blocks;
  }
}

export interface Model {
  id: string;
  name: string;
  blocks: Voxel[];
  /** Footprint radius, used to frame the camera. */
  radius: number;
  palette: BlockType[];
}

function boundsRadius(blocks: Voxel[]): number {
  const max = Math.max(
    1,
    ...blocks.map((b) => Math.max(Math.abs(b.x), Math.abs(b.z), b.y)),
  );
  return max;
}

function model(id: string, name: string, blocks: Voxel[]): Model {
  const palette = Array.from(new Set(blocks.map((b) => b.type)));
  return { id, name, blocks, radius: boundsRadius(blocks), palette };
}

export function buildTree(seed = 1, height = 5): Voxel[] {
  const rand = mulberry32(seed);
  const b = new VoxelBuilder();
  for (let i = 0; i < height; i += 1) b.set(0, i, 0, "oakLog");
  const top = height;
  for (let y = top - 1; y <= top + 2; y += 1) {
    const radius = y === top + 2 ? 1 : 2;
    for (let x = -radius; x <= radius; x += 1) {
      for (let z = -radius; z <= radius; z += 1) {
        if (Math.abs(x) === radius && Math.abs(z) === radius && rand() > 0.35) continue;
        b.set(x, y, z, "oakLeaves");
      }
    }
  }
  return b.build();
}

export function buildHouse(): Voxel[] {
  const b = new VoxelBuilder();
  // Walls with a door gap and windows.
  b.boxIf(-3, 0, -3, 7, 4, 7, "planks", (i, j, k) => {
    const onEdge = i === 0 || i === 6 || k === 0 || k === 6;
    if (!onEdge || j === 3) return false;
    if (k === 0 && i >= 2 && i <= 4 && j < 2) return false; // doorway
    if (j === 1 && ((i === 0 && k >= 2 && k <= 4) || (i === 6 && k >= 2 && k <= 4))) return false;
    return true;
  });
  // Roof
  for (let layer = 0; layer < 3; layer += 1) {
    const inset = 3 - layer;
    b.box(-inset, 4 + layer, -inset, inset * 2 + 1, 1, inset * 2 + 1, "bricks");
  }
  // Chimney
  b.box(2, 4, 2, 1, 3, 1, "cobblestone");
  // Porch light
  b.set(3, 2, -1, "glowstone");
  b.set(-3, 2, 3, "glowstone");
  return b.build();
}

export function buildCreeper(): Voxel[] {
  const b = new VoxelBuilder();
  const body = (x: number, y: number, z: number, w: number, h: number, d: number) =>
    b.box(x, y, z, w, h, d, "oakLeaves");
  body(0, 2, 0, 4, 6, 2); // legs + body
  body(0, 8, 0, 4, 4, 2); // head
  b.box(0, 0, 0, 2, 2, 2, "oakLeaves");
  b.box(2, 0, 0, 2, 2, 2, "oakLeaves");
  // Face
  b.set(1, 10, -1, "obsidian");
  b.set(2, 10, -1, "obsidian");
  b.set(1, 9, -1, "obsidian");
  b.set(2, 9, -1, "obsidian");
  b.box(1, 8, -1, 2, 1, 1, "obsidian");
  return b.build();
}

export function buildPig(): Voxel[] {
  const b = new VoxelBuilder();
  b.box(0, 0, 0, 2, 3, 2, "oakLeaves");
  b.box(2, 0, 0, 2, 3, 2, "oakLeaves");
  b.box(0, 3, 0, 5, 3, 3, "snow");
  b.box(0, 6, 0, 3, 3, 3, "snow");
  b.box(1, 7, -1, 1, 1, 1, "snow"); // snout
  b.set(0, 8, 0, "obsidian");
  b.set(2, 8, 0, "obsidian");
  return b.build();
}

export function buildChicken(): Voxel[] {
  const b = new VoxelBuilder();
  b.set(0, 0, 0, "lava"); // legs
  b.set(2, 0, 0, "lava");
  b.box(0, 1, 0, 3, 3, 2, "snow");
  b.box(2, 4, 0, 2, 2, 2, "snow");
  b.set(4, 5, 0, "lava"); // beak
  b.set(3, 5, 0, "obsidian"); // eye
  b.box(0, 3, 1, 2, 1, 1, "snow"); // tail
  return b.build();
}

export function buildDiamondSword(): Voxel[] {
  const b = new VoxelBuilder();
  // Blade
  b.box(0, 2, 0, 1, 10, 1, "diamondOre");
  b.set(0, 12, 0, "diamondOre");
  b.set(0, 11, 0, "snow");
  // Guard
  b.box(-2, 1, 0, 5, 1, 1, "obsidian");
  // Handle
  b.box(0, -2, 0, 1, 3, 1, "oakLog");
  b.set(0, -3, 0, "lava");
  return b.build();
}

export function buildPickaxe(): Voxel[] {
  const b = new VoxelBuilder();
  b.box(0, 0, 0, 1, 9, 1, "oakLog");
  b.boxIf(-4, 8, 0, 9, 2, 1, "diamondOre", (i, j) => {
    const armX = i;
    const armY = 9 - Math.abs(armX - 4) * 0.75;
    return j + 8 >= armY - 0.5 && j + 8 <= armY + 0.5;
  });
  return b.build();
}

export function buildCastle(): Voxel[] {
  const b = new VoxelBuilder();
  b.box(-5, 0, -5, 11, 1, 11, "stone");
  for (const [x, z] of [
    [-5, -5],
    [5, -5],
    [-5, 5],
    [5, 5],
  ] as const) {
    b.box(x - 1, 1, z - 1, 3, 8, 3, "cobblestone");
    b.box(x - 1, 9, z - 1, 3, 1, 3, "cobblestone");
    b.box(x - 1, 10, z, 1, 2, 1, "cobblestone");
    b.box(x + 1, 10, z, 1, 2, 1, "cobblestone");
    b.box(x, 12, z, 1, 1, 1, "lava");
  }
  b.boxIf(-1, 1, -1, 3, 6, 3, "stone", (i, j, k) => !(i === 1 && k === 1 && j < 4));
  b.box(-1, 7, -1, 3, 1, 3, "cobblestone");
  b.set(0, 8, 0, "glowstone");
  return b.build();
}

export function buildTorch(): Voxel[] {
  const b = new VoxelBuilder();
  b.set(0, 0, 0, "oakLog");
  b.set(0, 1, 0, "glowstone");
  return b.build();
}

export const MODELS: Model[] = [
  { id: "tree", name: "Дуб", blocks: buildTree(7, 5), radius: 3, palette: [] },
  { id: "house", name: "Домик", blocks: buildHouse(), radius: 4, palette: [] },
  { id: "creeper", name: "Крипер", blocks: buildCreeper(), radius: 6, palette: [] },
  { id: "pig", name: "Свинка", blocks: buildPig(), radius: 4, palette: [] },
  { id: "chicken", name: "Курица", blocks: buildChicken(), radius: 3, palette: [] },
  { id: "sword", name: "Меч", blocks: buildDiamondSword(), radius: 6, palette: [] },
  { id: "pickaxe", name: "Кирка", blocks: buildPickaxe(), radius: 5, palette: [] },
  { id: "castle", name: "Замок", blocks: buildCastle(), radius: 6, palette: [] },
].map((m) => model(m.id, m.name, m.blocks));
