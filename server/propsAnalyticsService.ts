/**
 * Props Analytics Service
 * =======================
 * TypeScript service providing advanced player prop projections and betting analytics.
 * Uses pure TypeScript implementation - no Python dependencies.
 */

import { getPlayerByName, getAllPlayers } from "./db";
import { 
  analyticsEngine, 
  AnalysisResult, 
  CombinedPropResult, 
  GameLineResult,
  PlayerData,
  GameContext
} from "./analyticsEngine";

// ============================================================================
// TYPES (Re-export for compatibility)
// ============================================================================

export interface BaseProjectionResult {
  success: boolean;
  projection: number;
  season_ppg?: number;
  minutes_multiplier?: number;
  expected_minutes?: number;
  avg_minutes?: number;
  error?: string;
}

export interface EdgeCalculationResult {
  success: boolean;
  edge: number;
  edge_pct: number;
  recommendation: "STRONG_BUY" | "BUY" | "PASS" | "SELL" | "STRONG_SELL";
  confidence: number;
  expected_value: number;
  is_profitable: boolean;
  projection?: number;
  line?: number;
  error?: string;
}

export interface VarianceAnalysisResult {
  success: boolean;
  mean: number;
  std_dev: number;
  variance: number;
  cv: number;
  consistency:
    | "VERY_CONSISTENT"
    | "CONSISTENT"
    | "MODERATE"
    | "INCONSISTENT"
    | "VERY_INCONSISTENT";
  min: number;
  max: number;
  p25: number;
  p75: number;
  games_analyzed: number;
  error?: string;
}

export interface HitRateResult {
  success: boolean;
  hit_rate: number;
  hit_rate_pct: number;
  hits: number;
  total_games: number;
  recent_hit_rate: number;
  recent_hit_rate_pct: number;
  trend: "IMPROVING" | "STABLE" | "DECLINING";
  confidence: number;
  line: number;
  error?: string;
}

export interface MonteCarloResult {
  success: boolean;
  mean: number;
  median: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  p_over: number;
  p_under: number;
  line: number;
  simulations: number;
  error?: string;
}

export interface FullAnalysisResult {
  success: boolean;
  player_name: string;
  final_projection: number;
  line: number;
  edge: number;
  recommendation: string;
  confidence: number;
  expected_value: number;
  base_projection: number;
  context_adjusted: number;
  rest_adjusted: number;
  variance?: VarianceAnalysisResult;
  hit_rate?: HitRateResult;
  monte_carlo?: MonteCarloResult;
  factors_applied: string[];
  error?: string;
}

export interface PlayerPropsInput {
  name: string;
  season_ppg: number;
  expected_minutes?: number;
  avg_minutes: number;
  is_home?: boolean;
  is_favorite?: boolean;
  spread?: number;
  total?: number;
  days_rest?: number;
  is_back_to_back?: boolean;
  game_logs?: number[];
  line?: number;
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Calculate base PPG projection for a player
 */
export async function calculateBaseProjection(
  playerData: PlayerPropsInput
): Promise<BaseProjectionResult> {
  try {
    const avgMinutes = playerData.avg_minutes || 30;
    const expectedMinutes = playerData.expected_minutes || avgMinutes;
    
    const projection = analyticsEngine.calculateBaseProjection(
      playerData.season_ppg,
      expectedMinutes,
      avgMinutes
    );

    return {
      success: true,
      projection: Math.round(projection * 100) / 100,
      season_ppg: playerData.season_ppg,
      minutes_multiplier: expectedMinutes / avgMinutes,
      expected_minutes: expectedMinutes,
      avg_minutes: avgMinutes
    };
  } catch (error) {
    console.error("Base projection error:", error);
    return {
      success: false,
      projection: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Calculate betting edge vs sportsbook line
 */
export async function calculateEdge(
  projection: number,
  line: number,
  minEdge: number = 0.5
): Promise<EdgeCalculationResult> {
  try {
    const result = analyticsEngine.calculateEdge(projection, line, minEdge);

    return {
      success: true,
      edge: result.edge,
      edge_pct: result.edgePct,
      recommendation: result.recommendation as EdgeCalculationResult["recommendation"],
      confidence: result.confidence,
      expected_value: result.expectedValue,
      is_profitable: result.isProfitable,
      projection,
      line
    };
  } catch (error) {
    console.error("Edge calculation error:", error);
    return {
      success: false,
      edge: 0,
      edge_pct: 0,
      recommendation: "PASS",
      confidence: 0,
      expected_value: 0,
      is_profitable: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Analyze player variance from game logs
 */
export async function analyzeVariance(
  gameLogs: number[]
): Promise<VarianceAnalysisResult> {
  try {
    if (!gameLogs || gameLogs.length < 3) {
      return {
        success: false,
        mean: 0,
        std_dev: 0,
        variance: 0,
        cv: 0,
        consistency: "MODERATE",
        min: 0,
        max: 0,
        p25: 0,
        p75: 0,
        games_analyzed: 0,
        error: "Insufficient game data (need at least 3 games)"
      };
    }

    const mean = gameLogs.reduce((a, b) => a + b, 0) / gameLogs.length;
    const squareDiffs = gameLogs.map(v => Math.pow(v - mean, 2));
    const variance = squareDiffs.reduce((a, b) => a + b, 0) / gameLogs.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;

    // Determine consistency rating
    let consistency: VarianceAnalysisResult["consistency"];
    if (cv < 15) {
      consistency = "VERY_CONSISTENT";
    } else if (cv < 25) {
      consistency = "CONSISTENT";
    } else if (cv < 35) {
      consistency = "MODERATE";
    } else if (cv < 50) {
      consistency = "INCONSISTENT";
    } else {
      consistency = "VERY_INCONSISTENT";
    }

    // Calculate percentiles
    const sorted = [...gameLogs].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];

    return {
      success: true,
      mean: Math.round(mean * 100) / 100,
      std_dev: Math.round(stdDev * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      cv: Math.round(cv * 100) / 100,
      consistency,
      min: Math.round(Math.min(...gameLogs) * 100) / 100,
      max: Math.round(Math.max(...gameLogs) * 100) / 100,
      p25: Math.round(p25 * 100) / 100,
      p75: Math.round(p75 * 100) / 100,
      games_analyzed: gameLogs.length
    };
  } catch (error) {
    console.error("Variance analysis error:", error);
    return {
      success: false,
      mean: 0,
      std_dev: 0,
      variance: 0,
      cv: 0,
      consistency: "MODERATE",
      min: 0,
      max: 0,
      p25: 0,
      p75: 0,
      games_analyzed: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Calculate hit rate for a given line
 */
export async function calculateHitRate(
  gameLogs: number[],
  line: number
): Promise<HitRateResult> {
  try {
    if (!gameLogs || gameLogs.length === 0) {
      return {
        success: false,
        hit_rate: 0,
        hit_rate_pct: 0,
        hits: 0,
        total_games: 0,
        recent_hit_rate: 0,
        recent_hit_rate_pct: 0,
        trend: "STABLE",
        confidence: 0,
        line,
        error: "No game data provided"
      };
    }

    const hits = gameLogs.filter(ppg => ppg > line).length;
    const totalGames = gameLogs.length;
    const hitRate = hits / totalGames;

    // Calculate recent form (last 5 games)
    const recentLogs = gameLogs.slice(-5);
    const recentHits = recentLogs.filter(ppg => ppg > line).length;
    const recentHitRate = recentHits / recentLogs.length;

    // Determine trend
    let trend: HitRateResult["trend"];
    if (recentHitRate > hitRate + 0.1) {
      trend = "IMPROVING";
    } else if (recentHitRate < hitRate - 0.1) {
      trend = "DECLINING";
    } else {
      trend = "STABLE";
    }

    // Calculate confidence based on sample size
    const confidence = Math.min(0.95, 0.5 + (totalGames / 50));

    return {
      success: true,
      hit_rate: Math.round(hitRate * 1000) / 1000,
      hit_rate_pct: Math.round(hitRate * 1000) / 10,
      hits,
      total_games: totalGames,
      recent_hit_rate: Math.round(recentHitRate * 1000) / 1000,
      recent_hit_rate_pct: Math.round(recentHitRate * 1000) / 10,
      trend,
      confidence: Math.round(confidence * 1000) / 1000,
      line
    };
  } catch (error) {
    console.error("Hit rate error:", error);
    return {
      success: false,
      hit_rate: 0,
      hit_rate_pct: 0,
      hits: 0,
      total_games: 0,
      recent_hit_rate: 0,
      recent_hit_rate_pct: 0,
      trend: "STABLE",
      confidence: 0,
      line,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Run Monte Carlo simulation
 */
export async function runMonteCarlo(
  baseProjection: number,
  stdDev: number,
  line: number,
  nSims: number = 10000
): Promise<MonteCarloResult> {
  try {
    const result = analyticsEngine.runMonteCarlo(baseProjection, stdDev, line, nSims);
    return result;
  } catch (error) {
    console.error("Monte Carlo error:", error);
    return {
      success: false,
      mean: 0,
      median: 0,
      p5: 0,
      p25: 0,
      p75: 0,
      p95: 0,
      p_over: 0.5,
      p_under: 0.5,
      line,
      simulations: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Run full integrated analysis for a player
 */
export async function runFullAnalysis(
  playerData: PlayerPropsInput,
  line: number
): Promise<FullAnalysisResult> {
  try {
    const playerDataForEngine: PlayerData = {
      ppg: playerData.season_ppg,
      minutesPerGame: playerData.avg_minutes
    };

    const context: GameContext = {
      isHome: playerData.is_home,
      isFavorite: playerData.is_favorite,
      spread: playerData.spread,
      total: playerData.total,
      daysRest: playerData.days_rest,
      isBackToBack: playerData.is_back_to_back
    };

    const result = analyticsEngine.analyzeProp("points", playerDataForEngine, line, context);

    if (!result.success) {
      return {
        success: false,
        player_name: playerData.name,
        final_projection: 0,
        line,
        edge: 0,
        recommendation: "PASS",
        confidence: 0,
        expected_value: 0,
        base_projection: 0,
        context_adjusted: 0,
        rest_adjusted: 0,
        factors_applied: [],
        error: result.error
      };
    }

    return {
      success: true,
      player_name: playerData.name,
      final_projection: result.projection || 0,
      line,
      edge: result.edge || 0,
      recommendation: result.recommendation || "PASS",
      confidence: result.confidence || 0,
      expected_value: result.edge_pct || 0,
      base_projection: playerData.season_ppg,
      context_adjusted: result.projection || 0,
      rest_adjusted: result.projection || 0,
      monte_carlo: result.monte_carlo,
      factors_applied: result.factors_applied || []
    };
  } catch (error) {
    console.error("Full analysis error:", error);
    return {
      success: false,
      player_name: playerData.name,
      final_projection: 0,
      line,
      edge: 0,
      recommendation: "PASS",
      confidence: 0,
      expected_value: 0,
      base_projection: 0,
      context_adjusted: 0,
      rest_adjusted: 0,
      factors_applied: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Analyze a player from the database by name
 */
export async function analyzePlayerByName(
  playerName: string,
  line: number,
  gameContext?: {
    isHome?: boolean;
    isFavorite?: boolean;
    spread?: number;
    total?: number;
    daysRest?: number;
    isBackToBack?: boolean;
  }
): Promise<FullAnalysisResult> {
  try {
    const player = await getPlayerByName(playerName);

    if (!player) {
      return {
        success: false,
        player_name: playerName,
        final_projection: 0,
        line,
        edge: 0,
        recommendation: "PASS",
        confidence: 0,
        expected_value: 0,
        base_projection: 0,
        context_adjusted: 0,
        rest_adjusted: 0,
        factors_applied: [],
        error: `Player not found: ${playerName}`
      };
    }

    const ppg = player.ppg ? parseFloat(player.ppg) : 0;
    const minutes = player.minutesPerGame ? parseFloat(player.minutesPerGame) : 30;

    const playerData: PlayerPropsInput = {
      name: `${player.firstName} ${player.lastName}`,
      season_ppg: ppg,
      avg_minutes: minutes,
      expected_minutes: minutes,
      is_home: gameContext?.isHome ?? true,
      is_favorite: gameContext?.isFavorite ?? true,
      spread: gameContext?.spread ?? 0,
      total: gameContext?.total ?? 220,
      days_rest: gameContext?.daysRest ?? 2,
      is_back_to_back: gameContext?.isBackToBack ?? false,
      game_logs: [],
      line
    };

    return await runFullAnalysis(playerData, line);
  } catch (error) {
    console.error("Analyze player by name error:", error);
    return {
      success: false,
      player_name: playerName,
      final_projection: 0,
      line,
      edge: 0,
      recommendation: "PASS",
      confidence: 0,
      expected_value: 0,
      base_projection: 0,
      context_adjusted: 0,
      rest_adjusted: 0,
      factors_applied: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Universal prop analyzer - handles all bet types
 */
export async function analyzeProp(
  betType: string,
  playerData: Record<string, unknown>,
  line: number
): Promise<AnalysisResult> {
  try {
    const enginePlayerData: PlayerData = {
      ppg: Number(playerData.ppg || playerData.season_ppg || 0),
      rpg: Number(playerData.rpg || playerData.season_rpg || 0),
      apg: Number(playerData.apg || playerData.season_apg || 0),
      spg: Number(playerData.spg || playerData.season_spg || 0),
      bpg: Number(playerData.bpg || playerData.season_bpg || 0),
      tpm: Number(playerData.tpm || playerData.season_tpm || 0),
      minutesPerGame: Number(playerData.avg_minutes || playerData.minutesPerGame || 30)
    };

    const context: GameContext = {
      isHome: Boolean(playerData.is_home ?? true),
      isFavorite: Boolean(playerData.is_favorite ?? true),
      spread: Number(playerData.spread || 0),
      total: Number(playerData.total || 220),
      daysRest: Number(playerData.days_rest || 2),
      isBackToBack: Boolean(playerData.is_back_to_back || false)
    };

    return analyticsEngine.analyzeProp(betType, enginePlayerData, line, context);
  } catch (error) {
    console.error("Analyze prop error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Combined props analyzer (PRA, PA, PR, RA, S+B)
 */
export async function analyzeCombinedProp(
  propType: string,
  playerData: Record<string, unknown>,
  line: number
): Promise<CombinedPropResult> {
  try {
    const enginePlayerData: PlayerData = {
      ppg: Number(playerData.ppg || playerData.season_ppg || 0),
      rpg: Number(playerData.rpg || playerData.season_rpg || 0),
      apg: Number(playerData.apg || playerData.season_apg || 0),
      spg: Number(playerData.spg || playerData.season_spg || 0),
      bpg: Number(playerData.bpg || playerData.season_bpg || 0)
    };

    const context: GameContext = {
      isHome: Boolean(playerData.is_home ?? true),
      isFavorite: Boolean(playerData.is_favorite ?? true),
      daysRest: Number(playerData.days_rest || 2),
      isBackToBack: Boolean(playerData.is_back_to_back || false)
    };

    return analyticsEngine.analyzeCombinedProp(propType, enginePlayerData, line, context);
  } catch (error) {
    console.error("Combined prop error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Game line analyzer (ML, spread, total, quarters, halves)
 */
export async function analyzeGameLine(
  lineType: string,
  gameData: Record<string, unknown>,
  line: number
): Promise<GameLineResult> {
  try {
    const engineGameData = {
      homeTeam: String(gameData.home_team || gameData.homeTeam || ""),
      awayTeam: String(gameData.away_team || gameData.awayTeam || ""),
      homeRating: Number(gameData.home_rating || gameData.homeRating || 110),
      awayRating: Number(gameData.away_rating || gameData.awayRating || 110),
      homePace: Number(gameData.home_pace || gameData.homePace || 100),
      awayPace: Number(gameData.away_pace || gameData.awayPace || 100)
    };

    return analyticsEngine.analyzeGameLine(lineType, engineGameData, line);
  } catch (error) {
    console.error("Game line error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Calculate prop-specific projection (assists, rebounds, etc.)
 */
export async function calculatePropSpecific(
  propType: string,
  position: string,
  teamAvg: number,
  paceMult: number = 1.0
): Promise<{
  success: boolean;
  prop_type: string;
  projection: number;
  position: string;
  position_share: number;
  team_avg: number;
  pace_mult: number;
  error?: string;
}> {
  try {
    // Position share percentages for different stats
    const positionShares: Record<string, Record<string, number>> = {
      rebounds: { C: 0.25, PF: 0.20, SF: 0.15, SG: 0.12, PG: 0.10 },
      assists: { PG: 0.30, SG: 0.20, SF: 0.18, PF: 0.15, C: 0.12 },
      steals: { PG: 0.22, SG: 0.22, SF: 0.20, PF: 0.18, C: 0.15 },
      blocks: { C: 0.35, PF: 0.25, SF: 0.15, SG: 0.10, PG: 0.08 }
    };

    const shares = positionShares[propType.toLowerCase()] || positionShares.rebounds;
    const positionShare = shares[position.toUpperCase()] || 0.15;
    
    const projection = teamAvg * positionShare * paceMult;

    return {
      success: true,
      prop_type: propType,
      projection: Math.round(projection * 100) / 100,
      position,
      position_share: positionShare,
      team_avg: teamAvg,
      pace_mult: paceMult
    };
  } catch (error) {
    console.error("Prop specific error:", error);
    return {
      success: false,
      prop_type: propType,
      projection: 0,
      position,
      position_share: 0,
      team_avg: teamAvg,
      pace_mult: paceMult,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get top value plays from all players
 */
export async function getTopValuePlays(
  lines: Map<string, number>,
  minEdge: number = 1.0,
  limit: number = 10
): Promise<FullAnalysisResult[]> {
  try {
    const allPlayers = await getAllPlayers();
    const analyses: FullAnalysisResult[] = [];

    for (const player of allPlayers) {
      const playerName = `${player.firstName} ${player.lastName}`;
      const line = lines.get(playerName);

      if (!line || !player.ppg) continue;

      const ppg = parseFloat(player.ppg);
      const minutes = player.minutesPerGame ? parseFloat(player.minutesPerGame) : 30;

      const playerData: PlayerPropsInput = {
        name: playerName,
        season_ppg: ppg,
        avg_minutes: minutes,
        line
      };

      const analysis = await runFullAnalysis(playerData, line);

      if (analysis.success && analysis.edge >= minEdge) {
        analyses.push(analysis);
      }
    }

    return analyses.sort((a, b) => b.edge - a.edge).slice(0, limit);
  } catch (error) {
    console.error("Get top value plays error:", error);
    return [];
  }
}

/**
 * Run batch analysis for multiple players
 */
export async function runBatchAnalysis(
  players: PlayerPropsInput[]
): Promise<{ success: boolean; results: FullAnalysisResult[]; count: number }> {
  try {
    const results: FullAnalysisResult[] = [];

    for (const player of players) {
      const analysis = await runFullAnalysis(player, player.line || 0);
      results.push(analysis);
    }

    return {
      success: true,
      results,
      count: results.length
    };
  } catch (error) {
    console.error("Batch analysis error:", error);
    return {
      success: false,
      results: [],
      count: 0
    };
  }
}
