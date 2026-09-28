import type { BlockType } from "./blocks";
import type { Voxel } from "./models";

/** Shared editing rules for the studio: the same functions power clicks and tests. */

export function isInsidePlot(x: number, z: number, size: number): boolean {
  return x >= 0 && z >= 0 && x < size && z < size;
}

export function hasBlock(blocks: Voxel[], x: number, y: number, z: number): boolean {
  return blocks.some((block) => block.x === x && block.y === y && block.z === z);
}

/** Returns a new list with the block added, or the same list if the cell is taken. */
export function placeBlock(
  blocks: Voxel[],
  x: number,
  y: number,
  z: number,
  type: BlockType,
  size: number,
): Voxel[] {
  if (!isInsidePlot(x, z, size)) return blocks;
  if (hasBlock(blocks, x, y, z)) return blocks;
  return [...blocks, { x, y, z, type }];
}

export function removeBlock(blocks: Voxel[], x: number, y: number, z: number): Voxel[] {
  if (!hasBlock(blocks, x, y, z)) return blocks;
  return blocks.filter((block) => !(block.x === x && block.y === y && block.z === z));
}
