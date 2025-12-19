import { getDb } from "./db";
import { players } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface PropBet {
  playerId: number;
  playerName: string;
  propType: "points" | "rebounds" | "assists";
  line: number;
  overOdds: number;
  underOdds: number;
  bookmaker: string;
  seasonAverage: number;
  last10Average: number;
  hitRate: number; // Percentage of games where player went over the line
  seasonHitRate: number; // Hit rate for the entire season
  recommendation: "OVER" | "UNDER" | "NEUTRAL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface PropAnalysis {
  player: typeof players.$inferSelect;
  props: PropBet[];
  overallRecommendation: string;
}

/**
 * Calculate hit rate for a prop bet based on player's game log
 * For now, we'll simulate this with season averages until we have game logs
 */
function calculateHitRate(
  seasonAvg: number,
  last10Avg: number,
  line: number
): { hitRate: number; seasonHitRate: number } {
  // Simplified calculation: if season avg > line, higher hit rate
  const seasonDiff = seasonAvg - line;
  const last10Diff = last10Avg - line;
  
  // Season hit rate based on how far above/below line the season average is
  let seasonHitRate = 50; // Base 50%
  if (seasonDiff > 0) {
    seasonHitRate = Math.min(85, 50 + (seasonDiff / seasonAvg) * 100);
  } else {
    seasonHitRate = Math.max(15, 50 + (seasonDiff / seasonAvg) * 100);
  }
  
  // Recent hit rate weighted more heavily
  let hitRate = 50;
  if (last10Diff > 0) {
    hitRate = Math.min(90, 50 + (last10Diff / last10Avg) * 120);
  } else {
    hitRate = Math.max(10, 50 + (last10Diff / last10Avg) * 120);
  }
  
  return {
    hitRate: Math.round(hitRate),
    seasonHitRate: Math.round(seasonHitRate)
  };
}

/**
 * Determine recommendation based on hit rates and odds
 */
function getRecommendation(
  hitRate: number,
  seasonHitRate: number,
  overOdds: number
): { recommendation: "OVER" | "UNDER" | "NEUTRAL"; confidence: "HIGH" | "MEDIUM" | "LOW" } {
  const avgHitRate = (hitRate + seasonHitRate) / 2;
  
  // Calculate implied probability from American odds
  const impliedProb = overOdds < 0 
    ? (Math.abs(overOdds) / (Math.abs(overOdds) + 100)) * 100
    : (100 / (overOdds + 100)) * 100;
  
  const edge = avgHitRate - impliedProb;
  
  let recommendation: "OVER" | "UNDER" | "NEUTRAL";
  let confidence: "HIGH" | "MEDIUM" | "LOW";
  
  if (edge > 10) {
    recommendation = "OVER";
    confidence = edge > 20 ? "HIGH" : "MEDIUM";
  } else if (edge < -10) {
    recommendation = "UNDER";
    confidence = edge < -20 ? "HIGH" : "MEDIUM";
  } else {
    recommendation = "NEUTRAL";
    confidence = "LOW";
  }
  
  return { recommendation, confidence };
}

/**
 * Analyze prop bets for a specific player
 */
export async function analyzePlayerProps(playerName: string): Promise<PropAnalysis | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Get player data
  const playerResults = await db
    .select()
    .from(players)
    .limit(100); // Get all players and filter in memory
  
  const matchingPlayers = playerResults.filter(p => p.fullName === playerName);
  if (matchingPlayers.length === 0) {
    return null;
  }
  
  const player = matchingPlayers[0];
  
  // Calculate last 10 games averages (simulated for now)
  // In production, this would come from game logs
  const last10Multiplier = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
  
  const props: PropBet[] = [];
  
  // Parse string stats to numbers
  const ppg = parseFloat(player.ppg ?? "0") || 0;
  const rpg = parseFloat(player.rpg ?? "0") || 0;
  const apg = parseFloat(player.apg ?? "0") || 0;
  
  // Points props
  const pointsLine = Math.round(ppg - 2 + Math.random() * 4);
  const pointsLast10 = ppg * last10Multiplier;
  const pointsHitRates = calculateHitRate(ppg, pointsLast10, pointsLine);
  const pointsRec = getRecommendation(pointsHitRates.hitRate, pointsHitRates.seasonHitRate, -110);
  
  props.push({
    playerId: player.id,
    playerName: player.fullName,
    propType: "points",
    line: pointsLine,
    overOdds: -110,
    underOdds: -110,
    bookmaker: "FanDuel",
    seasonAverage: ppg,
    last10Average: Number(pointsLast10.toFixed(1)),
    hitRate: pointsHitRates.hitRate,
    seasonHitRate: pointsHitRates.seasonHitRate,
    recommendation: pointsRec.recommendation,
    confidence: pointsRec.confidence
  });
  
  // Rebounds props
  const reboundsLine = Math.round(rpg - 1 + Math.random() * 2);
  const reboundsLast10 = rpg * last10Multiplier;
  const reboundsHitRates = calculateHitRate(rpg, reboundsLast10, reboundsLine);
  const reboundsRec = getRecommendation(reboundsHitRates.hitRate, reboundsHitRates.seasonHitRate, -110);
  
  props.push({
    playerId: player.id,
    playerName: player.fullName,
    propType: "rebounds",
    line: reboundsLine,
    overOdds: -110,
    underOdds: -110,
    bookmaker: "DraftKings",
    seasonAverage: rpg,
    last10Average: Number(reboundsLast10.toFixed(1)),
    hitRate: reboundsHitRates.hitRate,
    seasonHitRate: reboundsHitRates.seasonHitRate,
    recommendation: reboundsRec.recommendation,
    confidence: reboundsRec.confidence
  });
  
  // Assists props
  const assistsLine = Math.round(apg - 0.5 + Math.random() * 1);
  const assistsLast10 = apg * last10Multiplier;
  const assistsHitRates = calculateHitRate(apg, assistsLast10, assistsLine);
  const assistsRec = getRecommendation(assistsHitRates.hitRate, assistsHitRates.seasonHitRate, -110);
  
  props.push({
    playerId: player.id,
    playerName: player.fullName,
    propType: "assists",
    line: assistsLine,
    overOdds: -110,
    underOdds: -110,
    bookmaker: "BetMGM",
    seasonAverage: apg,
    last10Average: Number(assistsLast10.toFixed(1)),
    hitRate: assistsHitRates.hitRate,
    seasonHitRate: assistsHitRates.seasonHitRate,
    recommendation: assistsRec.recommendation,
    confidence: assistsRec.confidence
  });
  
  // Generate overall recommendation
  const highConfidenceProps = props.filter(p => p.confidence === "HIGH");
  let overallRecommendation = "No strong recommendations at this time.";
  
  if (highConfidenceProps.length > 0) {
    const recommendations = highConfidenceProps.map(p => 
      `${p.propType.toUpperCase()} ${p.recommendation} ${p.line} (${p.hitRate}% hit rate)`
    );
    overallRecommendation = `Strong plays: ${recommendations.join(", ")}`;
  }
  
  return {
    player,
    props,
    overallRecommendation
  };
}

/**
 * Get top prop bet opportunities across all players
 */
export async function getTopPropOpportunities(limit: number = 10): Promise<PropBet[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all players with decent stats
  const allPlayers = await db
    .select()
    .from(players)
    .limit(50); // Analyze top 50 players
  
  const allProps: PropBet[] = [];
  
  for (const player of allPlayers) {
    const analysis = await analyzePlayerProps(player.fullName);
    if (analysis) {
      allProps.push(...analysis.props);
    }
  }
  
  // Sort by confidence and hit rate
  const sortedProps = allProps
    .filter(p => p.confidence === "HIGH" || p.confidence === "MEDIUM")
    .sort((a, b) => {
      // First sort by confidence
      const confScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (confScore[a.confidence] !== confScore[b.confidence]) {
        return confScore[b.confidence] - confScore[a.confidence];
      }
      // Then by hit rate
      return b.hitRate - a.hitRate;
    });
  
  return sortedProps.slice(0, limit);
}
