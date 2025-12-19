import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { 
  teams, players, bets, parlays, notifications, bankrollSettings,
  InsertTeam, InsertPlayer, InsertBet, InsertParlay, InsertNotification, InsertBankrollSetting
} from "../drizzle/schema";
import { desc } from "drizzle-orm";

// ========== Teams ==========
export async function getAllTeams() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(teams);
}

export async function upsertTeam(team: InsertTeam) {
  const db = await getDb();
  if (!db) return;
  await db.insert(teams).values(team).onDuplicateKeyUpdate({ set: team });
}

// ========== Players ==========
export async function getAllPlayers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(players);
}

export async function getPlayerByName(fullName: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  // First try exact match
  let result = await db.select().from(players).where(eq(players.fullName, fullName)).limit(1);
  if (result.length > 0) return result[0];
  
  // If no exact match, try partial match using LIKE
  const searchTerm = `%${fullName}%`;
  result = await db.select().from(players).where(
    sql`${players.fullName} LIKE ${searchTerm}`
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertPlayer(player: InsertPlayer) {
  const db = await getDb();
  if (!db) return;
  await db.insert(players).values(player).onDuplicateKeyUpdate({ set: player });
}

export async function bulkUpsertPlayers(playerList: InsertPlayer[]) {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Cannot bulk upsert players: database not available");
    return;
  }
  if (playerList.length === 0) {
    console.log("[Database] No players to upsert");
    return;
  }
  
  try {
    console.log(`[Database] Upserting ${playerList.length} players...`);
    let inserted = 0;
    for (const player of playerList) {
      try {
        await db.insert(players).values(player).onDuplicateKeyUpdate({ set: player });
        inserted++;
      } catch (err) {
        console.error(`[Database] Error inserting player ${player.fullName}:`, err);
      }
    }
    console.log(`[Database] Successfully inserted ${inserted}/${playerList.length} players`);
  } catch (error) {
    console.error("[Database] Error during bulk upsert:", error);
  }
}

// ========== Bets ==========
export async function getUserBets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
}

export async function createBet(bet: InsertBet) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bets).values(bet);
}

export async function updateBetOutcome(betId: number, outcome: "won" | "lost", profit: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(bets).set({ outcome, profit }).where(eq(bets.id, betId));
}

// ========== Parlays ==========
export async function getUserParlays(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parlays).where(eq(parlays.userId, userId)).orderBy(desc(parlays.createdAt));
}

export async function createParlay(parlay: InsertParlay) {
  const db = await getDb();
  if (!db) return;
  await db.insert(parlays).values(parlay);
}

export async function updateParlayOutcome(parlayId: number, outcome: "won" | "lost", profit: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(parlays).set({ outcome, profit }).where(eq(parlays.id, parlayId));
}

// ========== Notifications ==========
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(notification);
}

export async function markNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, notificationId));
}

// ========== Bankroll Settings ==========
export async function getUserBankrollSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bankrollSettings).where(eq(bankrollSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertBankrollSettings(settings: InsertBankrollSetting) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bankrollSettings).values(settings).onDuplicateKeyUpdate({ set: settings });
}
