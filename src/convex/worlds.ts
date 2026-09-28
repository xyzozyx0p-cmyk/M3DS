import { v } from "convex/values";
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";

export type WorldResult = { ok: true; worldId: string } | { ok: false; error: string };

type WorldCtx = QueryCtx | MutationCtx;

const blockValidator = v.array(
  v.object({ x: v.number(), y: v.number(), z: v.number(), type: v.string() }),
);

async function resolveUser(ctx: WorldCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  return session ? session.userId : null;
}

export const listWorlds = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await resolveUser(ctx, args.token);
    if (!userId) return [];
    const worlds = await ctx.db
      .query("worlds")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    return worlds
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((w) => ({
        id: w._id,
        name: w.name,
        blockCount: w.blocks.length,
        updatedAt: w.updatedAt,
        blocks: w.blocks,
      }));
  },
});

export const getWorld = query({
  args: { token: v.string(), worldId: v.id("worlds") },
  handler: async (ctx, args) => {
    const userId = await resolveUser(ctx, args.token);
    if (!userId) return null;
    const world = await ctx.db.get(args.worldId);
    if (!world || world.ownerId !== userId) return null;
    return { id: world._id, name: world.name, blocks: world.blocks, updatedAt: world.updatedAt };
  },
});

export const saveWorld = mutation({
  args: {
    token: v.string(),
    worldId: v.optional(v.id("worlds")),
    name: v.string(),
    blocks: blockValidator,
  },
  handler: async (ctx, args): Promise<WorldResult> => {
    const userId = await resolveUser(ctx, args.token);
    if (!userId) return { ok: false, error: "Требуется вход" };
    if (args.blocks.length > 20000) return { ok: false, error: "Слишком много блоков (максимум 20000)" };

    const name = args.name.trim() || "Без названия";
    const now = Date.now();

    if (args.worldId) {
      const existing = await ctx.db.get(args.worldId);
      if (!existing || existing.ownerId !== userId) return { ok: false, error: "Мир не найден" };
      await ctx.db.patch(args.worldId, { name, blocks: args.blocks, updatedAt: now });
      return { ok: true, worldId: args.worldId };
    }

    const worldId = await ctx.db.insert("worlds", {
      ownerId: userId,
      name,
      blocks: args.blocks,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, worldId };
  },
});

export const deleteWorld = mutation({
  args: { token: v.string(), worldId: v.id("worlds") },
  handler: async (ctx, args): Promise<WorldResult> => {
    const userId = await resolveUser(ctx, args.token);
    if (!userId) return { ok: false, error: "Требуется вход" };
    const world = await ctx.db.get(args.worldId);
    if (!world || world.ownerId !== userId) return { ok: false, error: "Мир не найден" };
    await ctx.db.delete(args.worldId);
    return { ok: true, worldId: args.worldId };
  },
});
