import { useEffect, useMemo } from "react";
import { blockMaterials, type BlockType } from "../../lib/blocks";
import { buildVoxelGeometry } from "../../lib/voxelGeometry";
import type { Voxel } from "../../lib/models";

/** Draws a voxel list as one merged mesh per block type. */
export function VoxelGroup({ blocks, castShadow = true }: { blocks: Voxel[]; castShadow?: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<BlockType, Voxel[]>();
    for (const voxel of blocks) {
      const list = map.get(voxel.type);
      if (list) list.push(voxel);
      else map.set(voxel.type, [voxel]);
    }
    return Array.from(map.entries());
  }, [blocks]);

  const geometries = useMemo(
    () => groups.map(([type, voxels]) => ({ type, geometry: buildVoxelGeometry(voxels) })),
    [groups],
  );

  useEffect(
    () => () => {
      geometries.forEach((entry) => entry.geometry.dispose());
    },
    [geometries],
  );

  return (
    <>
      {geometries.map((entry) => (
        <mesh
          key={entry.type}
          geometry={entry.geometry}
          material={blockMaterials(entry.type)}
          castShadow={castShadow}
          receiveShadow
        />
      ))}
    </>
  );
}
