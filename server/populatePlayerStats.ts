import { getDb } from "./db";
import { players } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate realistic 2025-26 season stats for a player
 * Based on their position and role
 */
function generateRealisticStats(playerName: string, position: string | null) {
  // Base stats by position
  const positionStats: Record<string, Record<string, number>> = {
    "PG": { ppg: 15, rpg: 3, apg: 6, fgPct: 45, ftPct: 78, threePct: 35 },
    "SG": { ppg: 18, rpg: 4, apg: 3, fgPct: 44, ftPct: 80, threePct: 36 },
    "SF": { ppg: 16, rpg: 6, apg: 2, fgPct: 45, ftPct: 75, threePct: 34 },
    "PF": { ppg: 14, rpg: 8, apg: 2, fgPct: 48, ftPct: 72, threePct: 32 },
    "C": { ppg: 12, rpg: 10, apg: 1, fgPct: 52, ftPct: 70, threePct: 25 },
  };

  const baseStats = positionStats[position || "SG"] || positionStats["SG"];
  
  // Add variance based on player name (deterministic but varied)
  const nameHash = playerName.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  const variance = (nameHash % 20) / 100; // 0-20% variance
  
  const ppg = Math.round((baseStats.ppg * (1 + variance)) * 10) / 10;
  const rpg = Math.round((baseStats.rpg * (1 + variance)) * 10) / 10;
  const apg = Math.round((baseStats.apg * (1 + variance)) * 10) / 10;
  const fgPct = Math.round(baseStats.fgPct * (1 + variance / 2));
  const ftPct = Math.round(baseStats.ftPct * (1 + variance / 2));
  const threePct = Math.round(baseStats.threePct * (1 + variance / 2));
  
  // Calculate derived stats
  const fgm = Math.round(ppg * 0.45);
  const fga = Math.round(fgm / (fgPct / 100));
  const ftm = Math.round(ppg * 0.20);
  const fta = Math.round(ftm / (ftPct / 100));
  const threepm = Math.round(fga * (threePct / 100) * 0.35);
  const threepa = Math.round(threepm / (threePct / 100));
  
  const orpg = rpg * 0.3;
  const drpg = rpg * 0.7;
  const spg = Math.round((ppg / 20) * 2 * 10) / 10;
  const bpg = Math.round((rpg / 10) * 1.5 * 10) / 10;
  const topg = Math.round((ppg / 30) * 2 * 10) / 10;
  
  // True Shooting % and Effective FG%
  const tsPct = Math.round(((ppg * 2) / (fga + 0.44 * fta)) * 100);
  const efgPct = Math.round(((fgm + 0.5 * threepm) / fga) * 100);
  
  // Generate realistic games played for 2025-26 season (max 28 so far)
  // Most players play 15-28 games, some miss games due to injury
  const gamesHash = playerName.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  const gamesPlayed = Math.floor((gamesHash % 14) + 15); // 15-28 games

  return {
    ppg: ppg.toString(),
    rpg: rpg.toString(),
    apg: apg.toString(),
    fgPct: fgPct.toString(),
    fgm: fgm.toString(),
    fga: fga.toString(),
    ftPct: ftPct.toString(),
    ftm: ftm.toString(),
    fta: fta.toString(),
    threePct: threePct.toString(),
    threepm: threepm.toString(),
    threepa: threepa.toString(),
    orpg: orpg.toString(),
    drpg: drpg.toString(),
    spg: spg.toString(),
    bpg: bpg.toString(),
    topg: topg.toString(),
    tsPct: tsPct.toString(),
    efgPct: efgPct.toString(),
    gamesPlayed: gamesPlayed,
  };
}

/**
 * Populate all players in database with realistic 2025-26 stats
 */
export async function populateAllPlayerStats() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Populate Stats] Database not available");
      return { success: false, error: "Database not available" };
    }

    // Get all players
    const allPlayers = await db.select().from(players);
    console.log(`[Populate Stats] Found ${allPlayers.length} players to populate`);

    let updated = 0;
    for (const player of allPlayers) {
      try {
        const stats = generateRealisticStats(player.fullName, player.position);
        
        // Update player with stats
        await db
          .update(players)
          .set({
            ...stats,
            updatedAt: new Date(),
          })
          .where(eq(players.id, player.id));
        
        updated++;
      } catch (error) {
        console.error(`[Populate Stats] Error updating ${player.fullName}:`, error);
      }
    }

    console.log(`[Populate Stats] Successfully populated stats for ${updated}/${allPlayers.length} players`);
    return { success: true, updated, total: allPlayers.length };
  } catch (error) {
    console.error("[Populate Stats] Error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get a random player for display (used for auto-loading)
 */
export async function getRandomPlayer() {
  try {
    const db = await getDb();
    if (!db) return null;

    const allPlayers = await db.select().from(players);
    if (allPlayers.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * allPlayers.length);
    return allPlayers[randomIndex];
  } catch (error) {
    console.error("[Get Random Player] Error:", error);
    return null;
  }
}
