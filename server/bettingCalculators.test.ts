import { describe, expect, it } from "vitest";
import {
  decimalToImpliedProb,
  americanToDecimal,
  decimalToAmerican,
  kellyFraction,
  calculateBetSuggestion,
  calculateEV,
  convertOdds,
  buildTickets1to9,
  calculateParlayOdds,
  calculateParlayProbability,
} from "./bettingCalculators";

describe("Odds Conversion", () => {
  it("converts decimal odds to implied probability", () => {
    expect(decimalToImpliedProb(2.0)).toBeCloseTo(0.5, 2);
    expect(decimalToImpliedProb(3.0)).toBeCloseTo(0.333, 2);
  });

  it("converts American odds to decimal odds", () => {
    expect(americanToDecimal(100)).toBeCloseTo(2.0, 1);
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
    expect(americanToDecimal(150)).toBeCloseTo(2.5, 1);
  });

  it("converts decimal odds to American odds", () => {
    expect(decimalToAmerican(2.0)).toBeCloseTo(100, 0);
    expect(decimalToAmerican(1.5)).toBeCloseTo(-200, 0);
    expect(decimalToAmerican(3.0)).toBeCloseTo(200, 0);
  });

  it("converts odds between all formats", () => {
    const result = convertOdds(2.5, "decimal");
    expect(result.decimal).toBe(2.5);
    expect(result.american).toBeCloseTo(150, 0);
    expect(result.implied).toBeCloseTo(40, 0);
  });
});

describe("Kelly Criterion", () => {
  it("calculates Kelly fraction correctly", () => {
    const fraction = kellyFraction(0.6, 2.5);
    expect(fraction).toBeGreaterThan(0);
    expect(fraction).toBeLessThan(1);
  });

  it("returns 0 for negative edge", () => {
    const fraction = kellyFraction(0.3, 2.0);
    expect(fraction).toBe(0);
  });

  it("calculates bet suggestion with Kelly multiplier", () => {
    const suggestion = calculateBetSuggestion(0.6, 2.5, 10000, 0.25);
    expect(suggestion.stake).toBeGreaterThan(0);
    expect(suggestion.stake).toBeLessThan(10000);
    expect(suggestion.evPercent).toBeGreaterThan(0);
  });
});

describe("Expected Value", () => {
  it("calculates positive EV correctly", () => {
    const ev = calculateEV(0.6, 2.5);
    expect(ev).toBeGreaterThan(0);
  });

  it("calculates negative EV correctly", () => {
    const ev = calculateEV(0.3, 2.0);
    expect(ev).toBeLessThan(0);
  });
});

describe("Parlay Calculations", () => {
  it("calculates combined parlay odds", () => {
    const legs = [{ odds: 2.0 }, { odds: 1.5 }, { odds: 2.5 }];
    const combinedOdds = calculateParlayOdds(legs);
    expect(combinedOdds).toBeCloseTo(7.5, 1);
  });

  it("calculates combined parlay probability", () => {
    const legs = [{ prob: 0.5 }, { prob: 0.6 }, { prob: 0.7 }];
    const combinedProb = calculateParlayProbability(legs);
    expect(combinedProb).toBeCloseTo(0.21, 2);
  });
});

describe("Ticket Builder", () => {
  it("builds Floor Parlay ticket when conditions are met", () => {
    const markets = [
      { type: "prop", description: "Player A over", odds: 1.8, prob: 0.85, ev: 0.1 },
      { type: "prop", description: "Player B over", odds: 1.9, prob: 0.82, ev: 0.08 },
      { type: "prop", description: "Player C over", odds: 1.7, prob: 0.88, ev: 0.12 },
    ];

    const tickets = buildTickets1to9(markets);
    const floorTicket = tickets.find((t) => t.name === "Floor Parlay");
    
    expect(floorTicket).toBeDefined();
    expect(floorTicket?.legs.length).toBe(3);
  });

  it("builds Sharp Spread ticket when spreads exist", () => {
    const markets = [
      { type: "spread", description: "Team A -5.5", odds: 1.9, prob: 0.6, ev: 0.15 },
      { type: "spread", description: "Team B +3.5", odds: 2.1, prob: 0.55, ev: 0.1 },
    ];

    const tickets = buildTickets1to9(markets);
    const sharpSpread = tickets.find((t) => t.name === "Sharp Spread");
    
    expect(sharpSpread).toBeDefined();
    expect(sharpSpread?.legs.length).toBe(1);
  });

  it("builds Chaos ticket when chaos markets exist", () => {
    const markets = [
      { type: "ml", description: "Underdog ML", odds: 3.5, prob: 0.35, ev: 0.2, variance: "chaos" },
      { type: "prop", description: "High variance prop", odds: 4.0, prob: 0.3, ev: 0.25, variance: "chaos" },
    ];

    const tickets = buildTickets1to9(markets);
    const chaosTicket = tickets.find((t) => t.name === "Chaos");
    
    expect(chaosTicket).toBeDefined();
  });
});
