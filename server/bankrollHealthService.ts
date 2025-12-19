import { notifyOwner } from "./_core/notification";

interface BankrollAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation: string;
  timestamp: Date;
}

/**
 * Check bankroll health and generate alerts
 */
export async function checkBankrollHealth(): Promise<BankrollAlert[]> {
  try {
    const alerts: BankrollAlert[] = [];

    // Simulate bankroll analysis
    // In production, this would pull from actual user bankroll data
    const bankrollMetrics = {
      currentBankroll: 10000,
      initialBankroll: 10000,
      totalBetsPlaced: 5,
      winRate: 0.60,
      roi: 0.05,
      largestLoss: 500,
      largestWin: 750,
    };

    // Check for critical losses
    if (bankrollMetrics.largestLoss > bankrollMetrics.currentBankroll * 0.1) {
      alerts.push({
        id: "loss-alert-1",
        severity: "warning",
        message: `Largest single loss (${bankrollMetrics.largestLoss}) exceeds 10% of bankroll`,
        recommendation: "Consider reducing bet sizes or increasing Kelly multiplier caution",
        timestamp: new Date(),
      });
    }

    // Check win rate
    if (bankrollMetrics.winRate < 0.45) {
      alerts.push({
        id: "winrate-alert-1",
        severity: "warning",
        message: `Win rate (${(bankrollMetrics.winRate * 100).toFixed(1)}%) is below 50%`,
        recommendation: "Review your bet selection criteria and edge calculations",
        timestamp: new Date(),
      });
    }

    // Check ROI
    if (bankrollMetrics.roi < -0.1) {
      alerts.push({
        id: "roi-alert-1",
        severity: "critical",
        message: `ROI is negative (${(bankrollMetrics.roi * 100).toFixed(1)}%)`,
        recommendation: "Immediate action needed - review all bets and edge assumptions",
        timestamp: new Date(),
      });
    }

    // Positive feedback
    if (bankrollMetrics.roi > 0.1) {
      alerts.push({
        id: "positive-alert-1",
        severity: "info",
        message: `Excellent ROI (${(bankrollMetrics.roi * 100).toFixed(1)}%) - on track for growth`,
        recommendation: "Maintain current strategy and consider increasing bet sizes gradually",
        timestamp: new Date(),
      });
    }

    // Notify owner of critical alerts
    const criticalAlerts = alerts.filter((a) => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      await notifyOwner({
        title: "Critical Bankroll Alert",
        content: `${criticalAlerts.length} critical bankroll alert(s) detected. Check the platform for details.`,
      });
    }

    return alerts;
  } catch (error) {
    console.error("[BankrollHealth] Error checking bankroll:", error);
    return [];
  }
}

/**
 * Calculate bankroll statistics
 */
export interface BankrollStats {
  currentBankroll: number;
  initialBankroll: number;
  profit: number;
  roi: number;
  winRate: number;
  totalBets: number;
  winCount: number;
  lossCount: number;
}

/**
 * Get bankroll statistics
 */
export function calculateBankrollStats(
  currentBankroll: number,
  initialBankroll: number,
  winCount: number,
  lossCount: number
): BankrollStats {
  const totalBets = winCount + lossCount;
  const profit = currentBankroll - initialBankroll;
  const roi = initialBankroll > 0 ? profit / initialBankroll : 0;
  const winRate = totalBets > 0 ? winCount / totalBets : 0;

  return {
    currentBankroll,
    initialBankroll,
    profit,
    roi,
    winRate,
    totalBets,
    winCount,
    lossCount,
  };
}

/**
 * Get recommended Kelly multiplier based on performance
 */
export function getRecommendedKellyMultiplier(stats: BankrollStats): number {
  // Conservative: If losing, use 0.1-0.15
  if (stats.winRate < 0.45) {
    return 0.1;
  }

  // Moderate: If slightly profitable, use 0.25
  if (stats.roi < 0.1) {
    return 0.25;
  }

  // Aggressive: If very profitable, use 0.5
  if (stats.roi > 0.2) {
    return 0.5;
  }

  // Default: 0.25 (conservative)
  return 0.25;
}
