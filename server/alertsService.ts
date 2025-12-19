import { getDb } from "./db";
import { alerts, players, type Alert, type InsertAlert } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export interface AlertTrigger {
  alertId: number;
  playerName: string;
  alertType: string;
  threshold: number;
  actualValue: number;
  message: string;
  triggeredAt: Date;
}

/**
 * Create a new custom alert
 */
export async function createAlert(userId: number, alertData: Omit<InsertAlert, "userId">): Promise<Alert | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.insert(alerts).values({
    ...alertData,
    userId
  });
  
  // Fetch the most recently created alert for this user
  const createdAlerts = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId));
  
  // Return the most recent one
  return createdAlerts[createdAlerts.length - 1] || null;
}

/**
 * Get all alerts for a user
 */
export async function getUserAlerts(userId: number): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId));
}

/**
 * Update an alert
 */
export async function updateAlert(alertId: number, userId: number, updates: Partial<InsertAlert>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .update(alerts)
    .set(updates)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)));
  
  return true;
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .delete(alerts)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)));
  
  return true;
}

/**
 * Toggle alert active status
 */
export async function toggleAlert(alertId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Get current status
  const currentAlerts = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .limit(1);
  
  if (currentAlerts.length === 0) return false;
  
  const newStatus = currentAlerts[0].isActive === 1 ? 0 : 1;
  
  await db
    .update(alerts)
    .set({ isActive: newStatus })
    .where(eq(alerts.id, alertId));
  
  return true;
}

/**
 * Check if an alert should be triggered based on player stats
 */
async function checkAlertCondition(alert: Alert, playerStats: any): Promise<boolean> {
  const threshold = parseFloat(alert.threshold);
  let actualValue = 0;
  
  // Get the stat value based on alert type
  switch (alert.alertType) {
    case "points":
      actualValue = parseFloat(playerStats.ppg || "0");
      break;
    case "rebounds":
      actualValue = parseFloat(playerStats.rpg || "0");
      break;
    case "assists":
      actualValue = parseFloat(playerStats.apg || "0");
      break;
    default:
      return false;
  }
  
  // Check condition
  switch (alert.condition) {
    case "greater_than":
      return actualValue > threshold;
    case "less_than":
      return actualValue < threshold;
    case "equals":
      return Math.abs(actualValue - threshold) < 0.1;
    default:
      return false;
  }
}

/**
 * Check all active alerts and trigger notifications
 */
export async function checkAllAlerts(): Promise<AlertTrigger[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Get all active alerts
  const activeAlerts = await db
    .select()
    .from(alerts)
    .where(eq(alerts.isActive, 1));
  
  const triggers: AlertTrigger[] = [];
  
  for (const alert of activeAlerts) {
    // Get player stats
    const playerResults = await db
      .select()
      .from(players)
      .limit(100);
    
    const matchingPlayers = playerResults.filter(p => p.fullName === alert.playerName);
    
    if (matchingPlayers.length === 0) continue;
    
    const player = matchingPlayers[0];
    
    // Check if alert condition is met
    const shouldTrigger = await checkAlertCondition(alert, player);
    
    if (shouldTrigger) {
      let actualValue = 0;
      let statName = "";
      
      switch (alert.alertType) {
        case "points":
          actualValue = parseFloat(player.ppg || "0");
          statName = "PPG";
          break;
        case "rebounds":
          actualValue = parseFloat(player.rpg || "0");
          statName = "RPG";
          break;
        case "assists":
          actualValue = parseFloat(player.apg || "0");
          statName = "APG";
          break;
      }
      
      const message = `${alert.playerName} ${statName}: ${actualValue} (threshold: ${alert.threshold})`;
      
      triggers.push({
        alertId: alert.id,
        playerName: alert.playerName,
        alertType: alert.alertType,
        threshold: parseFloat(alert.threshold),
        actualValue,
        message,
        triggeredAt: new Date()
      });
      
      // Update last triggered timestamp
      await db
        .update(alerts)
        .set({ lastTriggered: new Date() })
        .where(eq(alerts.id, alert.id));
      
      // Send notification to owner
      await notifyOwner({
        title: `Alert Triggered: ${alert.playerName}`,
        content: message
      });
    }
  }
  
  return triggers;
}

/**
 * Get recently triggered alerts
 */
export async function getRecentTriggers(userId: number, limit: number = 10): Promise<Alert[]> {
  const db = await getDb();
  if (!db) return [];
  
  const userAlerts = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId));
  
  // Filter and sort by last triggered
  return userAlerts
    .filter(a => a.lastTriggered !== null)
    .sort((a, b) => {
      const aTime = a.lastTriggered?.getTime() || 0;
      const bTime = b.lastTriggered?.getTime() || 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}
