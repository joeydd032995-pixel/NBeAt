import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Start background real-time sync on server startup
setTimeout(async () => {
  try {
    const { syncESPNLiveStats } = await import("./espnLiveStatsService");
    console.log("[Server] Starting initial real-time stats sync...");
    await syncESPNLiveStats();
    
    // Schedule updates every 6 hours
    setInterval(async () => {
      try {
        console.log("[Server] Running scheduled real-time stats sync...");
        await syncESPNLiveStats();
      } catch (error) {
        console.error("[Server] Scheduled sync error:", error);
      }
    }, 6 * 60 * 60 * 1000);
  } catch (error) {
    console.error("[Server] Failed to start real-time sync:", error);
  }
}, 5000);

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // NBA Data Management
  nba: router({
    syncData: publicProcedure.mutation(async () => {
      const { syncESPNLiveStats } = await import("./espnLiveStatsService");
      try {
        return await syncESPNLiveStats();
      } catch (error) {
        console.error("Error syncing real-time stats:", error);
        // Fallback to mock data
        try {
          const { generateMockData } = await import("./mockDataGenerator");
          return await generateMockData();
        } catch (mockError) {
          console.error("Error generating mock data fallback:", mockError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to sync data",
          });
        }
      }
    }),
    syncESPNData: publicProcedure.mutation(async () => {
      const { syncESPNData } = await import("./espnDataService");
      try {
        return await syncESPNData();
      } catch (error) {
        console.error("Error syncing ESPN data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync ESPN data",
        });
      }
    }),
    syncMockData: publicProcedure.mutation(async () => {
      const { generateMockData } = await import("./mockDataGenerator");
      try {
        return await generateMockData();
      } catch (error) {
        console.error("Error generating mock data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate mock data",
        });
      }
    }),
    getAllPlayers: publicProcedure.query(async () => {
      const { getAllPlayers } = await import("./db");
      try {
        const players = await getAllPlayers();
        return players || [];
      } catch (error) {
        console.error("Error fetching players:", error);
        return [];
      }
    }),
    getPlayerByName: publicProcedure.input(z.object({ name: z.string() })).query(async ({ input }) => {
      const { getPlayerByName } = await import("./db");
      try {
        const player = await getPlayerByName(input.name);
        return player || null;
      } catch (error) {
        console.error("Error fetching player:", error);
        return null;
      }
    }),
    getAllTeams: publicProcedure.query(async () => {
      const { getAllTeams } = await import("./db");
      try {
        const teams = await getAllTeams();
        return teams || [];
      } catch (error) {
        console.error("Error fetching teams:", error);
        return [];
      }
    }),
    getSyncStatus: publicProcedure.query(async () => {
      try {
        const { getLastUpdateTime, isUpdateInProgress } = await import("./espnLiveStatsService");
        const lastUpdate = getLastUpdateTime();
        const updating = isUpdateInProgress();
        return {
          lastSync: lastUpdate,
          needsSync: !lastUpdate,
          message: updating ? "Updating..." : lastUpdate ? `Last updated: ${lastUpdate.toLocaleString()}` : "Never synced",
        };
      } catch (error) {
        console.error("Error getting sync status:", error);
        return {
          lastSync: null,
          needsSync: true,
          message: "Error checking sync status",
        };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
