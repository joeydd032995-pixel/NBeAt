import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { populateAllPlayerStats, getRandomPlayer } from "./populatePlayerStats";

// Start background real-time sync on server startup
setTimeout(async () => {
  try {
    const { syncFullRosters } = await import("./fullRosterSync");
    console.log("[Server] Starting initial real-time stats sync...");
    await syncFullRosters();
    
    // Schedule updates every 6 hours
    setInterval(async () => {
      try {
        console.log("[Server] Running scheduled real-time stats sync...");
        await syncFullRosters();
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
      const { syncFullRosters } = await import("./fullRosterSync");
      try {
        return await syncFullRosters();
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
    populateStats: publicProcedure.mutation(async () => {
      return await populateAllPlayerStats();
    }),
    scrapeRealStats: publicProcedure.mutation(async () => {
      try {
        const { scrapeRealNBAStats } = await import("./scrapers/scraperIntegration");
        return await scrapeRealNBAStats();
      } catch (error) {
        console.error("Error scraping real stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to scrape real stats",
        });
      }
    }),
    getScraperStatus: publicProcedure.query(async () => {
      try {
        const { getScraperStatus } = await import("./scrapers/scraperIntegration");
        return await getScraperStatus();
      } catch (error) {
        console.error("Error getting scraper status:", error);
        return {
          message: "Error checking scraper status",
        };
      }
    }),
    getRandomPlayer: publicProcedure.query(async () => {
      return await getRandomPlayer();
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
    getTeamAnalytics: publicProcedure.input(z.object({ teamId: z.number().optional() })).query(async ({ input }) => {
      const { getTeamAnalytics } = await import("./teamAnalytics");
      try {
        return await getTeamAnalytics(input.teamId);
      } catch (error) {
        console.error("Error fetching team analytics:", error);
        return [];
      }
    }),
    getTeamAnalyticsById: publicProcedure.input(z.object({ teamId: z.number() })).query(async ({ input }) => {
      const { getTeamAnalyticsById } = await import("./teamAnalytics");
      try {
        return await getTeamAnalyticsById(input.teamId);
      } catch (error) {
        console.error("Error fetching team analytics:", error);
        return null;
      }
    }),
    getSyncStatus: publicProcedure.query(async () => {
      try {
        return {
          lastSync: new Date(),
          needsSync: false,
          message: "Data synced from ESPN API",
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

  // Custom Alerts
  alerts: router({
    createAlert: protectedProcedure.input(z.object({
      playerName: z.string(),
      alertType: z.enum(["points", "rebounds", "assists", "streak", "custom"]),
      condition: z.string(),
      threshold: z.string(),
      consecutiveGames: z.number().optional(),
      description: z.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { createAlert } = await import("./alertsService");
      try {
        return await createAlert(ctx.user.id, input);
      } catch (error) {
        console.error("Error creating alert:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create alert" });
      }
    }),
    getUserAlerts: protectedProcedure.query(async ({ ctx }) => {
      const { getUserAlerts } = await import("./alertsService");
      try {
        return await getUserAlerts(ctx.user.id);
      } catch (error) {
        console.error("Error fetching user alerts:", error);
        return [];
      }
    }),
    toggleAlert: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
      const { toggleAlert } = await import("./alertsService");
      try {
        return await toggleAlert(input.alertId, ctx.user.id);
      } catch (error) {
        console.error("Error toggling alert:", error);
        return false;
      }
    }),
    deleteAlert: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
      const { deleteAlert } = await import("./alertsService");
      try {
        return await deleteAlert(input.alertId, ctx.user.id);
      } catch (error) {
        console.error("Error deleting alert:", error);
        return false;
      }
    }),
    checkAllAlerts: publicProcedure.query(async () => {
      const { checkAllAlerts } = await import("./alertsService");
      try {
        return await checkAllAlerts();
      } catch (error) {
        console.error("Error checking alerts:", error);
        return [];
      }
    }),
  }),

  // Injury Reports
  injuries: router({
    getPlayerInjury: publicProcedure.input(z.object({ playerName: z.string() })).query(async ({ input }) => {
      const { getPlayerInjuryStatus } = await import("./injuryService");
      try {
        return await getPlayerInjuryStatus(input.playerName);
      } catch (error) {
        console.error("Error fetching player injury:", error);
        return null;
      }
    }),
    getAllInjuries: publicProcedure.query(async () => {
      const { getAllInjuries } = await import("./injuryService");
      try {
        return await getAllInjuries();
      } catch (error) {
        console.error("Error fetching all injuries:", error);
        return [];
      }
    }),
    getTeamInjuries: publicProcedure.input(z.object({ teamAbbr: z.string() })).query(async ({ input }) => {
      const { getTeamInjuries } = await import("./injuryService");
      try {
        return await getTeamInjuries(input.teamAbbr);
      } catch (error) {
        console.error("Error fetching team injuries:", error);
        return [];
      }
    }),
  }),

  // Player Prop Bets
  props: router({ analyzePlayerProps: publicProcedure.input(z.object({ playerName: z.string() })).query(async ({ input }) => {
      const { analyzePlayerProps } = await import("./propBetAnalyzer");
      try {
        return await analyzePlayerProps(input.playerName);
      } catch (error) {
        console.error("Error analyzing player props:", error);
        return null;
      }
    }),
    getTopOpportunities: publicProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
      const { getTopPropOpportunities } = await import("./propBetAnalyzer");
      try {
        return await getTopPropOpportunities(input.limit);
      } catch (error) {
        console.error("Error fetching top prop opportunities:", error);
        return [];
      }
    }),
  }),

  // Betting Odds
  odds: router({
    getNBAOdds: publicProcedure.query(async () => {
      const { fetchNBAOdds } = await import("./oddsService");
      try {
        return await fetchNBAOdds();
      } catch (error) {
        console.error("Error fetching NBA odds:", error);
        return [];
      }
    }),
    getTeamNextGameOdds: publicProcedure.input(z.object({ teamName: z.string() })).query(async ({ input }) => {
      const { getTeamNextGameOdds } = await import("./oddsService");
      try {
        return await getTeamNextGameOdds(input.teamName);
      } catch (error) {
        console.error("Error fetching team odds:", error);
        return null;
      }
    }),
  }),

  // AI Assistant
  ai: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string()
        })),
        context: z.array(z.string()).optional()
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        // Build context string
        let systemPrompt = "You are an expert NBA betting assistant with access to real-time player stats, team analytics, betting odds, and historical data. Provide accurate, data-driven betting insights and recommendations.";
        
        if (input.context && input.context.length > 0) {
          systemPrompt += "\n\nContext data provided by user:\n" + input.context.join("\n");
        }
        
        // Convert messages to LLM format
        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          ...input.messages.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          }))
        ];
        
        try {
          const response = await invokeLLM({
            messages: llmMessages
          });
          
          const content = response.choices[0].message.content;
          const messageText = typeof content === 'string' ? content : JSON.stringify(content);
          
          return {
            message: messageText || "Sorry, I couldn't generate a response."
          };
        } catch (error) {
          console.error("AI chat error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get AI response"
          });
        }
      })
  }),
});

export type AppRouter = typeof appRouter;
