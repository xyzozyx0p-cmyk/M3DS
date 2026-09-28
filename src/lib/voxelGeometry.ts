import * as THREE from "three";
import type { Voxel } from "./models";

/**
 * Every block face keeps its own texture, so one block is six quads bound to six
 * different materials. Instead of one mesh per block (six draw calls each) we bake
 * all blocks of the same type into a single geometry with six groups — that is
 * six draw calls per block type, no matter how many blocks there are.
 */

const template = new THREE.BoxGeometry(1, 1, 1);
const templatePosition = template.getAttribute("position");
const templateNormal = template.getAttribute("normal");
const templateUv = template.getAttribute("uv");
const templateIndex = template.index!.array as ArrayLike<number>;
const VERTS_PER_BLOCK = templatePosition.count; // 24
const INDICES_PER_BLOCK = templateIndex.length; // 36

export function buildVoxelGeometry(voxels: Voxel[]): THREE.BufferGeometry {
  const total = voxels.length;
  const positions = new Float32Array(total * VERTS_PER_BLOCK * 3);
  const normals = new Float32Array(total * VERTS_PER_BLOCK * 3);
  const uvs = new Float32Array(total * VERTS_PER_BLOCK * 2);
  const indices = new Uint32Array(total * INDICES_PER_BLOCK);

  for (let b = 0; b < total; b += 1) {
    const voxel = voxels[b];
    const vOffset = b * VERTS_PER_BLOCK;
    const iOffset = b * INDICES_PER_BLOCK;

    for (let v = 0; v < VERTS_PER_BLOCK; v += 1) {
      const p = vOffset + v;
      positions[p * 3] = templatePosition.getX(v) + voxel.x + 0.5;
      positions[p * 3 + 1] = templatePosition.getY(v) + voxel.y + 0.5;
      positions[p * 3 + 2] = templatePosition.getZ(v) + voxel.z + 0.5;
      normals[p * 3] = templateNormal.getX(v);
      normals[p * 3 + 1] = templateNormal.getY(v);
      normals[p * 3 + 2] = templateNormal.getZ(v);
      uvs[p * 2] = templateUv.getX(v);
      uvs[p * 2 + 1] = templateUv.getY(v);
    }

    for (let i = 0; i < INDICES_PER_BLOCK; i += 1) {
      indices[iOffset + i] = templateIndex[i] + vOffset;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  // One group per material slot: +x, -x, +y, -y, +z, -z.
  const perFace = INDICES_PER_BLOCK / 6;
  for (let face = 0; face < 6; face += 1) {
    geometry.addGroup(face * perFace * total, perFace * total, face);
  }

  geometry.computeBoundingSphere();
  return geometry;
}

/** Maps a raycast hit on a merged block mesh back to the voxel that was clicked. */
export function voxelFromIntersection(intersection: THREE.Intersection): Voxel {
  const point = intersection.point;
  const normal = intersection.face
    ? intersection.face.normal.clone()
    : new THREE.Vector3(0, 1, 0);
  const inside = point.clone().addScaledVector(normal, -0.5);
  return {
    x: Math.floor(inside.x),
    y: Math.floor(inside.y),
    z: Math.floor(inside.z),
    type: "stone",
  };
}
