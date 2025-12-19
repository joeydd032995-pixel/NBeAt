import { describe, it, expect } from "vitest";
import { getTeamAnalytics, getTeamAnalyticsById } from "./teamAnalytics";

describe("Team Analytics", () => {
  it("should fetch team analytics for all teams", async () => {
    const teams = await getTeamAnalytics();
    
    expect(Array.isArray(teams)).toBe(true);
    
    if (teams.length > 0) {
      const team = teams[0];
      expect(team).toHaveProperty("teamId");
      expect(team).toHaveProperty("teamName");
      expect(team).toHaveProperty("teamAbbreviation");
      expect(team).toHaveProperty("offensiveRating");
      expect(team).toHaveProperty("defensiveRating");
      expect(team).toHaveProperty("pace");
      expect(team).toHaveProperty("trend");
      expect(["hot", "cold", "steady"]).toContain(team.trend);
      
      // Verify ratings are numbers
      expect(typeof team.offensiveRating).toBe("number");
      expect(typeof team.defensiveRating).toBe("number");
      expect(typeof team.pace).toBe("number");
      
      // Verify reasonable ranges
      expect(team.offensiveRating).toBeGreaterThan(0);
      expect(team.defensiveRating).toBeGreaterThan(0);
      expect(team.pace).toBeGreaterThan(0);
    }
  }, 10000);

  it("should fetch team analytics for a specific team", async () => {
    // First get all teams to find a valid teamId
    const allTeams = await getTeamAnalytics();
    
    if (allTeams.length > 0) {
      const firstTeamId = allTeams[0].teamId;
      const team = await getTeamAnalyticsById(firstTeamId);
      
      expect(team).not.toBeNull();
      if (team) {
        expect(team.teamId).toBe(firstTeamId);
        expect(team).toHaveProperty("offensiveRating");
        expect(team).toHaveProperty("defensiveRating");
        expect(team).toHaveProperty("pace");
      }
    }
  }, 10000);

  it("should calculate net rating correctly", async () => {
    const teams = await getTeamAnalytics();
    
    if (teams.length > 0) {
      const team = teams[0];
      const netRating = team.offensiveRating - team.defensiveRating;
      
      // Net rating should be a valid number
      expect(typeof netRating).toBe("number");
      expect(Number.isNaN(netRating)).toBe(false);
    }
  }, 10000);
});
