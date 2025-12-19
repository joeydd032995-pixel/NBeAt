/**
 * Betting calculation utilities
 */

/**
 * Convert decimal odds to implied probability
 */
export function decimalToImpliedProb(odds: number): number {
  return 1.0 / odds;
}

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  } else {
    return 100 / Math.abs(americanOdds) + 1;
  }
}

/**
 * Convert decimal odds to American odds
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2.0) {
    return (decimalOdds - 1) * 100;
  } else {
    return -100 / (decimalOdds - 1);
  }
}

/**
 * Calculate Kelly Criterion fraction
 */
export function kellyFraction(probability: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  if (b <= 0 || probability <= 0) {
    return 0.0;
  }
  return Math.max(0.0, (probability * (b + 1) - 1) / b);
}

/**
 * Calculate bet suggestion using Kelly Criterion
 */
export function calculateBetSuggestion(
  probability: number,
  decimalOdds: number,
  bankroll: number,
  kellyMultiplier: number = 0.25
) {
  const f = kellyFraction(probability, decimalOdds) * kellyMultiplier;
  const stake = bankroll * f;
  const ev = probability * (decimalOdds - 1) - (1 - probability);

  return {
    stake: parseFloat(stake.toFixed(2)),
    kellyFraction: parseFloat(f.toFixed(4)),
    ev: parseFloat(ev.toFixed(4)),
    evPercent: parseFloat((ev * 100).toFixed(2)),
  };
}

/**
 * Calculate expected value
 */
export function calculateEV(probability: number, decimalOdds: number): number {
  return probability * (decimalOdds - 1) - (1 - probability);
}

/**
 * Convert odds between formats
 */
export function convertOdds(value: number, fromFormat: "decimal" | "american" | "implied") {
  let decimal: number;
  let american: number;
  let implied: number;

  if (fromFormat === "decimal") {
    decimal = value;
    american = decimalToAmerican(value);
    implied = decimalToImpliedProb(value);
  } else if (fromFormat === "american") {
    decimal = americanToDecimal(value);
    american = value;
    implied = decimalToImpliedProb(decimal);
  } else {
    // implied probability
    implied = value;
    decimal = 1 / value;
    american = decimalToAmerican(decimal);
  }

  return {
    decimal: parseFloat(decimal.toFixed(2)),
    american: parseFloat(american.toFixed(0)),
    implied: parseFloat((implied * 100).toFixed(2)),
  };
}

interface Market {
  type: string;
  description: string;
  odds: number;
  prob: number;
  ev?: number;
  variance?: string;
}

/**
 * Build tickets 1-9 structure per game
 */
export function buildTickets1to9(markets: Market[]) {
  const tickets: Array<{
    id: number;
    name: string;
    legs: Market[];
    combinedProb: number;
  }> = [];

  // Ticket 1: Floor (3 safest props, 80%+ each)
  const floorLegs = markets
    .filter((m) => m.prob >= 0.8)
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 3);

  if (floorLegs.length >= 3) {
    tickets.push({
      id: 1,
      name: "Floor Parlay",
      legs: floorLegs,
      combinedProb: parseFloat(
        (floorLegs[0].prob * floorLegs[1].prob * floorLegs[2].prob).toFixed(3)
      ),
    });
  }

  // Ticket 4: Sharp Spread (highest EV spread)
  const spreads = markets.filter((m) => m.type === "spread");
  if (spreads.length > 0) {
    const sharpSpread = spreads.reduce((max, m) => ((m.ev || 0) > (max.ev || 0) ? m : max));
    tickets.push({
      id: 4,
      name: "Sharp Spread",
      legs: [sharpSpread],
      combinedProb: sharpSpread.prob,
    });
  }

  // Ticket 7: Core Over (total + 2 props)
  const totals = markets.filter((m) => m.type === "total" && m.prob >= 0.55);
  const props = markets.filter((m) => m.type === "prop" && m.prob >= 0.6);

  if (totals.length > 0 && props.length >= 2) {
    tickets.push({
      id: 7,
      name: "Core Over",
      legs: [totals[0], props[0], props[1]],
      combinedProb: parseFloat((totals[0].prob * props[0].prob * props[1].prob).toFixed(3)),
    });
  }

  // Ticket 9: Chaos (underdog ML + high variance props)
  const chaosLegs = markets
    .filter((m) => m.variance === "chaos")
    .sort((a, b) => (b.ev || 0) - (a.ev || 0))
    .slice(0, 3);

  if (chaosLegs.length >= 2) {
    const prob1 = chaosLegs[0]?.prob || 0.3;
    const prob2 = chaosLegs[1]?.prob || 0.3;
    tickets.push({
      id: 9,
      name: "Chaos",
      legs: chaosLegs,
      combinedProb: parseFloat((prob1 * prob2).toFixed(3)),
    });
  }

  return tickets;
}

/**
 * Calculate parlay combined odds
 */
export function calculateParlayOdds(legs: Array<{ odds: number }>): number {
  return legs.reduce((acc, leg) => acc * leg.odds, 1);
}

/**
 * Calculate parlay combined probability
 */
export function calculateParlayProbability(legs: Array<{ prob: number }>): number {
  return legs.reduce((acc, leg) => acc * leg.prob, 1);
}
