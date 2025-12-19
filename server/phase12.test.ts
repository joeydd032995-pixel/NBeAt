import { describe, it, expect } from "vitest";
import { analyzePlayerProps, getTopPropOpportunities } from "./propBetAnalyzer";
import { getPlayerInjuryStatus, getAllInjuries } from "./injuryService";
import { createAlert, getUserAlerts, toggleAlert, deleteAlert } from "./alertsService";

describe("Player Prop Bet Analyzer", () => {
  it("should analyze player props and return recommendations", async () => {
    const analysis = await analyzePlayerProps("Luka Dončić");
    
    expect(analysis).toBeDefined();
    if (analysis) {
      expect(analysis.player).toBeDefined();
      expect(analysis.player.fullName).toBe("Luka Dončić");
      expect(analysis.props).toHaveLength(3); // Points, rebounds, assists
      
      // Check prop structure
      const pointsProp = analysis.props.find(p => p.propType === "points");
      expect(pointsProp).toBeDefined();
      if (pointsProp) {
        expect(pointsProp.line).toBeGreaterThan(0);
        expect(pointsProp.hitRate).toBeGreaterThanOrEqual(0);
        expect(pointsProp.hitRate).toBeLessThanOrEqual(100);
        expect(pointsProp.seasonHitRate).toBeGreaterThanOrEqual(0);
        expect(pointsProp.seasonHitRate).toBeLessThanOrEqual(100);
        expect(["OVER", "UNDER", "NEUTRAL"]).toContain(pointsProp.recommendation);
        expect(["HIGH", "MEDIUM", "LOW"]).toContain(pointsProp.confidence);
      }
    }
  }, 30000);

  it("should get top prop opportunities", async () => {
    const opportunities = await getTopPropOpportunities(5);
    
    expect(Array.isArray(opportunities)).toBe(true);
    expect(opportunities.length).toBeLessThanOrEqual(5);
    
    if (opportunities.length > 0) {
      const firstOpp = opportunities[0];
      expect(firstOpp.playerName).toBeDefined();
      expect(firstOpp.propType).toBeDefined();
      expect(firstOpp.line).toBeGreaterThan(0);
      expect(["HIGH", "MEDIUM"]).toContain(firstOpp.confidence);
    }
  }, 60000);

  it("should calculate hit rates correctly", async () => {
    const analysis = await analyzePlayerProps("Stephen Curry");
    
    if (analysis) {
      for (const prop of analysis.props) {
        // Hit rate should be reasonable based on season average vs line
        if (prop.seasonAverage > prop.line) {
          expect(prop.hitRate).toBeGreaterThan(50);
        } else if (prop.seasonAverage < prop.line) {
          expect(prop.hitRate).toBeLessThan(50);
        }
      }
    }
  }, 30000);
});

describe("Injury Report Integration", () => {
  it("should fetch player injury status", async () => {
    const injury = await getPlayerInjuryStatus("LeBron James");
    
    expect(injury).toBeDefined();
    if (injury) {
      expect(injury.playerName).toBe("LeBron James");
      expect(injury.status).toBeDefined();
      expect(["OUT", "QUESTIONABLE", "DOUBTFUL", "DAY_TO_DAY", "HEALTHY"]).toContain(injury.status);
      expect(injury.injuryType).toBeDefined();
      expect(injury.description).toBeDefined();
    }
  }, 15000);

  it("should return healthy status for non-injured players", async () => {
    const injury = await getPlayerInjuryStatus("Random Player Name");
    
    expect(injury).toBeDefined();
    if (injury) {
      expect(injury.status).toBe("HEALTHY");
      expect(injury.injuryType).toBe("None");
    }
  }, 15000);

  it("should fetch all injuries", async () => {
    const injuries = await getAllInjuries();
    
    expect(Array.isArray(injuries)).toBe(true);
    // Injuries list may be empty if no current injuries
    if (injuries.length > 0) {
      const firstInjury = injuries[0];
      expect(firstInjury.playerName).toBeDefined();
      expect(firstInjury.status).toBeDefined();
      expect(firstInjury.team).toBeDefined();
    }
  }, 15000);
});

describe("Custom Alerts System", () => {
  const testUserId = 999; // Test user ID
  
  it("should create a new alert", async () => {
    const alert = await createAlert(testUserId, {
      playerName: "Stephen Curry",
      alertType: "points",
      condition: "greater_than",
      threshold: "35",
      consecutiveGames: 3,
      description: "Notify when Curry scores 35+ in 3 straight games",
      isActive: 1
    });
    
    expect(alert).toBeDefined();
    if (alert) {
      expect(alert.playerName).toBe("Stephen Curry");
      expect(alert.alertType).toBe("points");
      expect(alert.threshold).toBe("35");
      expect(alert.isActive).toBe(1);
    }
  }, 15000);

  it("should get user alerts", async () => {
    const alerts = await getUserAlerts(testUserId);
    
    expect(Array.isArray(alerts)).toBe(true);
    // Should have at least the one we just created
    expect(alerts.length).toBeGreaterThan(0);
    
    const curryAlert = alerts.find(a => a.playerName === "Stephen Curry");
    expect(curryAlert).toBeDefined();
  }, 15000);

  it("should toggle alert status", async () => {
    const alerts = await getUserAlerts(testUserId);
    if (alerts.length > 0) {
      const alertId = alerts[0].id;
      const originalStatus = alerts[0].isActive;
      
      const toggled = await toggleAlert(alertId, testUserId);
      expect(toggled).toBe(true);
      
      // Verify status changed
      const updatedAlerts = await getUserAlerts(testUserId);
      const updatedAlert = updatedAlerts.find(a => a.id === alertId);
      if (updatedAlert) {
        expect(updatedAlert.isActive).not.toBe(originalStatus);
      }
    }
  }, 15000);

  it("should delete an alert", async () => {
    const alertsBefore = await getUserAlerts(testUserId);
    if (alertsBefore.length > 0) {
      const alertId = alertsBefore[0].id;
      
      const deleted = await deleteAlert(alertId, testUserId);
      expect(deleted).toBe(true);
      
      const alertsAfter = await getUserAlerts(testUserId);
      const stillExists = alertsAfter.find(a => a.id === alertId);
      expect(stillExists).toBeUndefined();
    }
  }, 15000);
});
