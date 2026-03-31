import { openDB, type IDBPDatabase } from "idb";
import type {
  SRSRecord,
  SRSRating,
  DailyLog,
  LeitnerBox,
  CardType,
  UserProgress,
} from "@/types/learning-hack";

const DB_NAME = "lii-srs";
const DB_VERSION = 2;
const SRS_STORE = "srs";
const LOG_STORE = "dailyLogs";

const BOX_INTERVALS: Record<LeitnerBox, number> = {
  1: 1 * 86_400_000,
  2: 3 * 86_400_000,
  3: 7 * 86_400_000,
  4: 14 * 86_400_000,
  5: 30 * 86_400_000,
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          const srs = db.createObjectStore(SRS_STORE, { keyPath: "itemId" });
          srs.createIndex("nextReview", "nextReview");
          srs.createIndex("bookmarked", "bookmarked");
          db.createObjectStore(LOG_STORE, { keyPath: "date" });
        }
        if (oldVersion < 2 && oldVersion >= 1) {
          const srs = tx.objectStore(SRS_STORE);
          if (!srs.indexNames.contains("cardType")) {
            srs.createIndex("cardType", "cardType");
          }
        }
      },
      blocked() {
        dbPromise = null;
        console.warn("[SRS] DB upgrade blocked — close other tabs and reload");
      },
      terminated() {
        dbPromise = null;
        console.warn("[SRS] DB connection terminated unexpectedly");
      },
    });
  }
  return dbPromise;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── Record CRUD ── */

export async function getRecord(itemId: string): Promise<SRSRecord | undefined> {
  const db = await getDB();
  return db.get(SRS_STORE, itemId);
}

export async function getAllRecords(): Promise<SRSRecord[]> {
  const db = await getDB();
  return db.getAll(SRS_STORE);
}

export async function putRecord(rec: SRSRecord): Promise<void> {
  const db = await getDB();
  await db.put(SRS_STORE, rec);
}

export async function ensureRecord(
  itemId: string,
  cardType: CardType
): Promise<SRSRecord> {
  let rec = await getRecord(itemId);
  if (!rec) {
    rec = {
      itemId,
      cardType,
      box: 1,
      lastReviewed: 0,
      nextReview: 0,
      correctCount: 0,
      incorrectCount: 0,
      bookmarked: false,
    };
    await putRecord(rec);
  }
  return rec;
}

/* ── SRS scheduling ── */

function nextBox(current: LeitnerBox, rating: SRSRating): LeitnerBox {
  if (rating === "again") return 1;
  if (rating === "hard") return Math.max(1, current - 1) as LeitnerBox;
  if (rating === "good") return Math.min(5, current + 1) as LeitnerBox;
  return Math.min(5, current + 2) as LeitnerBox;
}

export async function rateCard(
  itemId: string,
  cardType: CardType,
  rating: SRSRating
): Promise<SRSRecord> {
  const rec = await ensureRecord(itemId, cardType);
  const now = Date.now();
  const isCorrect = rating === "good" || rating === "easy";

  rec.box = nextBox(rec.box, rating);
  rec.lastReviewed = now;
  rec.nextReview = now + BOX_INTERVALS[rec.box];
  if (isCorrect) rec.correctCount++;
  else rec.incorrectCount++;

  await putRecord(rec);
  await logReview(isCorrect);
  return rec;
}

/* ── Due cards ── */

export async function getDueCards(): Promise<SRSRecord[]> {
  const db = await getDB();
  const now = Date.now();
  const all = await db.getAllFromIndex(SRS_STORE, "nextReview");
  return all.filter((r) => r.nextReview <= now);
}

export async function getDueCount(): Promise<number> {
  return (await getDueCards()).length;
}

/* ── Bookmarks ── */

export async function toggleBookmark(
  itemId: string,
  cardType: CardType
): Promise<boolean> {
  const rec = await ensureRecord(itemId, cardType);
  rec.bookmarked = !rec.bookmarked;
  await putRecord(rec);
  return rec.bookmarked;
}

export async function getBookmarkedIds(): Promise<Set<string>> {
  const db = await getDB();
  const all: SRSRecord[] = await db.getAll(SRS_STORE);
  return new Set(all.filter((r) => r.bookmarked).map((r) => r.itemId));
}

/* ── Daily logs ── */

async function logReview(correct: boolean): Promise<void> {
  const db = await getDB();
  const date = todayStr();
  let log: DailyLog | undefined = await db.get(LOG_STORE, date);
  if (!log) {
    log = { date, cardsReviewed: 0, correctCount: 0, incorrectCount: 0 };
  }
  log.cardsReviewed++;
  if (correct) log.correctCount++;
  else log.incorrectCount++;
  await db.put(LOG_STORE, log);
}

export async function getDailyLogs(days: number = 30): Promise<DailyLog[]> {
  const db = await getDB();
  const all: DailyLog[] = await db.getAll(LOG_STORE);
  all.sort((a, b) => b.date.localeCompare(a.date));
  return all.slice(0, days);
}

export async function getTodayLog(): Promise<DailyLog> {
  const db = await getDB();
  const date = todayStr();
  const log: DailyLog | undefined = await db.get(LOG_STORE, date);
  return log ?? { date, cardsReviewed: 0, correctCount: 0, incorrectCount: 0 };
}

/* ── Streak ── */

export async function getStreak(): Promise<{ current: number; longest: number }> {
  const db = await getDB();
  const all: DailyLog[] = await db.getAll(LOG_STORE);
  if (all.length === 0) return { current: 0, longest: 0 };

  const dates = new Set(all.filter((l) => l.cardsReviewed > 0).map((l) => l.date));
  if (dates.size === 0) return { current: 0, longest: 0 };

  const sorted = [...dates].sort().reverse();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    let d = sorted[0] === today ? new Date() : new Date(Date.now() - 86_400_000);
    while (dates.has(d.toISOString().slice(0, 10))) {
      current++;
      d = new Date(d.getTime() - 86_400_000);
    }
  }

  let longest = 0;
  let run = 0;
  const allSorted = [...dates].sort();
  for (let i = 0; i < allSorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = new Date(allSorted[i - 1]).getTime();
      const curr = new Date(allSorted[i]).getTime();
      run = curr - prev <= 86_400_000 + 1000 ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
  }

  return { current, longest };
}

/* ── Progress summary ── */

export async function getProgress(totalItems: number): Promise<UserProgress> {
  const records = await getAllRecords();
  const streak = await getStreak();
  const logs = await getDailyLogs(1);

  let mastered = 0;
  let learning = 0;
  const levelMap: Record<number, { total: number; mastered: number; learning: number }> = {};

  for (const r of records) {
    const levelNum = parseLevelFromId(r.itemId);
    if (!levelMap[levelNum]) levelMap[levelNum] = { total: 0, mastered: 0, learning: 0 };
    levelMap[levelNum].total++;
    if (r.box >= 4) {
      mastered++;
      levelMap[levelNum].mastered++;
    } else if (r.lastReviewed > 0) {
      learning++;
      levelMap[levelNum].learning++;
    }
  }

  return {
    totalItems,
    masteredCount: mastered,
    learningCount: learning,
    newCount: totalItems - mastered - learning,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    lastPracticeDate: logs[0]?.date ?? null,
    levelBreakdown: levelMap,
  };
}

function parseLevelFromId(id: string): number {
  const match = id.match(/^L(\d)/);
  return match ? parseInt(match[1], 10) : 1;
}

/* ── Reset ── */

export async function resetAllProgress(): Promise<void> {
  const db = await getDB();
  await db.clear(SRS_STORE);
  await db.clear(LOG_STORE);
}
