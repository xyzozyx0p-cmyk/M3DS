import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

const users = {
  register: makeFunctionReference("users:register"),
  login: makeFunctionReference("users:login"),
  me: makeFunctionReference("users:me"),
  logout: makeFunctionReference("users:logout"),
};
const worlds = {
  listWorlds: makeFunctionReference("worlds:listWorlds"),
  saveWorld: makeFunctionReference("worlds:saveWorld"),
  getWorld: makeFunctionReference("worlds:getWorld"),
  deleteWorld: makeFunctionReference("worlds:deleteWorld"),
};

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
};

const run = async () => {
  const email = `builder-${Date.now()}@cubeworld.ru`;

  // 1. Registration
  const session = await client.mutation(users.register, { email, name: "Steve", password: "diamond123" });
  check("регистрация успешна", session.ok && session.token.length > 20);
  if (!session.ok) throw new Error(session.error);
  const token = session.token;

  const duplicate = await client.mutation(users.register, { email, name: "Steve2", password: "diamond123" });
  check("повторная регистрация отклонена", !duplicate.ok && duplicate.error.includes("уже зарегистрирован"), duplicate.ok ? "" : duplicate.error);

  const short = await client.mutation(users.register, { email: `x${Date.now()}@a.ru`, name: "x", password: "123" });
  check("короткий пароль отклонён", !short.ok && short.error.includes("минимум 6"));

  // 2. Session
  const me = await client.query(users.me, { token });
  check("сессия активна сразу после регистрации", me?.email === email, `ник: ${me?.name}`);
  check("чужая сессия отклоняется", (await client.query(users.me, { token: "невалидный" })) === null);

  // 3. Worlds: create from an editor-like block list
  const blocks = [
    { x: 0, y: 0, z: 0, type: "grass" },
    { x: 1, y: 0, z: 0, type: "stone" },
    { x: 2, y: 1, z: 2, type: "diamondOre" },
  ];
  const created = await client.mutation(worlds.saveWorld, { token, name: "Мой остров", blocks });
  check("мир сохранён", created.ok);
  if (!created.ok) throw new Error(created.error);
  const worldId = created.worldId;

  const list = await client.query(worlds.listWorlds, { token });
  check("мир появился в списке", list.length === 1 && list[0].name === "Мой остров", `блоков: ${list[0]?.blockCount}`);

  // 4. Editing the world updates the same record
  const updated = await client.mutation(worlds.saveWorld, {
    token,
    worldId,
    name: "Мой остров 2",
    blocks: [...blocks, { x: 3, y: 0, z: 3, type: "glass" }],
  });
  check("повторное сохранение обновляет тот же мир", updated.ok && updated.worldId === worldId);
  const afterUpdate = await client.query(worlds.listWorlds, { token });
  check("обновление применилось", afterUpdate.length === 1 && afterUpdate[0].name === "Мой остров 2" && afterUpdate[0].blockCount === 4);

  // 5. Logout -> login -> world must survive
  await client.mutation(users.logout, { token });
  check("токен не работает после выхода", (await client.query(users.me, { token })) === null);

  const wrong = await client.mutation(users.login, { email, password: "неправильный" });
  check("неверный пароль отклонён", !wrong.ok && wrong.error === "Неверный пароль", wrong.ok ? "" : wrong.error);

  const relogin = await client.mutation(users.login, { email, password: "diamond123" });
  check("вход по паролю работает", relogin.ok);
  if (!relogin.ok) throw new Error(relogin.error);

  const restored = await client.query(worlds.listWorlds, { token: relogin.token });
  check("мир пережил выход и повторный вход", restored.length === 1 && restored[0].id === worldId && restored[0].blockCount === 4, `блоков: ${restored[0]?.blockCount}`);
  const restoredWorld = await client.query(worlds.getWorld, { token: relogin.token, worldId });
  check("содержимое мира восстановлено", restoredWorld?.blocks.length === 4 && restoredWorld.blocks[3].type === "glass");

  // 6. Isolation between accounts
  const intruder = await client.mutation(users.register, { email: `other-${Date.now()}@cubeworld.ru`, name: "Alex", password: "creeper123" });
  if (!intruder.ok) throw new Error(intruder.error);
  check("чужие миры не видны", (await client.query(worlds.listWorlds, { token: intruder.token })).length === 0);
  check("чужой мир не читается", (await client.query(worlds.getWorld, { token: intruder.token, worldId })) === null);
  const stolen = await client.mutation(worlds.deleteWorld, { token: intruder.token, worldId });
  check("чужой мир не удаляется", !stolen.ok && stolen.error === "Мир не найден");
  const noAuth = await client.mutation(worlds.saveWorld, { token: "нет", name: "x", blocks: [] });
  check("сохранение без входа отклонено", !noAuth.ok && noAuth.error === "Требуется вход");
  const ghostList = await client.query(worlds.listWorlds, { token: "нет" });
  check("список без входа пуст", ghostList.length === 0);

  // 7. Delete
  const removed = await client.mutation(worlds.deleteWorld, { token: relogin.token, worldId });
  check("мир удаляется", removed.ok);
  check("после удаления список пуст", (await client.query(worlds.listWorlds, { token: relogin.token })).length === 0);

  console.log(failures === 0 ? "\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : `\nПРОВАЛЕНО ПРОВЕРОК: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error("Необработанная ошибка:", error);
  process.exit(1);
});
