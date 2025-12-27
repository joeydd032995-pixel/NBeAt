import { eq, sql, and } from "drizzle-orm";
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

export async function searchPlayers(options: {
  search?: string;
  position?: string;
  teamId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { search, position, teamId, limit = 50 } = options;
  
  let query = db.select().from(players);
  
  const conditions = [];
  
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(sql`${players.fullName} LIKE ${searchTerm}`);
  }
  
  if (position && position.trim()) {
    // Handle positions like "PG", "SG", "SF", "PF", "C" or combinations like "PG-SG"
    const positionTerm = `%${position.trim()}%`;
    conditions.push(sql`${players.position} LIKE ${positionTerm}`);
  }
  
  if (teamId) {
    conditions.push(eq(players.teamId, teamId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return await query.limit(limit);
}

export async function getPlayerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
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
    let updated = 0;
    
    for (const player of playerList) {
      try {
        // First check if player exists by fullName (most reliable match)
        const existingByName = await db.select().from(players)
          .where(eq(players.fullName, player.fullName))
          .limit(1);
        
        if (existingByName.length > 0) {
          // Update existing player by fullName
          await db.update(players)
            .set({
              externalId: player.externalId,
              firstName: player.firstName,
              lastName: player.lastName,
              teamId: player.teamId,
              position: player.position,
              ppg: player.ppg,
              fgm: player.fgm,
              fga: player.fga,
              fgPct: player.fgPct,
              ftm: player.ftm,
              fta: player.fta,
              ftPct: player.ftPct,
              tpm: player.tpm,
              tpa: player.tpa,
              tpPct: player.tpPct,
              rpg: player.rpg,
              orpg: player.orpg,
              drpg: player.drpg,
              apg: player.apg,
              topg: player.topg,
              spg: player.spg,
              bpg: player.bpg,
              pfpg: player.pfpg,
              ts: player.ts,
              efg: player.efg,
              gamesPlayed: player.gamesPlayed,
              minutesPerGame: player.minutesPerGame,
            })
            .where(eq(players.fullName, player.fullName));
          updated++;
          continue;
        }
        
        // Insert new player
        await db.insert(players).values(player);
        inserted++;
      } catch (err) {
        console.error(`[Database] Error upserting player ${player.fullName}:`, err);
      }
    }
    console.log(`[Database] Successfully processed ${playerList.length} players (${inserted} inserted, ${updated} updated)`);
  } catch (error) {
    console.error("[Database] Error during bulk upsert:", error);
  }
}

// ========== Player Cleanup ==========
export async function cleanupDuplicatePlayers(): Promise<{ removed: number; remaining: number }> {
  const db = await getDb();
  if (!db) {
    console.error("[Database] Cannot cleanup players: database not available");
    return { removed: 0, remaining: 0 };
  }
  
  try {
    console.log("[Database] Starting duplicate player cleanup...");
    
    // Get all players
    const allPlayers = await db.select().from(players);
    console.log(`[Database] Found ${allPlayers.length} total player records`);
    
    // Group by fullName
    const playersByName = new Map<string, typeof allPlayers>();
    for (const player of allPlayers) {
      const name = player.fullName || '';
      if (!playersByName.has(name)) {
        playersByName.set(name, []);
      }
      playersByName.get(name)!.push(player);
    }
    
    console.log(`[Database] Found ${playersByName.size} unique player names`);
    
    // Find duplicates and keep the one with the most stats (highest PPG or most recent)
    let removed = 0;
    for (const [name, entries] of playersByName) {
      if (entries.length > 1) {
        // Sort by PPG descending (keep the one with real stats)
        entries.sort((a, b) => {
          const ppgA = parseFloat(a.ppg || '0');
          const ppgB = parseFloat(b.ppg || '0');
          return ppgB - ppgA;
        });
        
        // Keep the first one (highest PPG), delete the rest
        const toKeep = entries[0];
        const toDelete = entries.slice(1);
        
        for (const dup of toDelete) {
          await db.delete(players).where(eq(players.id, dup.id));
          removed++;
        }
      }
    }
    
    const remaining = allPlayers.length - removed;
    console.log(`[Database] Cleanup complete: removed ${removed} duplicates, ${remaining} players remaining`);
    
    return { removed, remaining };
  } catch (error) {
    console.error("[Database] Error during cleanup:", error);
    return { removed: 0, remaining: 0 };
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
