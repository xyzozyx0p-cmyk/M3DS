import { mulberry32, type BlockType } from "./blocks";
import type { Voxel } from "./models";

/** Smooth value noise on a fixed grid — deterministic and cheap. */
function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const size = 64;
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i += 1) grid[i] = rand();

  const at = (x: number, y: number) => grid[((y % size) + size) % size * size + (((x % size) + size) % size)];
  const smooth = (t: number) => t * t * (3 - 2 * t);

  return (x: number, y: number, scale: number) => {
    const sx = x / scale;
    const sy = y / scale;
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const tx = smooth(sx - x0);
    const ty = smooth(sy - y0);
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

export interface IslandOptions {
  size?: number;
  seed?: number;
  trees?: number;
  withCastle?: boolean;
}

export interface WorldData {
  blocks: Voxel[];
  size: number;
}

/** Floating grass island used on the landing page hero. */
export function generateIsland(options: IslandOptions = {}): WorldData {
  const size = options.size ?? 15;
  const seed = options.seed ?? 1337;
  const trees = options.trees ?? 3;
  const noise = makeNoise(seed);
  const rand = mulberry32(seed + 7);
  const center = (size - 1) / 2;
  const blocks: Voxel[] = [];

  const heightAt = (x: number, z: number) => {
    const dx = x - center;
    const dz = z - center;
    const distance = Math.sqrt(dx * dx + dz * dz) / (size / 2);
    const hills = noise(x, z, 4.5) * 0.7 + noise(x + 40, z - 20, 9) * 0.3;
    const falloff = Math.max(0, 1 - distance * distance);
    return 1 + Math.round(hills * 3 * falloff + falloff * 1.6);
  };

  const distanceFromCenter = (x: number, z: number) => {
    const dx = x - center;
    const dz = z - center;
    return Math.sqrt(dx * dx + dz * dz) / (size / 2);
  };

  for (let x = 0; x < size; x += 1) {
    for (let z = 0; z < size; z += 1) {
      const height = heightAt(x, z);
      if (height <= 1) continue;
      const distance = distanceFromCenter(x, z);
      for (let y = 0; y < height; y += 1) {
        // Taper the underside so the island looks like a floating chunk of land.
        if (y === 0 && distance > 0.45) continue;
        if (y === 1 && distance > 0.8) continue;
        let type: BlockType = "stone";
        if (y === height - 1) type = "grass";
        else if (y >= height - 3) type = "dirt";
        if (y === 0) type = "dirt";
        blocks.push({ x, y, z, type });
      }
    }
  }

  // A little pond with a sand rim. The water replaces the grass instead of
  // stacking on top of it, so no two blocks ever share the same cell.
  const at = (x: number, y: number, z: number) =>
    blocks.find((b) => b.x === x && b.y === y && b.z === z);
  const set = (x: number, y: number, z: number, type: BlockType) => {
    const existing = at(x, y, z);
    if (existing) existing.type = type;
    else blocks.push({ x, y, z, type });
  };

  const pondX = Math.round(center - 1);
  const pondZ = Math.round(center + 2);
  for (let x = pondX - 2; x <= pondX + 2; x += 1) {
    for (let z = pondZ - 2; z <= pondZ + 2; z += 1) {
      if (Math.abs(x - pondX) + Math.abs(z - pondZ) > 3) continue;
      const surface = heightAt(x, z);
      set(x, surface, z, "water");
      set(x, surface - 1, z, "sand");
    }
  }

  // Trees on top of the grass.
  for (let i = 0; i < trees; i += 1) {
    const x = Math.floor(rand() * size);
    const z = Math.floor(rand() * size);
    const height = heightAt(x, z);
    const ground = at(x, height, z);
    const isFree = ground?.type === "grass" && distanceFromCenter(x, z) <= 0.6;
    if (!isFree) continue;

    const trunk = 3 + Math.floor(rand() * 2);
    for (let y = 1; y <= trunk; y += 1) set(x, height + y, z, "oakLog");
    for (let y = trunk; y <= trunk + 2; y += 1) {
      const radius = y === trunk + 2 ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx += 1) {
        for (let dz = -radius; dz <= radius; dz += 1) {
          // The trunk wins over the leaves it is surrounded by.
          if (dx === 0 && dz === 0 && y <= trunk) continue;
          set(x + dx, height + y, z + dz, "oakLeaves");
        }
      }
    }
  }

  return { blocks, size };
}

/** Flat starter plot for the editor so a new world is never empty. */
export function generateStarterWorld(size = 12): WorldData {
  const blocks: Voxel[] = [];
  for (let x = 0; x < size; x += 1) {
    for (let z = 0; z < size; z += 1) {
      blocks.push({ x, y: 0, z, type: "grass" });
      const edge = x === 0 || z === 0 || x === size - 1 || z === size - 1;
      if (edge) {
        blocks.push({ x, y: -1, z, type: "dirt" });
        blocks.push({ x, y: -2, z, type: "stone" });
      } else {
        blocks.push({ x, y: -1, z, type: "dirt" });
      }
    }
  }
  return { blocks, size };
}
