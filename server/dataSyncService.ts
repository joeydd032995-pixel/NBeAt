import { forceRefreshFromNBAAPI } from "./scrapers/scraperIntegration";

interface SyncResult {
  success: boolean;
  playersCount: number;
  teamsCount: number;
  message: string;
  timestamp: Date;
}

/**
 * Sync NBA data from official NBA API (real stats only)
 */
export async function performDataSync(): Promise<SyncResult> {
  try {
    console.log("[DataSync] Starting NBA data synchronization from NBA API...");
    
    // Use the real NBA API scraper (no fake data)
    const result = await forceRefreshFromNBAAPI();
    
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch stats from NBA API");
    }
    
    const message = `Successfully synced ${result.playersCount} players with real 2025-26 stats from NBA.com`;
    console.log(`[DataSync] ${message}`);
    
    // Notify owner of successful sync
    await notifyDataSyncCompletion(result.playersCount || 0, 30);
    
    return {
      success: true,
      playersCount: result.playersCount || 0,
      teamsCount: 30, // All NBA teams
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
