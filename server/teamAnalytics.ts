import { getDb } from "./db";
import { players, teams } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export interface TeamStats {
  teamId: number;
  teamName: string;
  teamAbbreviation: string;
  gamesPlayed: number;
  offensiveRating: number; // Points per 100 possessions
  defensiveRating: number; // Points allowed per 100 possessions
  pace: number; // Possessions per game
  avgPPG: number;
  avgRPG: number;
  avgAPG: number;
  avgFGPct: number;
  avgTPPct: number;
  avgFTPct: number;
  trend: "hot" | "cold" | "steady";
}

/**
 * Calculate team analytics by aggregating player stats
 */
export async function getTeamAnalytics(teamId?: number): Promise<TeamStats[]> {
  const db = await getDb();
  if (!db) return [];
  
  const whereClause = teamId ? eq(players.teamId, teamId) : undefined;
  
  const teamPlayers = await db
    .select()
    .from(players)
    .where(whereClause);
  
  // Get all teams for name lookup
  const allTeams = await db.select().from(teams);
  const teamNameMap = new Map(allTeams.map(t => [t.id, { name: t.name, abbr: t.abbr }]));

  // Group players by team
  const teamMap = new Map<number, typeof teamPlayers>();
  for (const player of teamPlayers) {
    if (!player.teamId) continue;
    if (!teamMap.has(player.teamId)) {
      teamMap.set(player.teamId, []);
    }
    teamMap.get(player.teamId)!.push(player);
  }

  const teamStats: TeamStats[] = [];

  for (const [tId, roster] of Array.from(teamMap.entries())) {
    if (roster.length === 0) continue;

    // Get team info from teams table
    const teamInfo = teamNameMap.get(tId);
    const teamName = teamInfo?.name || "Unknown";
    const teamAbbr = teamInfo?.abbr || "UNK";

    // Calculate averages
    type Player = typeof roster[0];
    // Team games played = max games played by any player on roster (team plays same # of games)
    const teamGamesPlayed = Math.max(...roster.map((p: Player) => Number(p.gamesPlayed) || 0));
    const avgPPG = roster.reduce((sum: number, p: Player) => sum + (Number(p.ppg) || 0), 0) / roster.length;
    const avgRPG = roster.reduce((sum: number, p: Player) => sum + (Number(p.rpg) || 0), 0) / roster.length;
    const avgAPG = roster.reduce((sum: number, p: Player) => sum + (Number(p.apg) || 0), 0) / roster.length;
    const avgFGPct = roster.reduce((sum: number, p: Player) => sum + (Number(p.fgPct) || 0), 0) / roster.length;
    const avgTPPct = roster.reduce((sum: number, p: Player) => sum + (Number(p.tpPct) || 0), 0) / roster.length;
    const avgFTPct = roster.reduce((sum: number, p: Player) => sum + (Number(p.ftPct) || 0), 0) / roster.length;

    // Estimate team PPG (sum of top 10 scorers to avoid double counting)
    const topScorers = roster
      .sort((a: typeof roster[0], b: typeof roster[0]) => (Number(b.ppg) || 0) - (Number(a.ppg) || 0))
      .slice(0, 10);
    const teamPPG = topScorers.reduce((sum: number, p: typeof roster[0]) => sum + (Number(p.ppg) || 0), 0);

    // Calculate pace (estimate based on team tempo)
    // NBA average pace is ~100 possessions per game
    // Higher scoring teams tend to have higher pace
    const pace = 95 + (Number(teamPPG) - 110) * 0.3;

    // Calculate offensive rating (points per 100 possessions)
    const offensiveRating = (teamPPG / pace) * 100;

    // Estimate defensive rating (inverse of offensive efficiency)
    // Better defensive teams allow fewer points
    // NBA average is ~112 points per 100 possessions
    const defensiveRating = 112 - (avgFGPct - 45) * 0.5;

    // Determine trend based on recent performance
    // This is a simplified version - in production you'd track game-by-game stats
    const netRating = offensiveRating - defensiveRating;
    let trend: "hot" | "cold" | "steady" = "steady";
    if (netRating > 5) trend = "hot";
    else if (netRating < -5) trend = "cold";

    teamStats.push({
      teamId: tId,
      teamName,
      teamAbbreviation: teamAbbr,
      gamesPlayed: teamGamesPlayed,
      offensiveRating: Math.round(offensiveRating * 10) / 10,
      defensiveRating: Math.round(defensiveRating * 10) / 10,
      pace: Math.round(pace * 10) / 10,
      avgPPG: Math.round(avgPPG * 10) / 10,
      avgRPG: Math.round(avgRPG * 10) / 10,
      avgAPG: Math.round(avgAPG * 10) / 10,
      avgFGPct: Math.round(avgFGPct * 10) / 10,
      avgTPPct: Math.round(avgTPPct * 10) / 10,
      avgFTPct: Math.round(avgFTPct * 10) / 10,
      trend,
    });
  }

  // Sort by offensive rating (best teams first)
  return teamStats.sort((a, b) => b.offensiveRating - a.offensiveRating);
}

/**
 * Get single team analytics
 */
export async function getTeamAnalyticsById(teamId: number): Promise<TeamStats | null> {
  const teams = await getTeamAnalytics(teamId);
  return teams.length > 0 ? teams[0] : null;
}
