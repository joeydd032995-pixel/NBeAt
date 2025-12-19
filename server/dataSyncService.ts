import { syncNBAData } from "./nbaDataService";
import { createNotification } from "./db";
import { InsertNotification } from "../drizzle/schema";

interface SyncResult {
  success: boolean;
  playersCount: number;
  teamsCount: number;
  message: string;
  timestamp: Date;
}

/**
 * Sync NBA data from external sources
 */
export async function performDataSync(): Promise<SyncResult> {
  try {
    console.log("[DataSync] Starting NBA data synchronization...");
    
    const result = await syncNBAData();
    
    const message = `Successfully synced ${result.playersCount} players and ${result.teamsCount} teams from balldontlie API`;
    console.log(`[DataSync] ${message}`);
    
    // Notify owner of successful sync
    await notifyDataSyncCompletion(result.playersCount, result.teamsCount);
    
    return {
      success: true,
      playersCount: result.playersCount,
      teamsCount: result.teamsCount,
      message,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[DataSync] Error during data sync: ${errorMessage}`);
    
    // Notify owner of sync failure
    await notifyDataSyncFailure(errorMessage);
    
    return {
      success: false,
      playersCount: 0,
      teamsCount: 0,
      message: `Data sync failed: ${errorMessage}`,
      timestamp: new Date(),
    };
  }
}

/**
 * Notify owner of successful data sync
 */
async function notifyDataSyncCompletion(playersCount: number, teamsCount: number) {
  try {
    // This would be called by the owner notification system
    console.log(`[DataSync] Sync completed: ${playersCount} players, ${teamsCount} teams`);
  } catch (error) {
    console.error("[DataSync] Failed to send completion notification:", error);
  }
}

/**
 * Notify owner of sync failure
 */
async function notifyDataSyncFailure(error: string) {
  try {
    // This would be called by the owner notification system
    console.log(`[DataSync] Sync failed with error: ${error}`);
  } catch (err) {
    console.error("[DataSync] Failed to send failure notification:", err);
  }
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime(): Date | null {
  // This would typically be stored in a settings table
  // For now, returning null means sync has never been run
  return null;
}

/**
 * Check if sync is needed based on time elapsed
 */
export function isSyncNeeded(lastSyncTime: Date | null, intervalHours: number = 24): boolean {
  if (!lastSyncTime) return true;
  
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceSync >= intervalHours;
}
