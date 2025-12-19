import axios from "axios";
import { bulkUpsertPlayers, upsertTeam } from "./db";
import { InsertPlayer, InsertTeam } from "../drizzle/schema";

const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const JUHEAPI_BASE = "https://api.juheapi.com/nba";

interface ESPNTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logos?: Array<{ href: string }>;
}

interface ESPNAthlete {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  position?: { abbreviation: string; displayName: string };
  team?: { id: string; name: string };
}

interface JuheAPIPlayer {
  playerId: string;
  playerName: string;
  teamAbbr: string;
  position: string;
  ppg: number;
  rpg: number;
  apg: number;
  fgp: number;
  ftp: number;
  tpp: number;
  gp: number;
  min: number;
  fgm: number;
  fga: number;
  ftm: number;
  fta: number;
  tpm: number;
  tpa: number;
  reb: number;
  oreb: number;
  dreb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
}

let lastUpdateTime: Date | null = null;
let isUpdating = false;

/**
 * Fetch teams from ESPN API
 */
async function fetchESPNTeams(): Promise<ESPNTeam[]> {
  try {
    console.log("[Live Stats] Fetching ESPN teams...");
    const response = await axios.get(`${ESPN_API_BASE}/teams`, {
      timeout: 10000,
    });

    return response.data?.teams || [];
  } catch (error) {
    console.error("[Live Stats] Error fetching ESPN teams:", error);
    return [];
  }
}

/**
 * Fetch players from ESPN API
 */
async function fetchESPNPlayers(): Promise<ESPNAthlete[]> {
  try {
    console.log("[Live Stats] Fetching ESPN players...");
    const response = await axios.get(`${ESPN_API_BASE}/athletes`, {
      timeout: 15000,
    });

    return response.data?.athletes || [];
  } catch (error) {
    console.error("[Live Stats] Error fetching ESPN players:", error);
    return [];
  }
}

/**
 * Fetch player stats from juheapi
 */
async function fetchJuheAPIStats(): Promise<JuheAPIPlayer[]> {
  try {
    console.log("[Live Stats] Fetching juheapi player stats...");
    const response = await axios.get(`${JUHEAPI_BASE}/playerStats`, {
      timeout: 15000,
      params: {
        season: 2025,
      },
    });

    return response.data?.data || [];
  } catch (error) {
    console.error("[Live Stats] Error fetching juheapi stats:", error);
    return [];
  }
}

/**
 * Sync real-time 2025-2026 season data from ESPN and juheapi
 */
export async function syncLiveStats(): Promise<{
  playersCount: number;
  teamsCount: number;
  lastUpdate: Date;
}> {
  if (isUpdating) {
    console.log("[Live Stats] Update already in progress, skipping...");
    return {
      playersCount: 0,
      teamsCount: 0,
      lastUpdate: lastUpdateTime || new Date(),
    };
  }

  isUpdating = true;
  try {
    console.log("[Live Stats] Starting live stats sync...");

    // Fetch data from both APIs in parallel
    const [espnTeams, espnPlayers, juheStats] = await Promise.all([
      fetchESPNTeams(),
      fetchESPNPlayers(),
      fetchJuheAPIStats(),
    ]);

    console.log(`[Live Stats] Fetched ${espnTeams.length} teams from ESPN`);
    console.log(`[Live Stats] Fetched ${espnPlayers.length} players from ESPN`);
    console.log(`[Live Stats] Fetched ${juheStats.length} player stats from juheapi`);

    // Create a map of juheapi stats by player name for easy lookup
    const statsMap = new Map<string, JuheAPIPlayer>();
    juheStats.forEach((stat) => {
      const key = stat.playerName.toLowerCase().replace(/\s+/g, " ");
      statsMap.set(key, stat);
    });

    // Sync teams
    const teamsToInsert: InsertTeam[] = espnTeams.map((team) => ({
      abbr: team.abbreviation.toLowerCase(),
      name: team.displayName,
      slug: team.name.toLowerCase().replace(/\s+/g, "-"),
    }));

    for (const team of teamsToInsert) {
      await upsertTeam(team);
    }

    console.log(`[Live Stats] Synced ${teamsToInsert.length} teams`);

    // Sync players with stats
    const playersToInsert: InsertPlayer[] = espnPlayers
      .filter((player) => player.team) // Only include players with teams
      .map((player) => {
        const playerKey = `${player.firstName} ${player.lastName}`
          .toLowerCase()
          .replace(/\s+/g, " ");
        const stats = statsMap.get(playerKey);
        const gp = stats?.gp || 1;

        return {
          externalId: parseInt(player.id),
          firstName: player.firstName,
          lastName: player.lastName,
          fullName: player.displayName,
          teamId: parseInt(player.team?.id || "0"),
          position: player.position?.abbreviation || "",
          ppg: stats?.ppg ? stats.ppg.toFixed(1) : "0.0",
          fgm: stats?.fgm ? stats.fgm.toFixed(1) : "0.0",
          fga: stats?.fga ? stats.fga.toFixed(1) : "0.0",
          fgPct: stats?.fgp ? stats.fgp.toFixed(1) : "0.0",
          ftm: stats?.ftm ? stats.ftm.toFixed(1) : "0.0",
          fta: stats?.fta ? stats.fta.toFixed(1) : "0.0",
          ftPct: stats?.ftp ? stats.ftp.toFixed(1) : "0.0",
          tpm: stats?.tpm ? stats.tpm.toFixed(1) : "0.0",
          tpa: stats?.tpa ? stats.tpa.toFixed(1) : "0.0",
          tpPct: stats?.tpp ? stats.tpp.toFixed(1) : "0.0",
          rpg: stats?.rpg ? stats.rpg.toFixed(1) : "0.0",
          orpg: stats?.oreb ? (stats.oreb / gp).toFixed(1) : "0.0",
          drpg: stats?.dreb ? (stats.dreb / gp).toFixed(1) : "0.0",
          apg: stats?.apg ? stats.apg.toFixed(1) : "0.0",
          topg: stats?.tov ? (stats.tov / gp).toFixed(1) : "0.0",
          spg: stats?.stl ? (stats.stl / gp).toFixed(1) : "0.0",
          bpg: stats?.blk ? (stats.blk / gp).toFixed(1) : "0.0",
          pfpg: stats?.pf ? (stats.pf / gp).toFixed(1) : "0.0",
          ts: stats?.ppg && stats?.fga ? ((stats.ppg / (2 * (stats.fga + 0.44 * stats.fta))) * 100).toFixed(1) : "0.0",
          efg: stats?.fgm && stats?.fga && stats?.tpm ? (((stats.fgm + 0.5 * stats.tpm) / stats.fga) * 100).toFixed(1) : "0.0",
          gamesPlayed: stats?.gp || 0,
          minutesPerGame: stats?.min ? (stats.min / gp).toFixed(1) : "0.0",
        };
      });

    await bulkUpsertPlayers(playersToInsert);
    console.log(`[Live Stats] Synced ${playersToInsert.length} players`);

    lastUpdateTime = new Date();

    return {
      playersCount: playersToInsert.length,
      teamsCount: teamsToInsert.length,
      lastUpdate: lastUpdateTime,
    };
  } catch (error) {
    console.error("[Live Stats] Error during sync:", error);
    throw error;
  } finally {
    isUpdating = false;
  }
}

/**
 * Get last update time
 */
export function getLastUpdateTime(): Date | null {
  return lastUpdateTime;
}

/**
 * Check if update is in progress
 */
export function isUpdateInProgress(): boolean {
  return isUpdating;
}
