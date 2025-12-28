/**
 * Props Analytics Service
 * =======================
 * TypeScript service that integrates with the Python NBA Props Toolkit
 * to provide advanced player prop projections and betting analytics.
 */

import { spawn } from "child_process";
import path from "path";
import { getPlayerByName, getAllPlayers } from "./db";

// Types for analytics results
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

/**
 * Execute Python analytics script with given action and data
 */
async function executePythonAnalytics(
  action: string,
  data: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "analytics",
      "player_props_analyzer.py"
    );

    const pythonProcess = spawn("python3", [
      scriptPath,
      "--action",
      action,
      "--data",
      JSON.stringify(data),
    ]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script error: ${stderr}`);
        reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (e) {
        console.error(`Failed to parse Python output: ${stdout}`);
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

/**
 * Calculate base PPG projection for a player
 */
export async function calculateBaseProjection(
  playerData: PlayerPropsInput
): Promise<BaseProjectionResult> {
  try {
    const result = (await executePythonAnalytics("base_projection", {
      season_ppg: playerData.season_ppg,
      expected_minutes: playerData.expected_minutes || playerData.avg_minutes,
      avg_minutes: playerData.avg_minutes,
      adjustment_factor: 1.0,
    })) as BaseProjectionResult;

    return result;
  } catch (error) {
    console.error("Base projection error:", error);
    return {
      success: false,
      projection: 0,
      error: error instanceof Error ? error.message : "Unknown error",
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
    const result = (await executePythonAnalytics("edge_calculation", {
      projection,
      line,
      min_edge: minEdge,
    })) as EdgeCalculationResult;

    return result;
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
      error: error instanceof Error ? error.message : "Unknown error",
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
    const result = (await executePythonAnalytics("variance_analysis", {
      game_logs: gameLogs,
    })) as VarianceAnalysisResult;

    return result;
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
      error: error instanceof Error ? error.message : "Unknown error",
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
    const result = (await executePythonAnalytics("hit_rate", {
      game_logs: gameLogs,
      line,
    })) as HitRateResult;

    return result;
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
      error: error instanceof Error ? error.message : "Unknown error",
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
    const result = (await executePythonAnalytics("monte_carlo", {
      base_projection: baseProjection,
      std_dev: stdDev,
      line,
      n_sims: nSims,
    })) as MonteCarloResult;

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
      error: error instanceof Error ? error.message : "Unknown error",
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
    const result = (await executePythonAnalytics("full_analysis", {
      ...playerData,
      line,
    })) as FullAnalysisResult;

    return result;
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
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run batch analysis for multiple players
 */
export async function runBatchAnalysis(
  players: PlayerPropsInput[]
): Promise<{ success: boolean; results: FullAnalysisResult[]; count: number }> {
  try {
    const result = (await executePythonAnalytics("batch_analysis", {
      players,
    })) as { success: boolean; results: FullAnalysisResult[]; count: number };

    return result;
  } catch (error) {
    console.error("Batch analysis error:", error);
    return {
      success: false,
      results: [],
      count: 0,
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
    // Get player from database
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
        error: `Player not found: ${playerName}`,
      };
    }

    // Parse PPG and minutes from string fields
    const ppg = player.ppg ? parseFloat(player.ppg) : 0;
    const minutes = player.minutesPerGame ? parseFloat(player.minutesPerGame) : 30;

    // Build player data from database record
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
      game_logs: [], // Would need game logs from a separate source
      line,
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
      error: error instanceof Error ? error.message : "Unknown error",
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

      // Parse PPG and minutes from string fields
      const ppg = parseFloat(player.ppg);
      const minutes = player.minutesPerGame ? parseFloat(player.minutesPerGame) : 30;

      const playerData: PlayerPropsInput = {
        name: playerName,
        season_ppg: ppg,
        avg_minutes: minutes,
        line,
      };

      const analysis = await runFullAnalysis(playerData, line);

      if (analysis.success && analysis.edge >= minEdge) {
        analyses.push(analysis);
      }
    }

    // Sort by edge descending and return top N
    return analyses.sort((a, b) => b.edge - a.edge).slice(0, limit);
  } catch (error) {
    console.error("Get top value plays error:", error);
    return [];
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
    const result = (await executePythonAnalytics("prop_specific", {
      prop_type: propType,
      position,
      team_avg: teamAvg,
      pace_mult: paceMult,
    })) as {
      success: boolean;
      prop_type: string;
      projection: number;
      position: string;
      position_share: number;
      team_avg: number;
      pace_mult: number;
      error?: string;
    };

    return result;
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
      error: error instanceof Error ? error.message : "Unknown error",
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
): Promise<{
  success: boolean;
  bet_type?: string;
  projection?: number;
  line?: number;
  edge?: number;
  edge_pct?: number;
  recommendation?: string;
  confidence?: number;
  factors_applied?: string[];
  probability?: { over: number; under: number };
  monte_carlo?: unknown;
  scripts_used?: string[];
  error?: string;
}> {
  try {
    const result = await executePythonAnalytics("analyze_prop", {
      bet_type: betType,
      ...playerData,
      line,
    });

    return result as {
      success: boolean;
      bet_type?: string;
      projection?: number;
      line?: number;
      edge?: number;
      edge_pct?: number;
      recommendation?: string;
      confidence?: number;
      factors_applied?: string[];
      probability?: { over: number; under: number };
      monte_carlo?: unknown;
      scripts_used?: string[];
      error?: string;
    };
  } catch (error) {
    console.error("Analyze prop error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
): Promise<{
  success: boolean;
  prop_type?: string;
  projection?: number;
  line?: number;
  edge?: number;
  edge_pct?: number;
  recommendation?: string;
  confidence?: number;
  components?: Record<string, number>;
  base_projection?: number;
  factors_applied?: string[];
  scripts_used?: string[];
  error?: string;
}> {
  try {
    const result = await executePythonAnalytics("combined_prop", {
      prop_type: propType,
      ...playerData,
      line,
    });

    return result as {
      success: boolean;
      prop_type?: string;
      projection?: number;
      line?: number;
      edge?: number;
      edge_pct?: number;
      recommendation?: string;
      confidence?: number;
      components?: Record<string, number>;
      base_projection?: number;
      factors_applied?: string[];
      scripts_used?: string[];
      error?: string;
    };
  } catch (error) {
    console.error("Combined prop error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
): Promise<{
  success: boolean;
  line_type?: string;
  projection?: number;
  line?: number;
  edge?: number;
  edge_pct?: number;
  recommendation?: string;
  confidence?: number;
  expected_margin?: number;
  implied_prob?: number;
  period?: string;
  factors_applied?: string[];
  scripts_used?: string[];
  error?: string;
}> {
  try {
    const result = await executePythonAnalytics("game_line", {
      line_type: lineType,
      ...gameData,
      line,
    });

    return result as {
      success: boolean;
      line_type?: string;
      projection?: number;
      line?: number;
      edge?: number;
      edge_pct?: number;
      recommendation?: string;
      confidence?: number;
      expected_margin?: number;
      implied_prob?: number;
      period?: string;
      factors_applied?: string[];
      scripts_used?: string[];
      error?: string;
    };
  } catch (error) {
    console.error("Game line error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
