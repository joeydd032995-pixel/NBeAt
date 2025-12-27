import axios from "axios";
import { bulkUpsertPlayers, upsertTeam } from "./db";
import { InsertPlayer, InsertTeam } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

/**
 * Normalize a name for matching by removing diacritics and converting to lowercase
 */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .trim();
}

// Team abbreviation to ID mapping for the database
const TEAM_ABBR_TO_ID: Record<string, number> = {
  "ATL": 1, "BOS": 2, "BKN": 3, "BRK": 3, "CHA": 4, "CHO": 4, "CHI": 5, "CLE": 6,
  "DAL": 7, "DEN": 8, "DET": 9, "GSW": 10, "GS": 10, "HOU": 11, "IND": 12,
  "LAC": 13, "LAL": 14, "MEM": 15, "MIA": 16, "MIL": 17, "MIN": 18,
  "NOP": 19, "NO": 19, "NYK": 20, "NY": 20, "OKC": 21, "ORL": 22,
  "PHI": 23, "PHX": 24, "PHO": 24, "POR": 25, "SAC": 26, "SAS": 27, "SA": 27,
  "TOR": 28, "UTA": 29, "WAS": 30
};

interface RealPlayerStats {
  fullName: string;
  position: string;
  team: string;
  gamesPlayed: number;
  mpg: number;  // Minutes per game
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
  plusMinus?: number;  // Plus/Minus
  age?: number;  // Player age
}

/**
 * Load real NBA stats from the JSON file
 */
function loadRealStatsFromJSON(): RealPlayerStats[] | null {
  try {
    const jsonPath = path.join(process.cwd(), "data/real_nba_stats_2025_26.json");
    if (!fs.existsSync(jsonPath)) {
      console.warn("[Full Roster Sync] JSON stats file not found at:", jsonPath);
      return null;
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    if (!jsonData.success || !jsonData.players || jsonData.players.length === 0) {
      console.warn("[Full Roster Sync] Invalid or empty JSON stats file");
      return null;
    }
    
    console.log(`[Full Roster Sync] Loaded ${jsonData.players.length} players from JSON file`);
    return jsonData.players;
  } catch (error) {
    console.error("[Full Roster Sync] Error loading JSON stats:", error);
    return null;
  }
}

/**
 * Sync all NBA players with REAL stats from JSON file as PRIMARY source
 * This ensures ALL players with stats get synced, not just those on ESPN rosters
 */
export async function syncFullRosters(): Promise<{
  playersCount: number;
  teamsCount: number;
  lastUpdate: Date;
}> {
  try {
    console.log("[Full Roster Sync] Starting complete roster sync with REAL stats...");

    // Step 1: Load real stats from JSON file (PRIMARY source - all players with stats)
    const realStats = loadRealStatsFromJSON();
    
    if (!realStats || realStats.length === 0) {
      throw new Error("No player stats found in JSON file - cannot sync");
    }
    
    console.log(`[Full Roster Sync] Loaded ${realStats.length} players with REAL stats from JSON`);

    // Step 2: Fetch all teams from ESPN for team data
    console.log("[Full Roster Sync] Fetching all teams...");
    const teamsResp = await axios.get(`${ESPN_API_BASE}/teams`, { timeout: 15000 });
    const teams = teamsResp.data?.sports?.[0]?.leagues?.[0]?.teams || [];
    console.log(`[Full Roster Sync] Fetched ${teams.length} teams`);

    if (teams.length === 0) {
      throw new Error("No teams fetched from ESPN");
    }

    // Step 3: Sync teams to database
    const teamsToInsert: InsertTeam[] = teams.map((item: any) => ({
      abbr: item.team.abbreviation.toLowerCase(),
      name: item.team.displayName,
      slug: item.team.slug,
    }));

    for (const team of teamsToInsert) {
      await upsertTeam(team);
    }
    console.log(`[Full Roster Sync] Synced ${teamsToInsert.length} teams to database`);

    // Step 4: Build ESPN player lookup for external IDs
    const espnPlayerMap = new Map<string, { id: string; firstName: string; lastName: string }>();
    
    for (let i = 0; i < teams.length; i++) {
      const teamId = teams[i].team.id;
      const teamName = teams[i].team.displayName;

      try {
        const rosterResp = await axios.get(`${ESPN_API_BASE}/teams/${teamId}/roster`, {
          timeout: 15000,
        });

        const athletes = rosterResp.data?.athletes || [];
        for (const athlete of athletes) {
          const normalizedName = normalizeName(athlete.displayName);
          espnPlayerMap.set(normalizedName, {
            id: athlete.id,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
          });
        }

        // Rate limiting
        if (i < teams.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`[Full Roster Sync] Error fetching roster for ${teamName}:`, error);
      }
    }
    
    console.log(`[Full Roster Sync] Built ESPN lookup with ${espnPlayerMap.size} players`);

    // Step 5: Create player records from JSON stats (PRIMARY source)
    const playersToInsert: InsertPlayer[] = [];
    let matchedWithEspn = 0;

    for (const player of realStats) {
      const normalizedName = normalizeName(player.fullName);
      const espnData = espnPlayerMap.get(normalizedName);
      
      // Parse first/last name from fullName if ESPN data not available
      const nameParts = player.fullName.split(' ');
      const firstName = espnData?.firstName || nameParts[0] || '';
      const lastName = espnData?.lastName || nameParts.slice(1).join(' ') || '';
      
      if (espnData) {
        matchedWithEspn++;
      }

      playersToInsert.push({
        externalId: espnData ? parseInt(espnData.id) : Math.floor(Math.random() * 900000) + 100000,
        firstName,
        lastName,
        fullName: player.fullName,
        teamId: TEAM_ABBR_TO_ID[player.team] || 0,
        position: player.position,
        ppg: player.ppg.toString(),
        fgm: player.fgm.toString(),
        fga: player.fga.toString(),
        fgPct: player.fgPct.toString(),
        ftm: player.ftm.toString(),
        fta: player.fta.toString(),
        ftPct: player.ftPct.toString(),
        tpm: player.tpm.toString(),
        tpa: player.tpa.toString(),
        tpPct: player.tpPct.toString(),
        rpg: player.rpg.toString(),
        orpg: player.orpg.toString(),
        drpg: player.drpg.toString(),
        apg: player.apg.toString(),
        topg: player.topg.toString(),
        spg: player.spg.toString(),
        bpg: player.bpg.toString(),
        pfpg: player.pfpg.toString(),
        ts: player.ts.toString(),
        efg: player.efg.toString(),
        gamesPlayed: player.gamesPlayed,
        minutesPerGame: player.mpg.toString(),
      });
    }

    console.log(`[Full Roster Sync] Created ${playersToInsert.length} player records (${matchedWithEspn} matched with ESPN IDs)`);
    console.log(`[Full Roster Sync] ALL ${playersToInsert.length} players have COMPLETE stats from NBA API`);

    // Step 6: Bulk insert all players
    await bulkUpsertPlayers(playersToInsert);

    const lastUpdate = new Date();
    console.log(`[Full Roster Sync] Sync complete! ${playersToInsert.length} players with FULL stats inserted`);

    return {
      playersCount: playersToInsert.length,
      teamsCount: teamsToInsert.length,
      lastUpdate,
    };
  } catch (error) {
    console.error("[Full Roster Sync] Error during sync:", error);
    throw error;
  }
}

/**
 * Refresh the JSON stats file by running the Python scraper
 */
export async function refreshStatsJSON(): Promise<boolean> {
  try {
    const { execSync } = await import("child_process");
    const scriptPath = path.join(process.cwd(), "scripts/fetch_real_nba_stats.py");
    const outputPath = path.join(process.cwd(), "data/real_nba_stats_2025_26.json");
    
    console.log("[Full Roster Sync] Running Python scraper to refresh stats...");
    const result = execSync(`python3 ${scriptPath}`, {
      encoding: "utf-8",
      timeout: 120000, // 2 minute timeout
    });
    
    // Write result to JSON file
    fs.writeFileSync(outputPath, result, "utf-8");
    console.log("[Full Roster Sync] Stats JSON file refreshed successfully");
    return true;
  } catch (error) {
    console.error("[Full Roster Sync] Error refreshing stats JSON:", error);
    return false;
  }
}
