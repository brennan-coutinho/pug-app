import { Router, Request, Response, NextFunction } from "express";
import { eq, and, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, entriesTable } from "@workspace/db";
import {
  ListEntriesQueryParams,
  CreateEntryBody,
  GetEntryParams,
  UpdateEntryParams,
  UpdateEntryBody,
  DeleteEntryParams,
} from "@workspace/api-zod";

const router = Router();

// ─── Auth middleware ───────────────────────────────────────────────────────────

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { userId: string }).userId = userId;
  next();
}

function getUserId(req: Request): string {
  return (req as Request & { userId: string }).userId;
}

// Apply auth to all routes
router.use(requireAuth);

// ─── Format helper ─────────────────────────────────────────────────────────────

function formatEntry(e: typeof entriesTable.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    mediaType: e.mediaType,
    status: e.status,
    posterUrl: e.posterUrl ?? null,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  const query = ListEntriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const userId = getUserId(req);
  const { mediaType, status } = query.data;
  const conditions = [eq(entriesTable.userId, userId)];
  if (mediaType) conditions.push(eq(entriesTable.mediaType, mediaType));
  if (status) conditions.push(eq(entriesTable.status, status));

  const entries = await db
    .select()
    .from(entriesTable)
    .where(and(...conditions))
    .orderBy(entriesTable.updatedAt);

  res.json(entries.map(formatEntry));
});

router.post("/", async (req, res) => {
  const body = CreateEntryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const userId = getUserId(req);
  const { title, mediaType, status, posterUrl } = body.data;

  const existing = await db
    .select()
    .from(entriesTable)
    .where(and(
      eq(entriesTable.userId, userId),
      eq(entriesTable.title, title),
      eq(entriesTable.mediaType, mediaType),
    ))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Entry already exists" });
    return;
  }

  const [entry] = await db
    .insert(entriesTable)
    .values({ userId, title, mediaType, status, posterUrl: posterUrl ?? null })
    .returning();

  res.status(201).json(formatEntry(entry));
});

router.get("/stats/summary", async (req, res) => {
  const userId = getUserId(req);

  const rows = await db
    .select({
      mediaType: entriesTable.mediaType,
      status: entriesTable.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(entriesTable)
    .where(eq(entriesTable.userId, userId))
    .groupBy(entriesTable.mediaType, entriesTable.status);

  const summary = {
    totalMovies: 0,
    totalTv: 0,
    watchedMovies: 0,
    watchedTv: 0,
    wantToWatchMovies: 0,
    wantToWatchTv: 0,
    notWatchedMovies: 0,
    notWatchedTv: 0,
  };

  for (const row of rows) {
    const count = row.count;
    if (row.mediaType === "movie") {
      summary.totalMovies += count;
      if (row.status === "watched") summary.watchedMovies = count;
      if (row.status === "want_to_watch") summary.wantToWatchMovies = count;
      if (row.status === "not_watched") summary.notWatchedMovies = count;
    } else {
      summary.totalTv += count;
      if (row.status === "watched") summary.watchedTv = count;
      if (row.status === "want_to_watch") summary.wantToWatchTv = count;
      if (row.status === "not_watched") summary.notWatchedTv = count;
    }
  }

  res.json(summary);
});

router.get("/:id", async (req, res) => {
  const params = GetEntryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = getUserId(req);
  const [entry] = await db
    .select()
    .from(entriesTable)
    .where(and(eq(entriesTable.id, params.data.id), eq(entriesTable.userId, userId)))
    .limit(1);

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(formatEntry(entry));
});

router.patch("/:id", async (req, res) => {
  const params = UpdateEntryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = UpdateEntryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const userId = getUserId(req);
  const updates: Partial<typeof entriesTable.$inferInsert> = { updatedAt: new Date() };
  if (body.data.title !== undefined) updates.title = body.data.title;
  if (body.data.status !== undefined) updates.status = body.data.status;

  const [entry] = await db
    .update(entriesTable)
    .set(updates)
    .where(and(eq(entriesTable.id, params.data.id), eq(entriesTable.userId, userId)))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(formatEntry(entry));
});

router.delete("/:id", async (req, res) => {
  const params = DeleteEntryParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = getUserId(req);
  const [entry] = await db
    .delete(entriesTable)
    .where(and(eq(entriesTable.id, params.data.id), eq(entriesTable.userId, userId)))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(formatEntry(entry));
});

export default router;
