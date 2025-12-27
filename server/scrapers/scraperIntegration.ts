import { getDb } from "../db";
import { players } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as path from "path";
import * as fs from "fs";

interface ScraperResult {
  success: boolean;
  playersCount?: number;
  error?: string;
  source?: "json-file" | "nba-api" | "python-scraper";
}

interface PlayerStats {
  fullName: string;
  position: string;
  team: string;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  fgm: number;
  fga: number;
  ftPct: number;
  ftm: number;
  fta: number;
  tpPct: number;
  tpm: number;
  tpa: number;
  orpg: number;
  drpg: number;
  spg: number;
  bpg: number;
  topg: number;
  pfpg: number;
  ts: number;
  efg: number;
}

/**
 * Load stats from the pre-fetched JSON file
 */
function loadStatsFromJSON(): PlayerStats[] | null {
  try {
    const jsonPath = path.join(process.cwd(), "data/real_nba_stats_2025_26.json");
    if (!fs.existsSync(jsonPath)) {
      console.warn("[Scraper Integration] JSON file not found:", jsonPath);
      return null;
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    if (!jsonData.success || !jsonData.players || jsonData.players.length === 0) {
      console.warn("[Scraper Integration] Invalid JSON data");
      return null;
    }

    console.log(`[Scraper Integration] Loaded ${jsonData.players.length} players from JSON file`);
    return jsonData.players;
  } catch (error) {
    console.error("[Scraper Integration] Error loading JSON:", error);
    return null;
  }
}

/**
 * Fetch fresh stats from NBA API using Python script
 */
async function fetchFreshStatsFromNBAAPI(): Promise<PlayerStats[] | null> {
  try {
    const { execSync } = await import("child_process");
    const scriptPath = path.join(process.cwd(), "scripts/fetch_real_nba_stats.py");

    console.log("[Scraper Integration] Running NBA API Python script...");
    const result = execSync(`python3 ${scriptPath}`, {
      encoding: "utf-8",
      timeout: 120000, // 2 minute timeout
    });

    const parsedResult = JSON.parse(result);
    if (!parsedResult.success || !parsedResult.players) {
      throw new Error(parsedResult.error || "NBA API script failed");
    }

    // Also save to JSON file for future use
    const jsonPath = path.join(process.cwd(), "data/real_nba_stats_2025_26.json");
    fs.writeFileSync(jsonPath, result, "utf-8");
    console.log("[Scraper Integration] Saved fresh stats to JSON file");

    return parsedResult.players;
  } catch (error) {
    console.error("[Scraper Integration] NBA API fetch failed:", error);
    return null;
  }
}

/**
 * Scrape real NBA stats - uses JSON file first, then live NBA API
 * NO FAKE DATA FALLBACK - returns error if all sources fail
 */
export async function scrapeRealNBAStats(): Promise<ScraperResult> {
  try {
    console.log("[Scraper Integration] Starting real NBA stats update...");

    let playerStats: PlayerStats[] | null = null;
    let source: "json-file" | "nba-api" | "python-scraper" = "json-file";

    // Step 1: Try loading from JSON file first (fastest)
    playerStats = loadStatsFromJSON();
    if (playerStats && playerStats.length > 0) {
      source = "json-file";
      console.log(`[Scraper Integration] Using ${playerStats.length} players from JSON file`);
    } else {
      // Step 2: Fetch fresh data from NBA API
      console.log("[Scraper Integration] JSON file unavailable, fetching from NBA API...");
      playerStats = await fetchFreshStatsFromNBAAPI();
      if (playerStats && playerStats.length > 0) {
        source = "nba-api";
        console.log(`[Scraper Integration] Fetched ${playerStats.length} players from NBA API`);
      }
    }

    // NO FAKE DATA FALLBACK - if we can't get real data, return error
    if (!playerStats || playerStats.length === 0) {
      return {
        success: false,
        error: "Could not fetch real NBA stats from any source. Please check your internet connection and try again.",
      };
    }

    // Update database with real stats
    console.log("[Scraper Integration] Updating database with real stats...");
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available",
      };
    }

    let updated = 0;
    let inserted = 0;

    for (const stat of playerStats) {
      try {
        // Find player by name
        const existingPlayer = await db
          .select()
          .from(players)
          .where(eq(players.fullName, stat.fullName))
          .limit(1);

        if (existingPlayer.length > 0) {
          // Update existing player
          await db
            .update(players)
            .set({
              position: stat.position,
              ppg: stat.ppg.toString(),
              rpg: stat.rpg.toString(),
              apg: stat.apg.toString(),
              fgPct: stat.fgPct.toString(),
              fgm: stat.fgm.toString(),
              fga: stat.fga.toString(),
              ftPct: stat.ftPct.toString(),
              ftm: stat.ftm.toString(),
              fta: stat.fta.toString(),
              tpm: stat.tpm.toString(),
              tpa: stat.tpa.toString(),
              tpPct: stat.tpPct.toString(),
              orpg: stat.orpg.toString(),
              drpg: stat.drpg.toString(),
              spg: stat.spg.toString(),
              bpg: stat.bpg.toString(),
              topg: stat.topg.toString(),
              ts: stat.ts.toString(),
              efg: stat.efg.toString(),
              pfpg: stat.pfpg.toString(),
              gamesPlayed: stat.gamesPlayed,
              updatedAt: new Date(),
            })
            .where(eq(players.id, existingPlayer[0].id));

          updated++;
        }
      } catch (error) {
        console.warn(`[Scraper Integration] Error updating ${stat.fullName}:`, error);
      }
    }

    console.log(
      `[Scraper Integration] Successfully updated ${updated} players in database (source: ${source})`
    );

    return {
      success: true,
      playersCount: updated,
      source,
    };
  } catch (error) {
    console.error("[Scraper Integration] Error:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Force refresh stats from NBA API (bypasses JSON cache)
 */
export async function forceRefreshFromNBAAPI(): Promise<ScraperResult> {
  try {
    console.log("[Scraper Integration] Force refreshing from NBA API...");

    const playerStats = await fetchFreshStatsFromNBAAPI();
    if (!playerStats || playerStats.length === 0) {
      return {
        success: false,
        error: "Failed to fetch fresh stats from NBA API",
      };
    }

    // Update database
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        error: "Database not available",
      };
    }

    let updated = 0;
    for (const stat of playerStats) {
      try {
        const existingPlayer = await db
          .select()
          .from(players)
          .where(eq(players.fullName, stat.fullName))
          .limit(1);

        if (existingPlayer.length > 0) {
          await db
            .update(players)
            .set({
              position: stat.position,
              ppg: stat.ppg.toString(),
              rpg: stat.rpg.toString(),
              apg: stat.apg.toString(),
              fgPct: stat.fgPct.toString(),
              fgm: stat.fgm.toString(),
              fga: stat.fga.toString(),
              ftPct: stat.ftPct.toString(),
              ftm: stat.ftm.toString(),
              fta: stat.fta.toString(),
              tpm: stat.tpm.toString(),
              tpa: stat.tpa.toString(),
              tpPct: stat.tpPct.toString(),
              orpg: stat.orpg.toString(),
              drpg: stat.drpg.toString(),
              spg: stat.spg.toString(),
              bpg: stat.bpg.toString(),
              topg: stat.topg.toString(),
              ts: stat.ts.toString(),
              efg: stat.efg.toString(),
              pfpg: stat.pfpg.toString(),
              gamesPlayed: stat.gamesPlayed,
              updatedAt: new Date(),
            })
            .where(eq(players.id, existingPlayer[0].id));

          updated++;
        }
      } catch (error) {
        console.warn(`[Scraper Integration] Error updating ${stat.fullName}:`, error);
      }
    }

    return {
      success: true,
      playersCount: updated,
      source: "nba-api",
    };
  } catch (error) {
    console.error("[Scraper Integration] Force refresh error:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Get scraper/data status
 */
export async function getScraperStatus(): Promise<{
  lastScraped?: Date;
  playerCount?: number;
  jsonFileExists: boolean;
  jsonPlayerCount?: number;
  message: string;
}> {
  try {
    // Check JSON file status
    const jsonPath = path.join(process.cwd(), "data/real_nba_stats_2025_26.json");
    const jsonFileExists = fs.existsSync(jsonPath);
    let jsonPlayerCount = 0;

    if (jsonFileExists) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        jsonPlayerCount = jsonData.players?.length || 0;
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Check database status
    const db = await getDb();
    if (!db) {
      return {
        jsonFileExists,
        jsonPlayerCount,
        message: "Database not available",
      };
    }

    const allPlayers = await db.select().from(players);
    const playersWithStats = allPlayers.filter((p) => {
      const gp = parseInt(p.gamesPlayed?.toString() || "0");
      return gp > 0 && gp <= 82; // Valid games played for current season
    });

    if (playersWithStats.length > 0) {
      return {
        playerCount: playersWithStats.length,
        jsonFileExists,
        jsonPlayerCount,
        message: `${playersWithStats.length} players with 2025-26 season stats in database. JSON file has ${jsonPlayerCount} players.`,
      };
    }

    return {
      playerCount: allPlayers.length,
      jsonFileExists,
      jsonPlayerCount,
      message: `${allPlayers.length} players in database (stats may need refresh). JSON file has ${jsonPlayerCount} players.`,
    };
  } catch (error) {
    return {
      jsonFileExists: false,
      message: `Error checking status: ${error}`,
    };
  }
}
