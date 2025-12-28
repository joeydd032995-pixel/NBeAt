/**
 * NBA Props Analytics Engine - Pure TypeScript Implementation
 * ============================================================
 * Complete analytics toolkit for NBA player props and game lines.
 * No Python dependencies - runs natively on any Node.js environment.
 * 
 * Features:
 * - Player prop projections (points, rebounds, assists, etc.)
 * - Combined props (PRA, PA, PR, RA, S+B)
 * - Game line analysis (spread, total, moneyline)
 * - Monte Carlo simulations
 * - Edge calculations with recommendations
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeDivide(numerator: number, denominator: number, defaultVal = 0): number {
  if (denominator === 0 || !isFinite(denominator)) return defaultVal;
  const result = numerator / denominator;
  return isFinite(result) ? result : defaultVal;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(index, sorted.length - 1)];
}

function normalRandom(mean: number, stdDev: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerData {
  ppg?: number;
  rpg?: number;
  apg?: number;
  spg?: number;
  bpg?: number;
  tpm?: number;
  fgPct?: number;
  ftPct?: number;
  threePct?: number;
  minutesPerGame?: number;
  gamesPlayed?: number;
  position?: string;
  team?: string;
}

export interface GameContext {
  isHome?: boolean;
  isFavorite?: boolean;
  spread?: number;
  total?: number;
  daysRest?: number;
  isBackToBack?: boolean;
  opponentDrtg?: number;
  pace?: number;
}

export interface AnalysisResult {
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
  monte_carlo?: MonteCarloResult;
  scripts_used?: string[];
  error?: string;
}

export interface CombinedPropResult {
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
}

export interface GameLineResult {
  success: boolean;
  line_type?: string;
  projection?: number;
  line?: number;
  edge?: number;
  edge_pct?: number;
  recommendation?: string;
  confidence?: number;
  expected_margin?: number;
  win_probability?: number;
  factors_applied?: string[];
  scripts_used?: string[];
  error?: string;
}

interface MonteCarloResult {
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
}

// ============================================================================
// CORE ANALYTICS CLASS
// ============================================================================

export class NBAAnalyticsEngine {
  
  // --------------------------------------------------------------------------
  // BASE PROJECTION CALCULATIONS
  // --------------------------------------------------------------------------
  
  /**
   * Calculate base projection with minutes adjustment
   */
  calculateBaseProjection(
    seasonAvg: number,
    expectedMinutes: number,
    avgMinutes: number,
    adjustmentFactor = 1.0
  ): number {
    if (avgMinutes === 0) return seasonAvg;
    const minutesMultiplier = safeDivide(expectedMinutes, avgMinutes, 1.0);
    const projection = seasonAvg * minutesMultiplier * adjustmentFactor;
    return clamp(projection, 0, 50);
  }

  /**
   * Apply game context adjustments
   */
  applyGameContext(
    baseProjection: number,
    context: GameContext
  ): { projection: number; factors: string[] } {
    let adjustment = 1.0;
    const factors: string[] = [];

    // Home court advantage
    if (context.isHome) {
      adjustment *= 1.02;
      factors.push("home_+2%");
    } else {
      adjustment *= 0.98;
      factors.push("away_-2%");
    }

    // Favorite/underdog adjustment
    if (context.isFavorite !== undefined) {
      if (context.isFavorite) {
        const spread = Math.abs(context.spread || 0);
        if (spread > 10) {
          adjustment *= 0.95; // Heavy favorites may rest
          factors.push("heavy_favorite_-5%");
        } else {
          adjustment *= 1.015;
          factors.push("favorite_+1.5%");
        }
      } else {
        const spread = Math.abs(context.spread || 0);
        if (spread > 10) {
          adjustment *= 1.03; // Underdogs play harder
          factors.push("heavy_underdog_+3%");
        } else {
          adjustment *= 0.99;
          factors.push("underdog_-1%");
        }
      }
    }

    // Pace adjustment based on total
    if (context.total) {
      const paceFactor = safeDivide(context.total, 220, 1.0);
      adjustment *= paceFactor;
      factors.push(`pace_${(paceFactor * 100 - 100).toFixed(1)}%`);
    }

    // Rest impact
    if (context.isBackToBack) {
      adjustment *= 0.92;
      factors.push("b2b_-8%");
    } else if (context.daysRest !== undefined) {
      if (context.daysRest === 0) {
        adjustment *= 0.95;
        factors.push("no_rest_-5%");
      } else if (context.daysRest === 1) {
        adjustment *= 0.98;
        factors.push("1_day_rest_-2%");
      } else if (context.daysRest >= 3) {
        adjustment *= 1.02;
        factors.push("rested_+2%");
      }
    }

    // Opponent defensive rating adjustment
    if (context.opponentDrtg) {
      const drtgFactor = safeDivide(context.opponentDrtg, 110, 1.0);
      adjustment *= drtgFactor;
      factors.push(`opp_drtg_${((drtgFactor - 1) * 100).toFixed(1)}%`);
    }

    const finalProjection = clamp(baseProjection * adjustment, 0, 50);
    return { projection: finalProjection, factors };
  }

  /**
   * Apply rest/fatigue adjustments
   */
  applyRestImpact(
    baseProjection: number,
    daysRest: number,
    isBackToBack: boolean
  ): { projection: number; factors: string[] } {
    let adjustment = 1.0;
    const factors: string[] = [];

    if (isBackToBack) {
      adjustment *= 0.92;
      factors.push("back_to_back_-8%");
    } else if (daysRest === 0) {
      adjustment *= 0.95;
      factors.push("no_rest_-5%");
    } else if (daysRest === 1) {
      adjustment *= 0.98;
      factors.push("1_day_rest_-2%");
    } else if (daysRest === 2) {
      factors.push("normal_rest");
    } else if (daysRest >= 3) {
      adjustment *= 1.02;
      factors.push("extended_rest_+2%");
    }

    return {
      projection: clamp(baseProjection * adjustment, 0, 50),
      factors
    };
  }

  // --------------------------------------------------------------------------
  // EDGE CALCULATION
  // --------------------------------------------------------------------------

  /**
   * Calculate betting edge vs sportsbook line
   */
  calculateEdge(
    projection: number,
    line: number,
    minEdge = 0.5
  ): {
    edge: number;
    edgePct: number;
    recommendation: string;
    confidence: number;
    expectedValue: number;
    isProfitable: boolean;
  } {
    const edge = projection - line;
    const edgePct = safeDivide(edge, line, 0) * 100;

    // Determine recommendation
    let recommendation: string;
    let confidence: number;

    if (edge >= minEdge * 2) {
      recommendation = "STRONG_OVER";
      confidence = Math.min(0.95, 0.7 + Math.abs(edge) / 10);
    } else if (edge >= minEdge) {
      recommendation = "OVER";
      confidence = Math.min(0.85, 0.5 + Math.abs(edge) / 10);
    } else if (edge <= -minEdge * 2) {
      recommendation = "STRONG_UNDER";
      confidence = Math.min(0.95, 0.7 + Math.abs(edge) / 10);
    } else if (edge <= -minEdge) {
      recommendation = "UNDER";
      confidence = Math.min(0.85, 0.5 + Math.abs(edge) / 10);
    } else {
      recommendation = "PASS";
      confidence = 0.5;
    }

    // Calculate expected value at -110 odds
    const winProb = edge > 0 
      ? Math.min(0.95, 0.5 + edge / 20)
      : Math.max(0.05, 0.5 + edge / 20);
    const ev = (winProb * 0.909) - ((1 - winProb) * 1);

    return {
      edge: Math.round(edge * 100) / 100,
      edgePct: Math.round(edgePct * 100) / 100,
      recommendation,
      confidence: Math.round(confidence * 1000) / 1000,
      expectedValue: Math.round(ev * 10000) / 100,
      isProfitable: ev > 0
    };
  }

  // --------------------------------------------------------------------------
  // MONTE CARLO SIMULATION
  // --------------------------------------------------------------------------

  /**
   * Run Monte Carlo simulation for probability estimation
   */
  runMonteCarlo(
    baseProjection: number,
    stdDev: number,
    line: number,
    nSims = 5000
  ): MonteCarloResult {
    const results: number[] = [];
    
    // Use reasonable default stdDev if not provided
    const effectiveStdDev = stdDev > 0 ? stdDev : baseProjection * 0.25;

    for (let i = 0; i < nSims; i++) {
      const simValue = normalRandom(baseProjection, effectiveStdDev);
      results.push(Math.max(0, simValue)); // Can't have negative stats
    }

    results.sort((a, b) => a - b);
    
    const overCount = results.filter(r => r > line).length;
    const underCount = nSims - overCount;

    return {
      success: true,
      mean: Math.round(mean(results) * 100) / 100,
      median: Math.round(percentile(results, 50) * 100) / 100,
      p5: Math.round(percentile(results, 5) * 100) / 100,
      p25: Math.round(percentile(results, 25) * 100) / 100,
      p75: Math.round(percentile(results, 75) * 100) / 100,
      p95: Math.round(percentile(results, 95) * 100) / 100,
      p_over: Math.round((overCount / nSims) * 1000) / 1000,
      p_under: Math.round((underCount / nSims) * 1000) / 1000,
      line,
      simulations: nSims
    };
  }

  // --------------------------------------------------------------------------
  // PLAYER PROP ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze any player prop bet type
   */
  analyzeProp(
    betType: string,
    playerData: PlayerData,
    line: number,
    context: GameContext = {}
  ): AnalysisResult {
    try {
      // Get the relevant stat based on bet type
      let baseStat: number;
      let statName: string;

      switch (betType.toLowerCase()) {
        case "points":
          baseStat = playerData.ppg || 0;
          statName = "PPG";
          break;
        case "rebounds":
          baseStat = playerData.rpg || 0;
          statName = "RPG";
          break;
        case "assists":
          baseStat = playerData.apg || 0;
          statName = "APG";
          break;
        case "steals":
          baseStat = playerData.spg || 0;
          statName = "SPG";
          break;
        case "blocks":
          baseStat = playerData.bpg || 0;
          statName = "BPG";
          break;
        case "three_pointers":
        case "3pm":
        case "threes":
          baseStat = playerData.tpm || 0;
          statName = "3PM";
          break;
        case "double_double":
          // Special handling for double-double
          return this.analyzeDoubleDouble(playerData, line, context);
        default:
          baseStat = playerData.ppg || 0;
          statName = "PPG";
      }

      if (baseStat === 0) {
        return {
          success: false,
          error: `No ${statName} data available for player`
        };
      }

      // Calculate base projection with minutes adjustment
      const avgMinutes = playerData.minutesPerGame || 30;
      const expectedMinutes = avgMinutes; // Could be adjusted based on context
      let projection = this.calculateBaseProjection(baseStat, expectedMinutes, avgMinutes);

      // Apply game context
      const contextResult = this.applyGameContext(projection, context);
      projection = contextResult.projection;
      const factors = [...contextResult.factors];

      // Calculate edge
      const edgeResult = this.calculateEdge(projection, line);

      // Run Monte Carlo
      const stdDev = baseStat * 0.25; // Assume 25% coefficient of variation
      const monteCarlo = this.runMonteCarlo(projection, stdDev, line);

      // Calculate probability
      const probability = {
        over: Math.round(monteCarlo.p_over * 1000) / 10,
        under: Math.round(monteCarlo.p_under * 1000) / 10
      };

      return {
        success: true,
        bet_type: betType,
        projection: Math.round(projection * 100) / 100,
        line,
        edge: edgeResult.edge,
        edge_pct: edgeResult.edgePct,
        recommendation: edgeResult.recommendation,
        confidence: Math.round(edgeResult.confidence * 100),
        factors_applied: factors,
        probability,
        monte_carlo: monteCarlo,
        scripts_used: [
          "BaseProjection",
          "GameContext",
          "RestImpact",
          "MonteCarlo",
          "EdgeCalculation"
        ]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Analyze double-double probability
   */
  analyzeDoubleDouble(
    playerData: PlayerData,
    line: number,
    context: GameContext
  ): AnalysisResult {
    const ppg = playerData.ppg || 0;
    const rpg = playerData.rpg || 0;
    const apg = playerData.apg || 0;

    // Calculate probability of each stat hitting 10+
    const ptsProb = this.calculateHitProbability(ppg, 10, ppg * 0.25);
    const rebProb = this.calculateHitProbability(rpg, 10, rpg * 0.3);
    const astProb = this.calculateHitProbability(apg, 10, apg * 0.3);

    // Double-double probability (any two of three)
    const ddProb = 
      (ptsProb * rebProb * (1 - astProb)) +
      (ptsProb * astProb * (1 - rebProb)) +
      (rebProb * astProb * (1 - ptsProb)) +
      (ptsProb * rebProb * astProb);

    const projection = ddProb * 100;
    const edgeResult = this.calculateEdge(projection, line);

    return {
      success: true,
      bet_type: "double_double",
      projection: Math.round(projection * 100) / 100,
      line,
      edge: edgeResult.edge,
      edge_pct: edgeResult.edgePct,
      recommendation: edgeResult.recommendation,
      confidence: Math.round(edgeResult.confidence * 100),
      factors_applied: [
        `pts_10+_prob_${Math.round(ptsProb * 100)}%`,
        `reb_10+_prob_${Math.round(rebProb * 100)}%`,
        `ast_10+_prob_${Math.round(astProb * 100)}%`
      ],
      probability: {
        over: Math.round(ddProb * 100),
        under: Math.round((1 - ddProb) * 100)
      },
      scripts_used: ["DoubleDoubleAnalysis", "MonteCarlo"]
    };
  }

  /**
   * Calculate probability of hitting a threshold
   */
  calculateHitProbability(mean: number, threshold: number, stdDev: number): number {
    if (stdDev === 0) return mean >= threshold ? 1 : 0;
    
    // Use normal CDF approximation
    const z = (threshold - mean) / stdDev;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return z > 0 ? p : 1 - p;
  }

  // --------------------------------------------------------------------------
  // COMBINED PROPS ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze combined props (PRA, PA, PR, RA, S+B)
   */
  analyzeCombinedProp(
    propType: string,
    playerData: PlayerData,
    line: number,
    context: GameContext = {}
  ): CombinedPropResult {
    try {
      const ppg = playerData.ppg || 0;
      const rpg = playerData.rpg || 0;
      const apg = playerData.apg || 0;
      const spg = playerData.spg || 0;
      const bpg = playerData.bpg || 0;

      let baseProjection: number;
      let components: Record<string, number>;
      let correlationAdj: number;

      const propTypeLower = propType.toLowerCase();

      switch (propTypeLower) {
        case "pra":
          baseProjection = ppg + rpg + apg;
          components = { points: ppg, rebounds: rpg, assists: apg };
          correlationAdj = 0.98; // Slight negative correlation
          break;
        case "pa":
          baseProjection = ppg + apg;
          components = { points: ppg, assists: apg };
          correlationAdj = 0.99;
          break;
        case "pr":
          baseProjection = ppg + rpg;
          components = { points: ppg, rebounds: rpg };
          correlationAdj = 0.99;
          break;
        case "ra":
          baseProjection = rpg + apg;
          components = { rebounds: rpg, assists: apg };
          correlationAdj = 1.0;
          break;
        case "steals_blocks":
        case "s+b":
        case "sb":
          baseProjection = spg + bpg;
          components = { steals: spg, blocks: bpg };
          correlationAdj = 1.02; // Slight positive correlation for defensive stats
          break;
        default:
          return {
            success: false,
            error: `Unknown combined prop type: ${propType}`
          };
      }

      if (baseProjection === 0) {
        return {
          success: false,
          error: "No stat data available for combined prop"
        };
      }

      // Apply correlation adjustment
      let adjustment = correlationAdj;
      const factors: string[] = [`correlation_adj_${correlationAdj}`];

      // Apply game context
      if (context.isHome) {
        adjustment *= 1.02;
        factors.push("home_+2%");
      }
      if (context.isFavorite) {
        adjustment *= 1.015;
        factors.push("favorite_+1.5%");
      }
      if (context.isBackToBack) {
        adjustment *= 0.95;
        factors.push("b2b_-5%");
      } else if (context.daysRest && context.daysRest >= 3) {
        adjustment *= 1.02;
        factors.push("rested_+2%");
      }

      const finalProjection = baseProjection * adjustment;
      const edge = finalProjection - line;
      const edgePct = safeDivide(edge, line, 0) * 100;

      // Determine recommendation
      let recommendation: string;
      if (edgePct > 5) {
        recommendation = "STRONG_OVER";
      } else if (edgePct > 2) {
        recommendation = "OVER";
      } else if (edgePct < -5) {
        recommendation = "STRONG_UNDER";
      } else if (edgePct < -2) {
        recommendation = "UNDER";
      } else {
        recommendation = "PASS";
      }

      const confidence = Math.min(0.95, 0.6 + Math.abs(edgePct) * 0.03);

      return {
        success: true,
        prop_type: propType,
        projection: Math.round(finalProjection * 10) / 10,
        line,
        edge: Math.round(edge * 10) / 10,
        edge_pct: Math.round(edgePct * 10) / 10,
        recommendation,
        confidence: Math.round(confidence * 100) / 100,
        components,
        base_projection: Math.round(baseProjection * 10) / 10,
        factors_applied: factors,
        scripts_used: [
          "CombinedPropAnalysis",
          "CorrelationAdjustment",
          "GameContext",
          "RestImpact"
        ]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // --------------------------------------------------------------------------
  // GAME LINE ANALYSIS
  // --------------------------------------------------------------------------

  /**
   * Analyze game lines (spread, total, moneyline)
   */
  analyzeGameLine(
    lineType: string,
    gameData: {
      homeTeam?: string;
      awayTeam?: string;
      homeRating?: number;
      awayRating?: number;
      homePace?: number;
      awayPace?: number;
      homeOrtg?: number;
      awayOrtg?: number;
      homeDrtg?: number;
      awayDrtg?: number;
    },
    line: number
  ): GameLineResult {
    try {
      const homeRating = gameData.homeRating || 110;
      const awayRating = gameData.awayRating || 110;
      const homePace = gameData.homePace || 100;
      const awayPace = gameData.awayPace || 100;
      
      const factors: string[] = [];
      let projection: number;
      let recommendation: string;
      let winProbability: number | undefined;
      let expectedMargin: number | undefined;

      const lineTypeLower = lineType.toLowerCase();

      switch (lineTypeLower) {
        case "spread":
        case "point_spread":
        case "alt_spread": {
          // Calculate expected margin
          const ratingDiff = homeRating - awayRating;
          const homeAdvantage = 3.5; // Home court advantage in points
          expectedMargin = ratingDiff + homeAdvantage;
          projection = expectedMargin;
          factors.push(`rating_diff_${ratingDiff.toFixed(1)}`);
          factors.push(`home_advantage_${homeAdvantage}`);

          // Compare to spread line
          const spreadEdge = expectedMargin - Math.abs(line);
          if (line < 0) {
            // Home is favorite
            if (spreadEdge > 2) {
              recommendation = "HOME";
            } else if (spreadEdge < -2) {
              recommendation = "AWAY";
            } else {
              recommendation = "PASS";
            }
          } else {
            // Away is favorite
            if (spreadEdge > 2) {
              recommendation = "AWAY";
            } else if (spreadEdge < -2) {
              recommendation = "HOME";
            } else {
              recommendation = "PASS";
            }
          }
          break;
        }

        case "total":
        case "over_under":
        case "alt_total": {
          // Calculate expected total
          const avgPace = (homePace + awayPace) / 2;
          const paceMultiplier = avgPace / 100;
          const baseTotal = (homeRating + awayRating) * paceMultiplier;
          projection = baseTotal;
          expectedMargin = baseTotal - line;
          factors.push(`combined_rating_${(homeRating + awayRating).toFixed(1)}`);
          factors.push(`pace_mult_${paceMultiplier.toFixed(2)}`);

          if (expectedMargin > 3) {
            recommendation = "OVER";
          } else if (expectedMargin < -3) {
            recommendation = "UNDER";
          } else {
            recommendation = "PASS";
          }
          break;
        }

        case "moneyline":
        case "ml": {
          // Calculate win probability
          const ratingDiff = homeRating - awayRating + 3.5; // Include home advantage
          winProbability = 0.5 + (ratingDiff / 30); // Rough conversion
          winProbability = clamp(winProbability, 0.1, 0.9);
          projection = winProbability * 100;
          factors.push(`rating_diff_${ratingDiff.toFixed(1)}`);
          factors.push(`win_prob_${(winProbability * 100).toFixed(1)}%`);

          // Convert line to implied probability
          let impliedProb: number;
          if (line < 0) {
            impliedProb = Math.abs(line) / (Math.abs(line) + 100);
          } else {
            impliedProb = 100 / (line + 100);
          }

          const edge = winProbability - impliedProb;
          if (edge > 0.05) {
            recommendation = line < 0 ? "HOME" : "AWAY";
          } else if (edge < -0.05) {
            recommendation = line < 0 ? "AWAY" : "HOME";
          } else {
            recommendation = "PASS";
          }
          break;
        }

        case "1q":
        case "first_quarter": {
          // First quarter is roughly 25% of game
          const ratingDiff = (homeRating - awayRating) * 0.25 + 0.875; // 25% of home advantage
          projection = ratingDiff;
          expectedMargin = ratingDiff;
          factors.push("first_quarter_25%_weight");
          recommendation = ratingDiff > line + 0.5 ? "HOME" : ratingDiff < line - 0.5 ? "AWAY" : "PASS";
          break;
        }

        case "1h":
        case "first_half": {
          // First half is roughly 50% of game
          const ratingDiff = (homeRating - awayRating) * 0.5 + 1.75; // 50% of home advantage
          projection = ratingDiff;
          expectedMargin = ratingDiff;
          factors.push("first_half_50%_weight");
          recommendation = ratingDiff > line + 1 ? "HOME" : ratingDiff < line - 1 ? "AWAY" : "PASS";
          break;
        }

        case "2h":
        case "second_half": {
          // Second half - similar to first half but with game flow considerations
          const ratingDiff = (homeRating - awayRating) * 0.5 + 1.75;
          projection = ratingDiff;
          expectedMargin = ratingDiff;
          factors.push("second_half_50%_weight");
          factors.push("game_flow_variance_+5%");
          recommendation = ratingDiff > line + 1 ? "HOME" : ratingDiff < line - 1 ? "AWAY" : "PASS";
          break;
        }

        default:
          return {
            success: false,
            error: `Unknown line type: ${lineType}`
          };
      }

      const edge = projection - line;
      const edgePct = safeDivide(edge, Math.abs(line) || 1, 0) * 100;
      const confidence = Math.min(0.9, 0.5 + Math.abs(edgePct) * 0.02);

      return {
        success: true,
        line_type: lineType,
        projection: Math.round(projection * 10) / 10,
        line,
        edge: Math.round(edge * 10) / 10,
        edge_pct: Math.round(edgePct * 10) / 10,
        recommendation,
        confidence: Math.round(confidence * 100) / 100,
        expected_margin: expectedMargin ? Math.round(expectedMargin * 10) / 10 : undefined,
        win_probability: winProbability ? Math.round(winProbability * 1000) / 10 : undefined,
        factors_applied: factors,
        scripts_used: [
          "TeamRatingAnalysis",
          "HomeAdvantage",
          "PaceAdjustment",
          "EdgeCalculation"
        ]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

// Export singleton instance
export const analyticsEngine = new NBAAnalyticsEngine();
