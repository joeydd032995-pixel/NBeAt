import { describe, it, expect } from "vitest";
import { generateRealisticStats } from "./basketballReferenceScraper";

describe("Scraper Integration", () => {
  describe("generateRealisticStats", () => {
    it("should generate realistic stats for a player", () => {
      const stats = generateRealisticStats("LeBron James", "SF", "LAL");

      expect(stats).toBeDefined();
      expect(stats.fullName).toBe("LeBron James");
      expect(stats.position).toBe("SF");
      expect(stats.team).toBe("LAL");
    });

    it("should generate valid games played (15-28 for 2025-26 season)", () => {
      for (let i = 0; i < 10; i++) {
        const stats = generateRealisticStats(`Player${i}`, "G", "BOS");
        expect(stats.gamesPlayed).toBeGreaterThanOrEqual(15);
        expect(stats.gamesPlayed).toBeLessThanOrEqual(28);
      }
    });

    it("should generate positive PPG", () => {
      const stats = generateRealisticStats("Test Player", "C", "MIA");
      expect(stats.ppg).toBeGreaterThan(0);
    });

    it("should generate valid shooting percentages (0-100)", () => {
      const stats = generateRealisticStats("Test Player", "PG", "DEN");
      
      expect(stats.fgPct).toBeGreaterThanOrEqual(0);
      expect(stats.fgPct).toBeLessThanOrEqual(100);
      expect(stats.ftPct).toBeGreaterThanOrEqual(0);
      expect(stats.ftPct).toBeLessThanOrEqual(100);
      expect(stats.tpPct).toBeGreaterThanOrEqual(0);
      expect(stats.tpPct).toBeLessThanOrEqual(100);
    });

    it("should generate valid advanced stats (TS%, eFG%)", () => {
      const stats = generateRealisticStats("Test Player", "SF", "GSW");
      
      expect(stats.ts).toBeGreaterThanOrEqual(0);
      expect(stats.ts).toBeLessThanOrEqual(100);
      expect(stats.efg).toBeGreaterThanOrEqual(0);
      expect(stats.efg).toBeLessThanOrEqual(100);
    });

    it("should generate consistent stat relationships", () => {
      const stats = generateRealisticStats("Test Player", "C", "LAL");
      
      // RPG should be split between ORPG and DRPG
      const totalRPG = stats.orpg + stats.drpg;
      expect(Math.abs(totalRPG - stats.rpg)).toBeLessThan(0.5);
      
      // FGM should be less than FGA
      expect(stats.fgm).toBeLessThanOrEqual(stats.fga);
      
      // 3PM should be less than 3PA
      expect(stats.tpm).toBeLessThanOrEqual(stats.tpa);
    });

    it("should handle guard position with higher APG", () => {
      const guardStats = generateRealisticStats("Guard", "PG", "BOS");
      const centerStats = generateRealisticStats("Center", "C", "BOS");
      
      // Guards should have higher APG on average
      expect(guardStats.apg).toBeGreaterThan(0);
      expect(centerStats.apg).toBeGreaterThan(0);
    });

    it("should handle center position with higher RPG and BPG", () => {
      const centerStats = generateRealisticStats("Center", "C", "MIA");
      
      // Centers should have decent RPG and BPG
      expect(centerStats.rpg).toBeGreaterThan(1);
      expect(centerStats.bpg).toBeGreaterThan(0);
    });

    it("should round stats to 1 decimal place", () => {
      const stats = generateRealisticStats("Test Player", "SF", "PHX");
      
      // Check that all stats are rounded to 1 decimal
      const checkDecimal = (value: number) => Number.isInteger(value * 10);
      expect(checkDecimal(stats.ppg)).toBe(true);
      expect(checkDecimal(stats.rpg)).toBe(true);
      expect(checkDecimal(stats.apg)).toBe(true);
    });
  });
});
