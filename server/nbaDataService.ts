import axios from "axios";
import { bulkUpsertPlayers, upsertTeam } from "./db";
import { InsertPlayer, InsertTeam } from "../drizzle/schema";

const BDL_BASE = "https://api.balldontlie.io/v1";
const BDL_API_KEY = process.env.BDL_API_KEY || "";

if (!BDL_API_KEY) {
  console.warn("[NBA Data Service] Warning: BDL_API_KEY not set. API calls may fail.");
}

// Team metadata for CBS Sports scraping
const TEAM_META: Record<string, string> = {
  lal: "los-angeles-lakers",
  bos: "boston-celtics",
  gsw: "golden-state-warriors",
  den: "denver-nuggets",
  hou: "houston-rockets",
  okc: "oklahoma-city-thunder",
  mia: "miami-heat",
  nyk: "new-york-knicks",
  dal: "dallas-mavericks",
  phx: "phoenix-suns",
  mil: "milwaukee-bucks",
  lac: "la-clippers",
  sas: "san-antonio-spurs",
  min: "minnesota-timberwolves",
  phi: "philadelphia-76ers",
  orl: "orlando-magic",
  tor: "toronto-raptors",
  det: "detroit-pistons",
  ind: "indiana-pacers",
  cle: "cleveland-cavaliers",
  mem: "memphis-grizzlies",
  sac: "sacramento-kings",
  nop: "new-orleans-pelicans",
  atl: "atlanta-hawks",
  chi: "chicago-bulls",
  cha: "charlotte-hornets",
  por: "portland-trail-blazers",
  uta: "utah-jazz",
  brk: "brooklyn-nets",
  was: "washington-wizards",
};

interface BallDontLiePlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  team: {
    id: number;
    abbreviation: string;
    city: string;
    conference: string;
    division: string;
    full_name: string;
    name: string;
  };
}

interface BallDontLieStats {
  player_id: number;
  season: number;
  pts: number;
  reb: number;
  ast: number;
  fg_pct: number;
  games_played: number;
}

/**
 * Fetch all NBA players from balldontlie API
 */
export async function fetchAllPlayersFromAPI(): Promise<BallDontLiePlayer[]> {
  const allPlayers: BallDontLiePlayer[] = [];
  let cursor = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const resp = await axios.get(`${BDL_BASE}/players`, {
        params: { cursor, per_page: 100 },
        headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      });

      const data = resp.data;
      const players = data.data || [];

      if (players.length > 0) {
        allPlayers.push(...players);
      }

      // Check if there's more data
      const meta = data.meta;
      if (meta && meta.next_cursor) {
        cursor = meta.next_cursor;
      } else {
        hasMore = false;
      }

      // Rate limit: 60 req/min
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error fetching players:", error);
      hasMore = false;
    }
  }

  return allPlayers;
}

/**
 * Fetch season stats for players
 */
export async function fetchSeasonStats(season: number = 2024): Promise<BallDontLieStats[]> {
  const allStats: BallDontLieStats[] = [];
  let cursor = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const resp = await axios.get(`${BDL_BASE}/season_averages`, {
        params: { season, cursor, per_page: 100 },
        headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      });

      const data = resp.data;
      const stats = data.data || [];

      if (stats.length > 0) {
        allStats.push(...stats);
      }

      // Check if there's more data
      const meta = data.meta;
      if (meta && meta.next_cursor) {
        cursor = meta.next_cursor;
      } else {
        hasMore = false;
      }

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error fetching season stats:", error);
      hasMore = false;
    }
  }

  return allStats;
}

/**
 * Sync NBA data to database
 */
export async function syncNBAData() {
  console.log("Starting NBA data sync...");

  // Fetch players
  const playersData = await fetchAllPlayersFromAPI();
  console.log(`Fetched ${playersData.length} players`);

  // Fetch stats
  const statsData = await fetchSeasonStats(2024);
  console.log(`Fetched ${statsData.length} player stats`);

  // Create a map of stats by player_id
  const statsMap = new Map<number, BallDontLieStats>();
  statsData.forEach((stat) => {
    statsMap.set(stat.player_id, stat);
  });

  // Prepare players for insertion
  const playersToInsert: InsertPlayer[] = playersData.map((player) => {
    const stats = statsMap.get(player.id);

    return {
      externalId: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      fullName: `${player.first_name} ${player.last_name}`,
      teamId: player.team?.id,
      position: player.position || "",
      ppg: stats?.pts ? stats.pts.toFixed(1) : "0.0",
      rpg: stats?.reb ? stats.reb.toFixed(1) : "0.0",
      apg: stats?.ast ? stats.ast.toFixed(1) : "0.0",
      fgPct: stats?.fg_pct ? (stats.fg_pct * 100).toFixed(1) : "0.0",
      gamesPlayed: stats?.games_played || 0,
    };
  });

  // Insert players
  await bulkUpsertPlayers(playersToInsert);
  console.log(`Synced ${playersToInsert.length} players to database`);

  // Sync teams
  const uniqueTeams = new Map<string, InsertTeam>();
  playersData.forEach((player) => {
    if (player.team && !uniqueTeams.has(player.team.abbreviation)) {
      const abbr = player.team.abbreviation.toLowerCase();
      uniqueTeams.set(player.team.abbreviation, {
        abbr: player.team.abbreviation,
        name: player.team.full_name,
        slug: TEAM_META[abbr] || abbr,
      });
    }
  });

  for (const team of Array.from(uniqueTeams.values())) {
    await upsertTeam(team);
  }

  console.log(`Synced ${uniqueTeams.size} teams to database`);
  return {
    playersCount: playersToInsert.length,
    teamsCount: uniqueTeams.size,
  };
}

/**
 * Get player stats by name
 */
export function getPlayerStats(
  playerName: string,
  allPlayers: BallDontLiePlayer[],
  statsMap: Map<number, BallDontLieStats>
) {
  const player = allPlayers.find(
    (p) => `${p.first_name} ${p.last_name}`.toLowerCase() === playerName.toLowerCase()
  );

  if (!player) {
    return { PPG: null, RPG: null, APG: null, "FG%": null };
  }

  const stats = statsMap.get(player.id);
  if (!stats) {
    return { PPG: null, RPG: null, APG: null, "FG%": null };
  }

  return {
    PPG: stats.pts.toFixed(1),
    RPG: stats.reb.toFixed(1),
    APG: stats.ast.toFixed(1),
    "FG%": (stats.fg_pct * 100).toFixed(1),
  };
}

/**
 * Verify roster - check if player is on expected team
 */
export function verifyRoster(
  playerName: string,
  expectedTeam: string,
  allPlayers: BallDontLiePlayer[]
) {
  const player = allPlayers.find(
    (p) => `${p.first_name} ${p.last_name}`.toLowerCase() === playerName.toLowerCase()
  );

  if (!player) {
    return { valid: false, error: "Player not found" };
  }

  const actualTeam = player.team?.abbreviation || "";
  return {
    valid: actualTeam.toUpperCase() === expectedTeam.toUpperCase(),
    actualTeam: actualTeam.toUpperCase(),
    expectedTeam: expectedTeam.toUpperCase(),
  };
}
