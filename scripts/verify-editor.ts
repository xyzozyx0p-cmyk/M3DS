import * as THREE from "three";
import { buildVoxelGeometry, voxelFromIntersection } from "../src/lib/voxelGeometry";
import { placeBlock, removeBlock, hasBlock, isInsidePlot } from "../src/lib/worldOps";
import { generateIsland, generateStarterWorld } from "../src/lib/world";
import { buildCastle, buildCreeper } from "../src/lib/models";
import type { Voxel } from "../src/lib/models";

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

const run = () => {
  const SIZE = 14;

  // --- 1. Placing blocks -------------------------------------------------
  let blocks: Voxel[] = generateStarterWorld(SIZE).blocks;
  const before = blocks.length;
  blocks = placeBlock(blocks, 5, 1, 5, "cobblestone", SIZE);
  check("блок ставится в пустую клетку", blocks.length === before + 1 && hasBlock(blocks, 5, 1, 5));

  const same = placeBlock(blocks, 5, 1, 5, "lava", SIZE);
  check(
    "занятая клетка не перезаписывается",
    same.length === blocks.length && same.every((b) => !(b.x === 5 && b.y === 1 && b.z === 5 && b.type === "lava")),
  );

  const outside = placeBlock(blocks, SIZE, 1, 5, "stone", SIZE);
  const negative = placeBlock(blocks, -1, 1, 5, "stone", SIZE);
  check("блок за границей чанка не ставится", outside.length === blocks.length && negative.length === blocks.length);
  check("проверка границ работает", isInsidePlot(13, 0, SIZE) && !isInsidePlot(14, 0, SIZE));

  // --- 2. Removing blocks ------------------------------------------------
  const withTree = placeBlock(blocks, 7, 1, 7, "oakLeaves", SIZE);
  const removed = removeBlock(withTree, 7, 1, 7);
  check("блок удаляется", removed.length === withTree.length - 1 && !hasBlock(removed, 7, 1, 7));
  const removeMissing = removeBlock(removed, 7, 1, 7);
  check("удаление пустой клетки ничего не меняет", removeMissing.length === removed.length);

  // --- 3. Island generation ---------------------------------------------
  const island = generateIsland({ size: SIZE, seed: 4242, trees: 3 });
  check("остров генерируется", island.blocks.length > 200, `блоков: ${island.blocks.length}`);
  check("в острове есть трава", island.blocks.some((b) => b.type === "grass"));
  const inBounds = island.blocks.every(
    (b) => b.x >= 0 && b.z >= 0 && b.x < SIZE && b.z < SIZE && b.y >= 0,
  );
  check("все блоки острова внутри чанка", inBounds);
  const uniqueCells = new Set(island.blocks.map((b) => `${b.x},${b.y},${b.z}`));
  check("в острове нет наложенных блоков", uniqueCells.size === island.blocks.length);
  const second = generateIsland({ size: SIZE, seed: 4242, trees: 3 });
  check("генерация детерминирована", second.blocks.length === island.blocks.length);

  // --- 4. Merged geometry + raycast (removal path) -----------------------
  const sample: Voxel[] = [
    { x: 2, y: 1, z: 3, type: "stone" },
    { x: 6, y: 4, z: 6, type: "glass" },
  ];
  const geometry = buildVoxelGeometry(sample);
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex()!;
  check("геометрия содержит все воксели", position.count === sample.length * 24, `вершин: ${position.count}`);
  const referenced = new Set<number>();
  let inRange = true;
  for (let i = 0; i < index.count; i += 1) {
    const value = index.array[i] as number;
    if (value < 0 || value >= position.count) inRange = false;
    referenced.add(value);
  }
  check(
    "индексы покрывают всю геометрию",
    index.count === sample.length * 36 && inRange && referenced.size === position.count,
    `вершин: ${referenced.size}/${position.count}`,
  );
  check("группы по одной на грань", geometry.groups.length === 6 && geometry.groups.every((g) => g.count === sample.length * 6 && g.materialIndex >= 0 && g.materialIndex <= 5));

  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.updateMatrixWorld();
  const raycaster = new THREE.Raycaster();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(2.5, 8, 3.5);
  camera.lookAt(2.5, 1.5, 3.5);
  camera.updateMatrixWorld();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = raycaster.intersectObject(mesh, false)[0];
  check("рейкаст попадает в блок", Boolean(hit), hit ? `точка: ${hit.point.toArray().map((n) => n.toFixed(1)).join(",")}` : "");
  if (hit) {
    const voxel = voxelFromIntersection(hit);
    const target = sample.find((b) => b.x === voxel.x && b.y === voxel.y && b.z === voxel.z);
    check("рейкаст находит правильный блок", Boolean(target), `voxel=${voxel.x},${voxel.y},${voxel.z}`);
    const next = removeBlock(sample, voxel.x, voxel.y, voxel.z);
    check("удаление по результату рейкаста работает", next.length === sample.length - 1 && !hasBlock(next, voxel.x, voxel.y, voxel.z));
  }

  // --- 5. Big world performance guard ------------------------------------
  const big = generateStarterWorld(SIZE).blocks;
  for (let i = 0; i < 3000; i += 1) {
    big.push({ x: i % SIZE, y: 2 + Math.floor(i / SIZE), z: (i * 7) % SIZE, type: "stone" });
  }
  const started = Date.now();
  const bigGeometry = buildVoxelGeometry(big);
  const elapsed = Date.now() - started;
  check("геометрия большого мира строится быстро", elapsed < 250, `${big.length} блоков за ${elapsed} мс`);
  check("большой мир не сломан", bigGeometry.getAttribute("position").count === big.length * 24);

  // --- 6. Showcase models still build -----------------------------------
  check("модели строятся", buildCastle().length > 300 && buildCreeper().length > 80);

  console.log(failures === 0 ? "\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : `\nПРОВАЛЕНО ПРОВЕРОК: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
};

run();
