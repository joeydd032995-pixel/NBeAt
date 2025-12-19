import { performDataSync } from "./dataSyncService";

/**
 * Cron job configuration for automated tasks
 * These should be triggered by Vercel Cron or external scheduler
 */

interface CronJobConfig {
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  enabled: boolean;
}

/**
 * Daily data refresh job - runs at 6 AM CST
 */
export const dailyDataRefreshJob: CronJobConfig = {
  name: "daily-data-refresh",
  schedule: "0 6 * * *", // 6 AM every day
  handler: async () => {
    console.log("[CronJob] Starting daily data refresh...");
    try {
      const result = await performDataSync();
      if (result.success) {
        console.log(`[CronJob] Daily refresh completed: ${result.message}`);
      } else {
        console.error(`[CronJob] Daily refresh failed: ${result.message}`);
      }
    } catch (error) {
      console.error("[CronJob] Error in daily data refresh:", error);
    }
  },
  enabled: true,
};

/**
 * High-EV opportunity detection job - runs every 2 hours
 */
export const evOpportunityDetectionJob: CronJobConfig = {
  name: "ev-opportunity-detection",
  schedule: "0 */2 * * *", // Every 2 hours
  handler: async () => {
    console.log("[CronJob] Starting EV opportunity detection...");
    try {
      const { detectHighEVOpportunities } = await import("./evDetectionService");
      const opportunities = await detectHighEVOpportunities();
      
      if (opportunities.length > 0) {
        console.log(`[CronJob] Found ${opportunities.length} high-EV opportunities`);
        // Notifications will be sent by the detection service
      } else {
        console.log("[CronJob] No high-EV opportunities found");
      }
    } catch (error) {
      console.error("[CronJob] Error in EV opportunity detection:", error);
    }
  },
  enabled: true,
};

/**
 * Bankroll health check job - runs daily at 8 AM CST
 */
export const bankrollHealthCheckJob: CronJobConfig = {
  name: "bankroll-health-check",
  schedule: "0 8 * * *", // 8 AM every day
  handler: async () => {
    console.log("[CronJob] Starting bankroll health check...");
    try {
      const { checkBankrollHealth } = await import("./bankrollHealthService");
      const alerts = await checkBankrollHealth();
      
      if (alerts.length > 0) {
        console.log(`[CronJob] Generated ${alerts.length} bankroll alerts`);
      }
    } catch (error) {
      console.error("[CronJob] Error in bankroll health check:", error);
    }
  },
  enabled: true,
};

/**
 * Get all enabled cron jobs
 */
export function getEnabledCronJobs(): CronJobConfig[] {
  return [
    dailyDataRefreshJob,
    evOpportunityDetectionJob,
    bankrollHealthCheckJob,
  ].filter((job) => job.enabled);
}

/**
 * Execute a cron job manually
 */
export async function executeCronJob(jobName: string): Promise<boolean> {
  const jobs = getEnabledCronJobs();
  const job = jobs.find((j) => j.name === jobName);
  
  if (!job) {
    console.error(`[CronJob] Job not found: ${jobName}`);
    return false;
  }
  
  try {
    console.log(`[CronJob] Manually executing: ${jobName}`);
    await job.handler();
    return true;
  } catch (error) {
    console.error(`[CronJob] Error executing ${jobName}:`, error);
    return false;
  }
}
