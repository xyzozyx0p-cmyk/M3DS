import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { generateIsland } from "../../lib/world";
import { VoxelGroup } from "./VoxelGroup";
import { blockMaterials } from "../../lib/blocks";

function Island() {
  const group = useRef<THREE.Group>(null);
  const { blocks, size } = useMemo(() => generateIsland({ size: 15, seed: 20240, trees: 4 }), []);
  const offset = -size / 2;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.08;
    group.current.position.y = Math.sin(t * 0.6) * 0.25;
  });

  return (
    <group ref={group} position={[offset, 1.2, offset]}>
      <VoxelGroup blocks={blocks} />
      <mesh position={[size / 2, 2.2, size / 2]}>
        <boxGeometry args={[0.24, 0.24, 0.24]} />
        <primitive object={blockMaterials("glowstone")[0]} attach="material" />
      </mesh>
      <pointLight position={[size / 2, 2.4, size / 2]} color="#ffc46b" intensity={8} distance={12} />
    </group>
  );
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x =
      ((position[0] + state.clock.getElapsedTime() * 0.35 + 20) % 40) - 20;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[3, 0.6, 2]} />
        <meshLambertMaterial color="#e9f2ff" transparent opacity={0.82} />
      </mesh>
      <mesh position={[1, 0.5, 0]}>
        <boxGeometry args={[2, 0.6, 1.6]} />
        <meshLambertMaterial color="#f4f8ff" transparent opacity={0.82} />
      </mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [12, 9, 16], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <fog attach="fog" args={["#0b0f16", 26, 46]} />
      <ambientLight intensity={0.55} color="#9fc4ff" />
      <hemisphereLight intensity={0.6} color="#bcd8ff" groundColor="#1d2a1a" />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.5}
        color="#fff3d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-10, 6, -8]} intensity={8} color="#4fd6d2" distance={30} />

      <Suspense fallback={null}>
        <Island />
        <Cloud position={[-8, 6, -6]} scale={1.4} />
        <Cloud position={[6, 8, -10]} scale={1} />
        <Cloud position={[-2, 5, 10]} scale={1.8} />
        <Stars radius={60} depth={30} count={1200} factor={3} fade speed={0.4} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.6}
        maxPolarAngle={1.35}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}
