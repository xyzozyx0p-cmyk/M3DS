import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { blockMaterials, BLOCK_BY_TYPE, type BlockType } from "../../lib/blocks";
import { buildVoxelGeometry, voxelFromIntersection } from "../../lib/voxelGeometry";
import { hasBlock, placeBlock, removeBlock } from "../../lib/worldOps";
import type { Voxel } from "../../lib/models";

const ghostGeometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);

export interface BuildSceneProps {
  blocks: Voxel[];
  onChange: (blocks: Voxel[]) => void;
  selected: BlockType;
  level: number;
  size: number;
}

export function BuildScene({ blocks, onChange, selected, level, size }: BuildSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [size * 0.9, size * 0.9, size * 1.1], fov: 45 }}
      gl={{ antialias: true }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <color attach="background" args={["#0c1017"]} />
      <fog attach="fog" args={["#0c1017", 34, 78]} />
      <ambientLight intensity={0.7} color="#c9dcff" />
      <hemisphereLight intensity={0.8} color="#cfe4ff" groundColor="#101a12" />
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.5}
        color="#fff2d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={90}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
      />
      <directionalLight position={[-12, 8, -10]} intensity={0.5} color="#4fd6d2" />

      <SceneContents
        blocks={blocks}
        onChange={onChange}
        selected={selected}
        level={level}
        size={size}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={size * 3.5}
        maxPolarAngle={Math.PI / 2.05}
        target={[size / 2, level + 1, size / 2]}
      />
    </Canvas>
  );
}

function SceneContents({
  blocks,
  onChange,
  selected,
  level,
  size,
}: BuildSceneProps) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  useCursor(Boolean(hover), "crosshair", "auto");

  const groups = useMemo(() => {
    const map = new Map<BlockType, Voxel[]>();
    for (const voxel of blocks) {
      const list = map.get(voxel.type);
      if (list) list.push(voxel);
      else map.set(voxel.type, [voxel]);
    }
    return Array.from(map.entries());
  }, [blocks]);

  const meshes = useMemo(
    () => groups.map(([type, voxels]) => ({ type, geometry: buildVoxelGeometry(voxels) })),
    [groups],
  );

  useEffect(
    () => () => {
      meshes.forEach((entry) => entry.geometry.dispose());
    },
    [meshes],
  );

  const placeAt = (x: number, z: number) => {
    onChange(placeBlock(blocks, x, level, z, selected, size));
  };

  const handlePlaneDown = (event: ThreeEvent<PointerEvent>) => {
    downRef.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
  };

  const handlePlaneUp = (event: ThreeEvent<PointerEvent>) => {
    const down = downRef.current;
    downRef.current = null;
    if (!down || event.nativeEvent.button === 2) return;
    const moved = Math.hypot(
      event.nativeEvent.clientX - down.x,
      event.nativeEvent.clientY - down.y,
    );
    if (moved > 5) return; // it was an orbit drag, not a click
    placeAt(Math.floor(event.point.x), Math.floor(event.point.z));
  };

  const handleBlockDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.nativeEvent.button !== 2) return;
    event.stopPropagation();
    const target = voxelFromIntersection(event);
    onChange(removeBlock(blocks, target.x, target.y, target.z));
  };

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[size / 2, level + 0.02, size / 2]}
        onPointerDown={handlePlaneDown}
        onPointerUp={handlePlaneUp}
        onPointerMove={(event) => {
          if (event.buttons !== 0) return;
          const x = Math.floor(event.point.x);
          const z = Math.floor(event.point.z);
          setHover((prev) => (prev && prev[0] === x && prev[1] === z ? prev : [x, z]));
        }}
        onPointerOut={() => setHover(null)}
        visible={false}
      >
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <gridHelper args={[size, size, "#4fd6d2", "#2b3542"]} position={[size / 2, level + 0.04, size / 2]} />

      {hover && !hasBlock(blocks, hover[0], level, hover[1]) ? (
        <mesh geometry={ghostGeometry} position={[hover[0] + 0.5, level + 0.5, hover[1] + 0.5]}>
          <meshBasicMaterial color={BLOCK_BY_TYPE[selected].swatch} transparent opacity={0.4} wireframe />
        </mesh>
      ) : null}

      {meshes.map((entry) => (
        <mesh
          key={entry.type}
          geometry={entry.geometry}
          material={blockMaterials(entry.type)}
          castShadow
          receiveShadow
          onPointerDown={handleBlockDown}
        />
      ))}
    </group>
  );
}
