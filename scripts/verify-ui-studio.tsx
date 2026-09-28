import { JSDOM } from "jsdom";
import { mock } from "bun:test";

const dom = new JSDOM(`<!doctype html><html><body></body></html>`, { url: "http://localhost/" });
for (const name of ["oninput", "onchange", "onclick", "onsubmit", "onkeydown"]) {
  Object.defineProperty(dom.window.Document.prototype, name, {
    value: null,
    writable: true,
    configurable: true,
  });
}

const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.localStorage = dom.window.localStorage;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Event = dom.window.Event;
g.IS_REACT_ACT_ENVIRONMENT = true;
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16);
g.cancelAnimationFrame = (id: any) => clearTimeout(id);

// WebGL в jsdom недоступен, поэтому 3D-сцена заменяется заглушкой,
// которая честно вызывает те же колбэки onChange, что и клики по сцене.
let sceneProps: any = null;
mock.module("../src/components/three/BuildScene", () => ({
  BuildScene: (props: any) => {
    sceneProps = props;
    return null;
  },
}));

const { createRoot } = await import("react-dom/client");
const { act } = await import("react-dom/test-utils");
const { createElement: h } = await import("react");
const { ConvexProvider, ConvexReactClient } = await import("convex/react");
const { MemoryRouter } = await import("react-router-dom");
const { AuthProvider } = await import("../src/lib/auth");
const { Studio } = await import("../src/pages/Studio");
const { ConvexHttpClient } = await import("convex/browser");
const { makeFunctionReference } = await import("convex/server");

const http = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);
const register = async (args: { email: string; name: string; password: string }) => {
  const result = await http.mutation(makeFunctionReference("users:register"), args);
  if (!result.ok) throw new Error(result.error);
  return result;
};

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const email = `studio-${Date.now()}@cubeworld.ru`;
  const password = "diamond123";
  const session = await register({ email, name: "Steve", password });
  dom.window.localStorage.setItem("cubeworld.token", session.token);

  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  const convex = new ConvexReactClient(process.env.VITE_CONVEX_URL!);

  let mountKey = 1;
  const mount = () =>
    act(() => {
      root.render(
        h(
          MemoryRouter,
          { initialEntries: ["/studio"] },
          h(ConvexProvider, { client: convex }, h(AuthProvider, null, h(Studio, { key: mountKey }))),
        ),
      );
    });

  await mount();
  await act(async () => {
    await wait(1500);
  });

  const text = () => container.textContent ?? "";
  const blockCount = () => Number((text().match(/Блоков(\d+)/) ?? [])[1] ?? 0);
  const headerStatus = () => {
    const spans = [...container.querySelectorAll("header span.text-stone-500")];
    return (spans[spans.length - 1] as HTMLElement | null)?.textContent?.trim() ?? "";
  };

  check("студия открылась", text().includes("Палитра") && text().includes("Мои миры"));
  const start = blockCount();
  check("стартовый чанк отрисован", start > 400, `блоков: ${start}`);

  // --- Block placement / removal through the scene callback --------------
  await act(async () => {
    sceneProps.onChange([...sceneProps.blocks, { x: 3, y: 1, z: 3, type: "cobblestone" }]);
    await wait(200);
  });
  const afterPlace = blockCount();
  check("постановка блока из сцены увеличивает счётчик", afterPlace === start + 1, `${start} → ${afterPlace}`);

  await act(async () => {
    sceneProps.onChange(sceneProps.blocks.filter((b: any) => !(b.x === 3 && b.y === 1 && b.z === 3)));
    await wait(200);
  });
  check("удаление блока уменьшает счётчик", blockCount() === start, `${afterPlace} → ${blockCount()}`);

  // --- Island generation -------------------------------------------------
  const generateButton = [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Сгенерировать остров"),
  )!;
  await act(async () => {
    generateButton.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    await wait(600);
  });
  const islandCount = blockCount();
  check("генерация острова меняет мир", islandCount !== start && headerStatus().startsWith("Сгенерировано"), `${islandCount} блоков, статус: ${headerStatus()}`);

  // --- Saving ------------------------------------------------------------
  const nameInput = container.querySelector('input[placeholder="Название мира"]') as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(nameInput, "Остров Стива");
    nameInput.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    await wait(200);
  });

  const saveButton = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Сохранить"))!;
  await act(async () => {
    saveButton.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    await wait(2000);
  });
  check("кнопка «Сохранить» пишет статус", headerStatus().startsWith("Сохранено"), headerStatus());
  check("мир появился в списке «Мои миры»", text().includes("Остров Стива") && text().includes(`${islandCount} блоков`));

  // --- New session: the world must come back -----------------------------
  const names = [...container.querySelectorAll("button")].filter((b) => b.textContent?.includes("Остров Стива"));
  const listedBlocks = names[0]?.textContent ?? "";
  const savedCount = Number((listedBlocks.match(/(\d+) блоков/) ?? [])[1] ?? 0);
  check("в списке указано точное число блоков", savedCount === islandCount, listedBlocks);

  // Пересоздаём студию с нуля, как после перезагрузки страницы.
  mountKey += 1;
  sceneProps = null;
  await act(async () => {
    root.render(
      h(
        MemoryRouter,
        { initialEntries: ["/studio"] },
        h(ConvexProvider, { client: convex }, h(AuthProvider, null, h(Studio, { key: mountKey }))),
      ),
    );
    await wait(2500);
  });
  const container2 = container;
  const text2 = () => container2.textContent ?? "";
  if (!text2().includes("Остров Стива")) {
    const token = dom.window.localStorage.getItem("cubeworld.token");
    const direct = await http.query(makeFunctionReference("worlds:listWorlds"), { token: token ?? "" });
    console.log("  диагностика: токен есть =", Boolean(token), "| прямая выборка вернула миров =", direct.length, "| текст:", text2().slice(0, 200));
  }
  check("после новой сессии мир на месте", text2().includes("Остров Стива"), text2().includes("Остров Стива") ? "" : text2().slice(0, 120));

  const openButton = [...container2.querySelectorAll("button")].find((b) => b.textContent?.includes("Остров Стива"))!;
  await act(async () => {
    openButton.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    await wait(800);
  });
  const restoredCount = Number((text2().match(/Блоков(\d+)/) ?? [])[1] ?? 0);
  check("открытый мир восстанавливает все блоки", restoredCount === islandCount, `${restoredCount} vs ${islandCount}`);

  // --- Delete ------------------------------------------------------------
  const deleteButton = [...container2.querySelectorAll("button")].find((b) => b.textContent?.trim() === "✕")!;
  await act(async () => {
    deleteButton.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    await wait(1500);
  });
  check("мир удаляется из списка", !text2().includes("Остров Стива"));

  console.log(failures === 0 ? "\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : `\nПРОВАЛЕНО ПРОВЕРОК: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error("Необработанная ошибка:", error);
  process.exit(1);
});
