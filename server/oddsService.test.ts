import { describe, it, expect } from "vitest";
import { verifyOddsAPIKey, fetchNBAOdds } from "./oddsService";

describe("Odds API Integration", () => {
  it("should verify Odds API key is valid", async () => {
    const isValid = await verifyOddsAPIKey();
    expect(isValid).toBe(true);
  }, 10000); // 10 second timeout for API call

  it("should fetch NBA odds successfully", async () => {
    const games = await fetchNBAOdds();
    expect(Array.isArray(games)).toBe(true);
    
    if (games.length > 0) {
      const game = games[0];
      expect(game).toHaveProperty("id");
      expect(game).toHaveProperty("home_team");
      expect(game).toHaveProperty("away_team");
      expect(game).toHaveProperty("bookmakers");
      expect(Array.isArray(game.bookmakers)).toBe(true);
    }
  }, 10000);
});
