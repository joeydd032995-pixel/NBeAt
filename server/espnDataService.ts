import { execSync } from "child_process";
import { bulkUpsertPlayers, upsertTeam } from "./db";
import { InsertPlayer, InsertTeam } from "../drizzle/schema";

interface ESPNPlayer {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  team_id: string;
  team_name: string;
  team_abbreviation: string;
}

interface PlayerStats {
  player_id: number;
  season: number;
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
}

/**
 * Fetch ESPN players using Python script
 */
export async function fetchESPNPlayers(): Promise<ESPNPlayer[]> {
  try {
    console.log("[ESPN Data Service] Fetching players from ESPN API...");
    const output = execSync("python3 /home/ubuntu/nba-betting-platform-v2/server/fetch_player_stats.py", {
      encoding: "utf-8",
      timeout: 120000,
      maxBuffer: 50 * 1024 * 1024,
    });

    const players = JSON.parse(output);
    console.log(`[ESPN Data Service] Fetched ${players.length} players from ESPN`);
    return players;
  } catch (error) {
    console.error("[ESPN Data Service] Error fetching ESPN players:", error);
    return [];
  }
}

/**
 * Fetch player stats using nba_api
 */
export async function fetchPlayerStats(playerId: number): Promise<PlayerStats | null> {
  try {
    const output = execSync(`python3 /home/ubuntu/nba-betting-platform-v2/server/fetch_player_stats.py ${playerId}`, {
      encoding: "utf-8",
      timeout: 30000,
    });

    const stats = JSON.parse(output);
    return stats;
  } catch (error) {
    console.error(`[ESPN Data Service] Error fetching stats for player ${playerId}:`, error);
    return null;
  }
}

/**
 * Sync all NBA data from ESPN and nba_api
 */
export async function syncESPNData(): Promise<{ playersCount: number; teamsCount: number }> {
  try {
    console.log("[ESPN Data Service] Starting ESPN data sync...");

    // Fetch players from ESPN
    const espnPlayers = await fetchESPNPlayers();
    if (espnPlayers.length === 0) {
      console.error("[ESPN Data Service] No players fetched from ESPN");
      return { playersCount: 0, teamsCount: 0 };
    }

    console.log(`[ESPN Data Service] Fetched ${espnPlayers.length} players, now fetching stats...`);

    // Fetch stats for each player
    const statsMap = new Map<number, PlayerStats>();
    let statsCount = 0;

    for (let i = 0; i < espnPlayers.length; i++) {
      const player = espnPlayers[i];
      if (i % 50 === 0) {
        console.log(`[ESPN Data Service] Fetching stats: ${i}/${espnPlayers.length}`);
      }

      const stats = await fetchPlayerStats(player.id);
      if (stats) {
        statsMap.set(player.id, stats);
        statsCount++;
      }

      // Rate limiting
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`[ESPN Data Service] Fetched stats for ${statsCount} players`);

    // Prepare players for insertion
    const playersToInsert: InsertPlayer[] = espnPlayers.map((player) => {
      const stats = statsMap.get(player.id);
      const gp = stats?.gp || 1;

      return {
        externalId: player.id,
        firstName: player.first_name,
        lastName: player.last_name,
        fullName: player.full_name,
        teamId: parseInt(player.team_id),
        position: player.position || "",
        // Scoring Stats
        ppg: stats?.pts ? stats.pts.toFixed(1) : "0.0",
        fgm: stats?.fgm ? stats.fgm.toFixed(1) : "0.0",
        fga: stats?.fga ? stats.fga.toFixed(1) : "0.0",
        fgPct: stats?.fg_pct ? (stats.fg_pct * 100).toFixed(1) : "0.0",
        ftm: stats?.ftm ? stats.ftm.toFixed(1) : "0.0",
        fta: stats?.fta ? stats.fta.toFixed(1) : "0.0",
        ftPct: stats?.ft_pct ? (stats.ft_pct * 100).toFixed(1) : "0.0",
        tpm: stats?.three_pm ? stats.three_pm.toFixed(1) : "0.0",
        tpa: stats?.three_pa ? stats.three_pa.toFixed(1) : "0.0",
        tpPct: stats?.three_p_pct ? (stats.three_p_pct * 100).toFixed(1) : "0.0",
        // Rebounding Stats
        rpg: stats?.reb ? stats.reb.toFixed(1) : "0.0",
        orpg: stats?.oreb ? (stats.oreb / gp).toFixed(1) : "0.0",
        drpg: stats?.dreb ? (stats.dreb / gp).toFixed(1) : "0.0",
        // Assist & Ball Handling
        apg: stats?.ast ? stats.ast.toFixed(1) : "0.0",
        topg: stats?.tov ? (stats.tov / gp).toFixed(1) : "0.0",
        // Defense & Discipline
        spg: stats?.stl ? (stats.stl / gp).toFixed(1) : "0.0",
        bpg: stats?.blk ? (stats.blk / gp).toFixed(1) : "0.0",
        pfpg: stats?.pf ? (stats.pf / gp).toFixed(1) : "0.0",
        // Efficiency
        ts: stats?.pts && stats?.fga ? ((stats.pts / (2 * (stats.fga + 0.44 * stats.fta))) * 100).toFixed(1) : "0.0",
        efg: stats?.fgm && stats?.fga && stats?.three_pm ? (((stats.fgm + 0.5 * stats.three_pm) / stats.fga) * 100).toFixed(1) : "0.0",
        // Game Info
        gamesPlayed: stats?.gp || 0,
        minutesPerGame: stats?.min ? (stats.min / gp).toFixed(1) : "0.0",
      };
    });

    // Insert players
    await bulkUpsertPlayers(playersToInsert);
    console.log(`[ESPN Data Service] Synced ${playersToInsert.length} players to database`);

    // Sync teams
    const uniqueTeams = new Map<string, InsertTeam>();
    espnPlayers.forEach((player) => {
      if (!uniqueTeams.has(player.team_abbreviation)) {
        uniqueTeams.set(player.team_abbreviation, {
          abbr: player.team_abbreviation,
          name: player.team_name,
          slug: player.team_name.toLowerCase().replace(/\s+/g, "-"),
        });
      }
    });

    const teamArray = Array.from(uniqueTeams.values());
    for (const team of teamArray) {
      await upsertTeam(team);
    }

    console.log(`[ESPN Data Service] Synced ${uniqueTeams.size} teams to database`);

    return {
      playersCount: playersToInsert.length,
      teamsCount: uniqueTeams.size,
    };
  } catch (error) {
    console.error("[ESPN Data Service] Error during sync:", error);
    throw error;
  }
}
