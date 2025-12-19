import { calculateEV } from "./bettingCalculators";
import { notifyOwner } from "./_core/notification";

interface EVOpportunity {
  id: string;
  description: string;
  probability: number;
  odds: number;
  evPercent: number;
  confidence: "high" | "medium" | "low";
  timestamp: Date;
}

/**
 * Detect high-EV betting opportunities
 * Analyzes current market conditions and identifies profitable bets
 */
export async function detectHighEVOpportunities(): Promise<EVOpportunity[]> {
  try {
    const opportunities: EVOpportunity[] = [];
    
    // Simulate market analysis
    // In production, this would pull from real market data
    const marketData = [
      {
        id: "prop-1",
        description: "Player A Over 25.5 PPG",
        probability: 0.65,
        odds: 1.85,
      },
      {
        id: "spread-1",
        description: "Team B -5.5 vs Team C",
        probability: 0.58,
        odds: 1.90,
      },
      {
        id: "total-1",
        description: "Game Total Over 215.5",
        probability: 0.52,
        odds: 1.95,
      },
    ];

    // Calculate EV for each market
    for (const market of marketData) {
      const evPercent = calculateEV(market.probability, market.odds) * 100;
      
      // Flag opportunities with EV > 5%
      if (evPercent > 5) {
        const confidence = evPercent > 15 ? "high" : evPercent > 10 ? "medium" : "low";
        
        opportunities.push({
          id: market.id,
          description: market.description,
          probability: market.probability,
          odds: market.odds,
          evPercent,
          confidence,
          timestamp: new Date(),
        });
      }
    }

    // Notify owner if high-confidence opportunities found
    if (opportunities.some((o) => o.confidence === "high")) {
      const highConfidenceCount = opportunities.filter((o) => o.confidence === "high").length;
      await notifyOwner({
        title: "High-EV Opportunities Detected",
        content: `Found ${highConfidenceCount} high-confidence betting opportunities with positive expected value. Check the platform for details.`,
      });
    }

    return opportunities;
  } catch (error) {
    console.error("[EVDetection] Error detecting opportunities:", error);
    return [];
  }
}

/**
 * Get opportunities above a specific EV threshold
 */
export function filterByEVThreshold(
  opportunities: EVOpportunity[],
  minEV: number
): EVOpportunity[] {
  return opportunities.filter((opp) => opp.evPercent >= minEV);
}

/**
 * Get opportunities by confidence level
 */
export function filterByConfidence(
  opportunities: EVOpportunity[],
  confidence: "high" | "medium" | "low"
): EVOpportunity[] {
  return opportunities.filter((opp) => opp.confidence === confidence);
}

/**
 * Rank opportunities by EV percentage
 */
export function rankByEV(opportunities: EVOpportunity[]): EVOpportunity[] {
  return [...opportunities].sort((a, b) => b.evPercent - a.evPercent);
}
