import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { VoxelGroup } from "./VoxelGroup";
import type { Voxel } from "../../lib/models";

interface Bounds {
  center: [number, number, number];
  radius: number;
  height: number;
}

function computeBounds(blocks: Voxel[]): Bounds {
  if (!blocks.length) return { center: [0, 0, 0], radius: 4, height: 4 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const block of blocks) {
    minX = Math.min(minX, block.x);
    maxX = Math.max(maxX, block.x);
    minY = Math.min(minY, block.y);
    maxY = Math.max(maxY, block.y);
    minZ = Math.min(minZ, block.z);
    maxZ = Math.max(maxZ, block.z);
  }
  const height = maxY - minY + 1;
  const radius = Math.max(2, Math.max(maxX - minX, maxZ - minZ, height) / 2);
  return {
    center: [(minX + maxX) / 2 + 0.5, -minY, (minZ + maxZ) / 2 + 0.5],
    radius,
    height,
  };
}

function Spinner({
  blocks,
  center,
  spin,
}: {
  blocks: Voxel[];
  center: [number, number, number];
  spin: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    if (spin) ref.current.rotation.y = state.clock.getElapsedTime() * 0.35;
    ref.current.position.y = center[1] + (spin ? Math.sin(state.clock.getElapsedTime() * 1.2) * 0.15 : 0);
  });

  return (
    <group ref={ref} position={center}>
      <VoxelGroup blocks={blocks} />
    </group>
  );
}

export function ModelViewer({ blocks, autoRotate = true }: { blocks: Voxel[]; autoRotate?: boolean }) {
  const bounds = useMemo(() => computeBounds(blocks), [blocks]);
  const distance = bounds.radius * 2.6;

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [distance, bounds.height * 0.6 + distance * 0.4, distance], fov: 40 }}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.75} color="#cfe4ff" />
      <hemisphereLight intensity={0.7} color="#cfe4ff" groundColor="#14181d" />
      <directionalLight position={[8, 14, 10]} intensity={1.4} color="#fff0d0" castShadow />
      <pointLight position={[-7, 4, -7]} intensity={14} color="#4fd6d2" distance={30} />
      <Suspense fallback={null}>
        <Spinner blocks={blocks} center={bounds.center} spin={autoRotate} />
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.5}
          scale={bounds.radius * 4}
          blur={2.5}
          far={bounds.radius * 3}
          color="#000000"
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.4}
        minDistance={bounds.radius}
        maxDistance={distance * 2.4}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2}
        target={[0, bounds.height * 0.45, 0]}
      />
    </Canvas>
  );
}
