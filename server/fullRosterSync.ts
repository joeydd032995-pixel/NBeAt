import axios from "axios";
import { bulkUpsertPlayers, upsertTeam } from "./db";
import { InsertPlayer, InsertTeam } from "../drizzle/schema";
import * as fs from "fs";
import * as path from "path";

const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

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
 * Sync all 30 NBA team rosters with REAL stats from JSON file or NBA API
 */
export async function syncFullRosters(): Promise<{
  playersCount: number;
  teamsCount: number;
  lastUpdate: Date;
}> {
  try {
    console.log("[Full Roster Sync] Starting complete roster sync with REAL stats...");

    // Step 1: Load real stats from JSON file (primary source)
    const realStats = loadRealStatsFromJSON();
    const statsMap = new Map<string, RealPlayerStats>();
    
    if (realStats) {
      realStats.forEach(player => {
        statsMap.set(player.fullName.toLowerCase(), player);
      });
      console.log(`[Full Roster Sync] Created stats lookup map with ${statsMap.size} players`);
    }

    // Step 2: Fetch all teams from ESPN
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

    // Step 4: Fetch rosters and match with real stats
    const playersToInsert: InsertPlayer[] = [];
    let totalFetched = 0;
    let matchedWithRealStats = 0;

    for (let i = 0; i < teams.length; i++) {
      const teamId = teams[i].team.id;
      const teamName = teams[i].team.displayName;
      const teamAbbr = teams[i].team.abbreviation;

      try {
        console.log(`[Full Roster Sync] Fetching roster ${i + 1}/${teams.length}: ${teamName}...`);
        
        const rosterResp = await axios.get(`${ESPN_API_BASE}/teams/${teamId}/roster`, {
          timeout: 15000,
        });

        const athletes = rosterResp.data?.athletes || [];
        console.log(`[Full Roster Sync] Got ${athletes.length} players from ${teamName}`);

        // Convert athletes to player records with REAL stats
        for (const athlete of athletes) {
          const playerName = athlete.displayName;
          const position = athlete.position?.abbreviation || "G";
          
          // Look up real stats from JSON
          const realPlayerStats = statsMap.get(playerName.toLowerCase());
          
          if (realPlayerStats) {
            // Use REAL stats from JSON file
            matchedWithRealStats++;
            playersToInsert.push({
              externalId: parseInt(athlete.id),
              firstName: athlete.firstName,
              lastName: athlete.lastName,
              fullName: playerName,
              teamId: TEAM_ABBR_TO_ID[realPlayerStats.team] || TEAM_ABBR_TO_ID[teamAbbr] || 0,
              position: realPlayerStats.position || position,
              ppg: realPlayerStats.ppg.toString(),
              fgm: realPlayerStats.fgm.toString(),
              fga: realPlayerStats.fga.toString(),
              fgPct: realPlayerStats.fgPct.toString(),
              ftm: realPlayerStats.ftm.toString(),
              fta: realPlayerStats.fta.toString(),
              ftPct: realPlayerStats.ftPct.toString(),
              tpm: realPlayerStats.tpm.toString(),
              tpa: realPlayerStats.tpa.toString(),
              tpPct: realPlayerStats.tpPct.toString(),
              rpg: realPlayerStats.rpg.toString(),
              orpg: realPlayerStats.orpg.toString(),
              drpg: realPlayerStats.drpg.toString(),
              apg: realPlayerStats.apg.toString(),
              topg: realPlayerStats.topg.toString(),
              spg: realPlayerStats.spg.toString(),
              bpg: realPlayerStats.bpg.toString(),
              pfpg: realPlayerStats.pfpg.toString(),
              ts: realPlayerStats.ts.toString(),
              efg: realPlayerStats.efg.toString(),
              gamesPlayed: realPlayerStats.gamesPlayed,
              minutesPerGame: "0", // Not available in current data
            });
          } else {
            // Player not in JSON - insert with zero stats (will be updated on next scrape)
            playersToInsert.push({
              externalId: parseInt(athlete.id),
              firstName: athlete.firstName,
              lastName: athlete.lastName,
              fullName: playerName,
              teamId: TEAM_ABBR_TO_ID[teamAbbr] || 0,
              position: position,
              ppg: "0",
              fgm: "0",
              fga: "0",
              fgPct: "0",
              ftm: "0",
              fta: "0",
              ftPct: "0",
              tpm: "0",
              tpa: "0",
              tpPct: "0",
              rpg: "0",
              orpg: "0",
              drpg: "0",
              apg: "0",
              topg: "0",
              spg: "0",
              bpg: "0",
              pfpg: "0",
              ts: "0",
              efg: "0",
              gamesPlayed: 0,
              minutesPerGame: "0",
            });
          }
        }

        totalFetched += athletes.length;

        // Rate limiting
        if (i < teams.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`[Full Roster Sync] Error fetching roster for ${teamName}:`, error);
      }
    }

    console.log(`[Full Roster Sync] Total players fetched: ${totalFetched}`);
    console.log(`[Full Roster Sync] Players matched with real stats: ${matchedWithRealStats}`);
    console.log(`[Full Roster Sync] Inserting ${playersToInsert.length} players into database...`);

    // Step 5: Bulk insert all players
    await bulkUpsertPlayers(playersToInsert);

    const lastUpdate = new Date();
    console.log(`[Full Roster Sync] Sync complete! ${playersToInsert.length} players inserted (${matchedWithRealStats} with real stats)`);

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
