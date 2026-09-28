import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export type AuthResult =
  | { ok: true; token: string; userId: string }
  | { ok: false; error: string };

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`cubeworld::${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function newToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export const register = mutation({
  args: { email: v.string(), name: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<AuthResult> => {
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) return { ok: false, error: "Некорректный email" };
    if (args.password.length < 6) return { ok: false, error: "Пароль минимум 6 символов" };

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return { ok: false, error: "Такой email уже зарегистрирован" };

    const userId = await ctx.db.insert("users", {
      email,
      name: args.name.trim() || email.split("@")[0],
      passwordHash: await hashPassword(args.password),
      createdAt: Date.now(),
    });

    const token = newToken();
    await ctx.db.insert("sessions", { token, userId, createdAt: Date.now() });
    return { ok: true, token, userId };
  },
});

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<AuthResult> => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user) return { ok: false, error: "Пользователь не найден" };
    if (user.passwordHash !== (await hashPassword(args.password))) {
      return { ok: false, error: "Неверный пароль" };
    }

    const token = newToken();
    await ctx.db.insert("sessions", { token, userId: user._id, createdAt: Date.now() });
    return { ok: true, token, userId: user._id };
  },
});

export const me = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!session) return null;
    const user = await ctx.db.get(session.userId);
    if (!user) return null;
    return { id: user._id, name: user.name, email: user.email, token: args.token };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return { ok: true };
  },
});
