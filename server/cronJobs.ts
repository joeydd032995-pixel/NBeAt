import cron, { ScheduledTask } from "node-cron";
import { performDataSync } from "./dataSyncService";

/**
 * Cron job configuration for automated tasks
 */

interface CronJobConfig {
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  enabled: boolean;
  task?: ScheduledTask;
}

/**
 * Daily data refresh job - runs at 6 AM CST (12:00 UTC)
 */
export const dailyDataRefreshJob: CronJobConfig = {
  name: "daily-data-refresh",
  schedule: "0 12 * * *", // 12:00 UTC = 6 AM CST
  handler: async () => {
    console.log("[CronJob] Starting daily data refresh from NBA API...");
    console.log("[CronJob] Time:", new Date().toISOString());
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
 * Bankroll health check job - runs daily at 8 AM CST (14:00 UTC)
 */
export const bankrollHealthCheckJob: CronJobConfig = {
  name: "bankroll-health-check",
  schedule: "0 14 * * *", // 14:00 UTC = 8 AM CST
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

// Store all job configs
const allJobs: CronJobConfig[] = [
  dailyDataRefreshJob,
  evOpportunityDetectionJob,
  bankrollHealthCheckJob,
];

/**
 * Initialize all cron jobs with node-cron
 */
export function initCronJobs(): void {
  console.log("[CronJob] Initializing scheduled jobs...");
  
  for (const job of allJobs) {
    if (!job.enabled) continue;
    
    // Stop existing task if any
    if (job.task) {
      job.task.stop();
    }
    
    // Schedule new task
    job.task = cron.schedule(job.schedule, job.handler, {
      timezone: "UTC"
    });
    
    console.log(`[CronJob] Scheduled: ${job.name} (${job.schedule})`);
  }
  
  console.log("[CronJob] All jobs initialized");
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs(): void {
  console.log("[CronJob] Stopping all scheduled jobs...");
  
  for (const job of allJobs) {
    if (job.task) {
      job.task.stop();
      job.task = undefined;
    }
  }
  
  console.log("[CronJob] All jobs stopped");
}

/**
 * Get all enabled cron jobs
 */
export function getEnabledCronJobs(): CronJobConfig[] {
  return allJobs.filter((job) => job.enabled);
}

/**
 * Execute a cron job manually
 */
export async function executeCronJob(jobName: string): Promise<boolean> {
  const job = allJobs.find((j) => j.name === jobName);
  
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

/**
 * Get cron job status
 */
export function getCronJobStatus(): Array<{
  name: string;
  schedule: string;
  enabled: boolean;
  isRunning: boolean;
}> {
  return allJobs.map((job) => ({
    name: job.name,
    schedule: job.schedule,
    enabled: job.enabled,
    isRunning: job.task !== undefined,
  }));
}
