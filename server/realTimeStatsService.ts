import { execSync } from "child_process";
import { bulkUpsertPlayers, upsertTeam } from "./db";
import { InsertPlayer, InsertTeam } from "../drizzle/schema";

interface PlayerStatsRaw {
  player_id: number;
  pts: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  three_pm: number;
  three_pa: number;
  three_p_pct: number;
  reb: number;
  oreb: number;
  dreb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
  min: number;
  gp: number;
  gs: number;
}

interface PlayerRaw {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  team_id: number;
  team_abbreviation: string;
}

interface TeamStatsRaw {
  team_id: number;
  team_name: string;
  pts: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  three_pm: number;
  three_pa: number;
  three_p_pct: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
  gp: number;
  w: number;
  l: number;
}

let lastUpdateTime: Date | null = null;
let isUpdating = false;

/**
 * Fetch player data from nba_api (with timeout protection)
 */
function fetchPlayersWithTimeout(timeoutMs: number = 30000): PlayerRaw[] {
  try {
    const output = execSync(
      "python3 /home/ubuntu/nba-betting-platform-v2/server/nbaApiService.py players",
      {
        encoding: "utf-8",
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    return JSON.parse(output);
  } catch (error) {
    console.error("[Real-Time Stats] Error fetching players:", error);
    return [];
  }
}

/**
 * Fetch player stats from nba_api (with timeout protection)
 */
function fetchPlayerStatsWithTimeout(
  timeoutMs: number = 60000
): Record<number, PlayerStatsRaw> {
  try {
    const output = execSync(
      "python3 /home/ubuntu/nba-betting-platform-v2/server/nbaApiService.py player-stats",
      {
        encoding: "utf-8",
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    return JSON.parse(output);
  } catch (error) {
    console.error("[Real-Time Stats] Error fetching player stats:", error);
    return {};
  }
}

/**
 * Fetch team stats from nba_api (with timeout protection)
 */
function fetchTeamStatsWithTimeout(
  timeoutMs: number = 60000
): Record<number, TeamStatsRaw> {
  try {
    const output = execSync(
      "python3 /home/ubuntu/nba-betting-platform-v2/server/nbaApiService.py team-stats",
      {
        encoding: "utf-8",
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    return JSON.parse(output);
  } catch (error) {
    console.error("[Real-Time Stats] Error fetching team stats:", error);
    return {};
  }
}

/**
 * Sync real-time 2025-2026 season data
 */
export async function syncRealTimeStats(): Promise<{
  playersCount: number;
  teamsCount: number;
  lastUpdate: Date;
}> {
  if (isUpdating) {
    console.log("[Real-Time Stats] Update already in progress, skipping...");
    return {
      playersCount: 0,
      teamsCount: 0,
      lastUpdate: lastUpdateTime || new Date(),
    };
  }

  isUpdating = true;
  try {
    console.log("[Real-Time Stats] Starting real-time data sync...");

    // Fetch players
    console.log("[Real-Time Stats] Fetching players...");
    const players = fetchPlayersWithTimeout(30000);

    if (players.length === 0) {
      console.error("[Real-Time Stats] No players fetched");
      return { playersCount: 0, teamsCount: 0, lastUpdate: new Date() };
    }

    console.log(`[Real-Time Stats] Fetched ${players.length} players`);

    // Fetch player stats
    console.log("[Real-Time Stats] Fetching player stats...");
    const playerStats = fetchPlayerStatsWithTimeout(60000);
    console.log(`[Real-Time Stats] Fetched stats for ${Object.keys(playerStats).length} players`);

    // Fetch team stats
    console.log("[Real-Time Stats] Fetching team stats...");
    const teamStats = fetchTeamStatsWithTimeout(60000);
    console.log(`[Real-Time Stats] Fetched stats for ${Object.keys(teamStats).length} teams`);

    // Prepare players for insertion
    const playersToInsert: InsertPlayer[] = players.map((player) => {
      const stats = playerStats[player.id];
      const gp = stats?.gp || 1;

      return {
        externalId: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        fullName: player.full_name,
        teamId: player.team_id,
        position: "",
        ppg: stats?.pts ? stats.pts.toFixed(1) : "0.0",
        fgm: stats?.fgm ? stats.fgm.toFixed(1) : "0.0",
        fga: stats?.fga ? stats.fga.toFixed(1) : "0.0",
        fgPct: stats?.fg_pct ? stats.fg_pct.toFixed(1) : "0.0",
        ftm: stats?.ftm ? stats.ftm.toFixed(1) : "0.0",
        fta: stats?.fta ? stats.fta.toFixed(1) : "0.0",
        ftPct: stats?.ft_pct ? stats.ft_pct.toFixed(1) : "0.0",
        tpm: stats?.three_pm ? stats.three_pm.toFixed(1) : "0.0",
        tpa: stats?.three_pa ? stats.three_pa.toFixed(1) : "0.0",
        tpPct: stats?.three_p_pct ? stats.three_p_pct.toFixed(1) : "0.0",
        rpg: stats?.reb ? stats.reb.toFixed(1) : "0.0",
        orpg: stats?.oreb ? (stats.oreb / gp).toFixed(1) : "0.0",
        drpg: stats?.dreb ? (stats.dreb / gp).toFixed(1) : "0.0",
        apg: stats?.ast ? stats.ast.toFixed(1) : "0.0",
        topg: stats?.tov ? (stats.tov / gp).toFixed(1) : "0.0",
        spg: stats?.stl ? (stats.stl / gp).toFixed(1) : "0.0",
        bpg: stats?.blk ? (stats.blk / gp).toFixed(1) : "0.0",
        pfpg: stats?.pf ? (stats.pf / gp).toFixed(1) : "0.0",
        ts: stats?.pts && stats?.fga ? ((stats.pts / (2 * (stats.fga + 0.44 * stats.fta))) * 100).toFixed(1) : "0.0",
        efg: stats?.fgm && stats?.fga && stats?.three_pm ? (((stats.fgm + 0.5 * stats.three_pm) / stats.fga) * 100).toFixed(1) : "0.0",
        gamesPlayed: stats?.gp || 0,
        minutesPerGame: stats?.min ? (stats.min / gp).toFixed(1) : "0.0",
      };
    });

    // Insert players
    await bulkUpsertPlayers(playersToInsert);
    console.log(`[Real-Time Stats] Synced ${playersToInsert.length} players`);

    // Sync teams
    const uniqueTeams = new Map<string, InsertTeam>();
    players.forEach((player) => {
      if (!uniqueTeams.has(player.team_abbreviation)) {
        const tStats = Object.values(teamStats).find(
          (t) => t.team_name.toLowerCase().includes(player.team_abbreviation.toUpperCase())
        );

        uniqueTeams.set(player.team_abbreviation, {
          abbr: player.team_abbreviation,
          name: tStats?.team_name || `Team ${player.team_abbreviation}`,
          slug: (tStats?.team_name || "").toLowerCase().replace(/\s+/g, "-"),
        });
      }
    });

    const teamArray = Array.from(uniqueTeams.values());
    for (const team of teamArray) {
      await upsertTeam(team);
    }

    console.log(`[Real-Time Stats] Synced ${teamArray.length} teams`);

    lastUpdateTime = new Date();

    return {
      playersCount: playersToInsert.length,
      teamsCount: teamArray.length,
      lastUpdate: lastUpdateTime,
    };
  } catch (error) {
    console.error("[Real-Time Stats] Error during sync:", error);
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
