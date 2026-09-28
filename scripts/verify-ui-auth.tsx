import { JSDOM } from "jsdom";

const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

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
g.HTMLFormElement = dom.window.HTMLFormElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.IS_REACT_ACT_ENVIRONMENT = true;
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16);
g.cancelAnimationFrame = (id: any) => clearTimeout(id);

// React DOM должен увидеть DOM до импорта, иначе он не подпишется на события.
const { createRoot } = await import("react-dom/client");
const { act } = await import("react-dom/test-utils");
const { createElement, Fragment } = await import("react");
const { ConvexProvider, ConvexReactClient } = await import("convex/react");
const { MemoryRouter, Route, Routes } = await import("react-router-dom");
const { AuthProvider } = await import("../src/lib/auth");
const { AuthPage } = await import("../src/pages/AuthPage");
const { default: App } = await import("../src/App");
const { useLocation } = await import("react-router-dom");

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const h = createElement;
const StudioStub = () => h("div", null, "СТУДИЯ");
const PathProbe = () => h("div", { "data-testid": "path" }, useLocation().pathname + useLocation().search);
const currentPath = () =>
  (dom.window.document.querySelector("[data-testid='path']")?.textContent ?? "").trim();

const type = (element: Element, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(element, value);
  element.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
};

const render = (path: string, useRealApp = false) => {
  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  const convex = new ConvexReactClient(process.env.VITE_CONVEX_URL!);
  act(() => {
    root.render(
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(
          ConvexProvider,
          { client: convex },
          h(
            AuthProvider,
            null,
            h(PathProbe),
            useRealApp
              ? h(App)
              : h(
                  Routes,
                  null,
                  h(Route, { path: "/auth", element: h(AuthPage) }),
                  h(Route, { path: "/studio", element: h(StudioStub) }),
                ),
          ),
        ),
      ),
    );
  });
  return container;
};

const submit = async (container: Element) => {
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    await wait(1200);
  });
};

const run = async () => {
  const email = `ui-${Date.now()}@cubeworld.ru`;
  const password = "diamond123";

  // --- Registration ------------------------------------------------------
  let container = render("/auth?mode=signup");
  check("поле ника показано в режиме регистрации", Boolean(container.querySelector("#name")));

  type(container.querySelector("#email")!, email);
  type(container.querySelector("#name")!, "Steve");
  type(container.querySelector("#password")!, "12345");
  await submit(container);
  check(
    "короткий пароль показывает понятную ошибку",
    (container.textContent ?? "").includes("Пароль минимум 6 символов"),
  );

  type(container.querySelector("#password")!, password);
  await submit(container);
  check("регистрация открывает студию", (container.textContent ?? "").includes("СТУДИЯ"));
  check("токен сохранён в localStorage", Boolean(dom.window.localStorage.getItem("cubeworld.token")));
  check(
    "ошибок с серверным стеком нет",
    !(container.textContent ?? "").includes("Request ID") && !(container.textContent ?? "").includes("Uncaught Error"),
  );

  dom.window.localStorage.clear();
  container.remove();

  // --- Login -------------------------------------------------------------
  container = render("/auth");
  type(container.querySelector("#email")!, email);
  type(container.querySelector("#password")!, "неправильный");
  await submit(container);
  const wrongText = container.textContent ?? "";
  check("неверный пароль показывается по-русски", wrongText.includes("Неверный пароль"));
  check("остались на странице входа", !wrongText.includes("СТУДИЯ"));

  type(container.querySelector("#password")!, password);
  await submit(container);
  check("вход по паролю открывает студию", (container.textContent ?? "").includes("СТУДИЯ"));

  // --- returnTo ----------------------------------------------------------
  dom.window.localStorage.clear();
  container.remove();
  container = render("/auth?returnTo=%2Fstudio%3Ftab%3D1");
  type(container.querySelector("#email")!, email);
  type(container.querySelector("#password")!, password);
  await submit(container);
  await act(async () => {
    await wait(1000);
  });
  check(
    "после входа возвращаемся на сохранённый returnTo",
    currentPath() === "/studio?tab=1",
    currentPath(),
  );

  // --- Session restore ---------------------------------------------------
  container.remove();
  container = render("/studio");
  await act(async () => {
    await wait(1500);
  });
  check("после перезагрузки сессия восстанавливается", (container.textContent ?? "").includes("СТУДИЯ"));

  // --- Logout / RequireAuth ---------------------------------------------
  dom.window.localStorage.clear();
  container.remove();
  container = render("/studio", true);
  await act(async () => {
    await wait(1200);
  });
  check("без токена RequireAuth уводит на /auth", currentPath().startsWith("/auth?returnTo=%2Fstudio"), currentPath());
  check("страница входа показана вместо студии", (container.textContent ?? "").includes("Вход в мир"));

  console.log(failures === 0 ? "\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : `\nПРОВАЛЕНО ПРОВЕРОК: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error("Необработанная ошибка:", error);
  process.exit(1);
});
