import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { friendlyError } from "../lib/errors";
import { BuildScene } from "../components/three/BuildScene";
import { BlockIcon } from "../components/BlockIcon";
import { BLOCKS, BLOCK_BY_TYPE, CATEGORY_LABELS, type BlockCategory, type BlockType } from "../lib/blocks";
import { generateIsland, generateStarterWorld, type WorldData } from "../lib/world";
import type { Voxel } from "../lib/models";

const PLOT_SIZE = 14;
const MAX_LEVEL = 14;
const CATEGORIES = Object.keys(CATEGORY_LABELS) as BlockCategory[];

export function Studio() {
  const { user, token, signOut } = useAuth();
  const [worldId, setWorldId] = useState<Id<"worlds"> | null>(null);
  const [name, setName] = useState("Мой первый мир");
  const [blocks, setBlocks] = useState<Voxel[]>(() => generateStarterWorld(PLOT_SIZE).blocks);
  const [selected, setSelected] = useState<BlockType>("cobblestone");
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<string>("Черновик");
  const [busy, setBusy] = useState(false);

  const worlds = useQuery(api.worlds.listWorlds, token ? { token } : "skip");
  const saveWorld = useMutation(api.worlds.saveWorld);
  const deleteWorld = useMutation(api.worlds.deleteWorld);

  const counts = useMemo(() => {
    const map = new Map<BlockType, number>();
    for (const block of blocks) map.set(block.type, (map.get(block.type) ?? 0) + 1);
    return map;
  }, [blocks]);

  const updateBlocks = (next: Voxel[]) => {
    setBlocks(next);
    setStatus("Есть несохранённые изменения");
  };

  const generate = (world: WorldData) => {
    setBlocks(world.blocks);
    setLevel(1);
    setStatus(`Сгенерировано ${world.blocks.length} блоков`);
  };

  const openWorld = (id: Id<"worlds">) => {
    const found = worlds?.find((w) => w.id === id);
    if (!found) return;
    setWorldId(found.id);
    setName(found.name);
    setBlocks(found.blocks as Voxel[]);
    setLevel(1);
    setStatus(`Открыт «${found.name}»`);
  };

  const save = async () => {
    if (!token || busy) return;
    setBusy(true);
    setStatus("Сохраняем…");
    try {
      const result = await saveWorld({
        token,
        worldId: worldId ?? undefined,
        name,
        blocks,
      });
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      setWorldId(result.worldId as Id<"worlds">);
      setStatus(`Сохранено: ${blocks.length} блоков`);
    } catch (error) {
      setStatus(friendlyError(error, "Не удалось сохранить мир"));
    } finally {
      setBusy(false);
    }
  };

  const createNew = () => {
    setWorldId(null);
    setName("Новый мир");
    setBlocks(generateStarterWorld(PLOT_SIZE).blocks);
    setLevel(1);
    setStatus("Создан пустой чанк");
  };

  const remove = async (id: Id<"worlds">) => {
    if (!token) return;
    const result = await deleteWorld({ token, worldId: id });
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    if (worldId === id) createNew();
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-950">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-stone-800 bg-stone-900/70 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="pixel-heading text-xs text-grass-400">
            CUBEWORLD
          </Link>
          <span className="hidden text-lg text-stone-500 sm:inline">
            Студия · {user?.name}
          </span>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <input
            className="input !w-56 !py-2 text-lg"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setStatus("Есть несохранённые изменения");
            }}
            placeholder="Название мира"
          />
          <span className="text-lg text-stone-500">{status}</span>
          <button
            type="button"
            className="btn btn-primary !px-4 !py-2 text-[10px]"
            onClick={() => void save()}
            disabled={busy}
          >
            {busy ? "Сохраняем" : "Сохранить"}
          </button>
          <button type="button" className="btn !px-3 !py-2 text-[10px]" onClick={createNew}>
            Новый
          </button>
          <button
            type="button"
            className="btn btn-ghost !px-3 !py-2 text-[10px]"
            onClick={() => void signOut()}
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-0 lg:grid-cols-[260px_1fr_260px]">
        <aside className="flex flex-col gap-6 border-b-2 border-stone-800 bg-stone-900/50 p-4 lg:border-r-2 lg:border-b-0">
          <div>
            <h2 className="pixel-heading mb-4 text-[10px] text-diamond">Палитра</h2>
            {CATEGORIES.map((category) => (
              <div key={category} className="mb-5">
                <p className="label">{CATEGORY_LABELS[category]}</p>
                <div className="grid grid-cols-4 gap-2">
                  {BLOCKS.filter((block) => block.category === category).map((block) => (
                    <button
                      key={block.type}
                      type="button"
                      title={block.name}
                      onClick={() => setSelected(block.type)}
                      className={`flex aspect-square items-center justify-center border-2 transition-transform ${
                        selected === block.type
                          ? "border-grass-400 bg-grass-600/20"
                          : "border-stone-800 bg-stone-950/60 hover:border-stone-600"
                      }`}
                    >
                      <BlockIcon color={block.swatch} scale={0.75} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="relative min-h-[60vh]">
          <BuildScene
            blocks={blocks}
            onChange={updateBlocks}
            selected={selected}
            level={level}
            size={PLOT_SIZE}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="panel pointer-events-auto flex flex-wrap items-center gap-3 px-4 py-2">
              <span className="text-lg text-stone-400">Этаж</span>
              <input
                type="range"
                min={0}
                max={MAX_LEVEL}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-32 accent-grass-500"
              />
              <span className="pixel-heading text-xs text-diamond">{level}</span>
            </div>

            <div className="panel pointer-events-auto flex flex-wrap items-center gap-2 px-3 py-2">
              <button
                type="button"
                className="btn !px-3 !py-2 text-[10px]"
                onClick={() => generate(generateStarterWorld(PLOT_SIZE))}
              >
                Пустой чанк
              </button>
              <button
                type="button"
                className="btn !px-3 !py-2 text-[10px]"
                onClick={() => generate(generateIsland({ size: PLOT_SIZE, seed: Date.now() % 9999, trees: 3 }))}
              >
                Сгенерировать остров
              </button>
            </div>
          </div>
        </main>

        <aside className="flex flex-col gap-6 border-t-2 border-stone-800 bg-stone-900/50 p-4 lg:border-l-2 lg:border-t-0">
          <div>
            <h2 className="pixel-heading mb-4 text-[10px] text-diamond">Мои миры</h2>
            <div className="flex flex-col gap-2">
              {worlds?.length ? (
                worlds.map((world) => (
                  <div
                    key={world.id}
                    className={`flex items-center justify-between gap-2 border-2 px-3 py-2 ${
                      worldId === world.id
                        ? "border-grass-500 bg-grass-600/10"
                        : "border-stone-800 bg-stone-950/50"
                    }`}
                  >
                    <button type="button" className="text-left" onClick={() => openWorld(world.id)}>
                      <p className="text-lg leading-tight text-stone-200">{world.name}</p>
                      <p className="text-sm text-stone-500">{world.blockCount} блоков</p>
                    </button>
                    <button
                      type="button"
                      className="text-stone-600 hover:text-red-400"
                      onClick={() => void remove(world.id)}
                      aria-label="Удалить мир"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-lg text-stone-500">
                  Пока пусто. Постройте что-нибудь и нажмите «Сохранить».
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="pixel-heading mb-4 text-[10px] text-diamond">Статистика</h2>
            <div className="panel space-y-2 px-4 py-3 text-lg">
              <div className="flex justify-between">
                <span className="text-stone-400">Блоков</span>
                <span className="text-diamond">{blocks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Выбран</span>
                <span className="text-grass-400">{BLOCK_BY_TYPE[selected].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Этаж</span>
                <span className="text-lava-400">{level}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1">
              {Array.from(counts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 text-lg text-stone-400">
                    <BlockIcon color={BLOCK_BY_TYPE[type].swatch} scale={0.5} />
                    <span className="flex-1">{BLOCK_BY_TYPE[type].name}</span>
                    <span className="text-stone-500">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          <p className="mt-auto text-sm leading-relaxed text-stone-600">
            ЛКМ — поставить блок, ПКМ — убрать, колесо — приблизить, зажать ЛКМ и тянуть — вращать
            камеру.
          </p>
        </aside>
      </div>
    </div>
  );
}
