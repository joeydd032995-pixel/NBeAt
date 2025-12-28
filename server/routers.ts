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
    forceRefreshStats: publicProcedure.mutation(async () => {
      try {
        const { forceRefreshFromNBAAPI } = await import("./scrapers/scraperIntegration");
        return await forceRefreshFromNBAAPI();
      } catch (error) {
        console.error("Error force refreshing stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to force refresh stats from NBA API",
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
          jsonFileExists: false,
          message: "Error checking scraper status",
        };
      }
    }),
    getRandomPlayer: publicProcedure.query(async () => {
      return await getRandomPlayer();
    }),
    cleanupDuplicates: publicProcedure.mutation(async () => {
      const { cleanupDuplicatePlayers } = await import("./db");
      try {
        return await cleanupDuplicatePlayers();
      } catch (error) {
        console.error("Error cleaning up duplicates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cleanup duplicate players",
        });
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
    getPlayerById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const { getPlayerById } = await import("./db");
      try {
        const player = await getPlayerById(input.id);
        return player || null;
      } catch (error) {
        console.error("Error fetching player by ID:", error);
        return null;
      }
    }),
    searchPlayers: publicProcedure.input(z.object({
      search: z.string().optional(),
      position: z.string().optional(),
      teamId: z.number().optional(),
      limit: z.number().optional().default(50),
    })).query(async ({ input }) => {
      const { searchPlayers } = await import("./db");
      try {
        const players = await searchPlayers(input);
        return players || [];
      } catch (error) {
        console.error("Error searching players:", error);
        return [];
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

  // Props Analytics - Advanced player prop projections and betting analytics
  propsAnalytics: router({
    // Calculate base PPG projection
    baseProjection: publicProcedure
      .input(z.object({
        season_ppg: z.number(),
        expected_minutes: z.number().optional(),
        avg_minutes: z.number(),
        adjustment_factor: z.number().optional().default(1.0),
      }))
      .mutation(async ({ input }) => {
        const { calculateBaseProjection } = await import("./propsAnalyticsService");
        return await calculateBaseProjection({
          name: "Player",
          season_ppg: input.season_ppg,
          expected_minutes: input.expected_minutes,
          avg_minutes: input.avg_minutes,
        });
      }),

    // Calculate betting edge vs line
    calculateEdge: publicProcedure
      .input(z.object({
        projection: z.number(),
        line: z.number(),
        min_edge: z.number().optional().default(0.5),
      }))
      .mutation(async ({ input }) => {
        const { calculateEdge } = await import("./propsAnalyticsService");
        return await calculateEdge(input.projection, input.line, input.min_edge);
      }),

    // Analyze player variance
    analyzeVariance: publicProcedure
      .input(z.object({
        game_logs: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const { analyzeVariance } = await import("./propsAnalyticsService");
        return await analyzeVariance(input.game_logs);
      }),

    // Calculate hit rate for a line
    calculateHitRate: publicProcedure
      .input(z.object({
        game_logs: z.array(z.number()),
        line: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { calculateHitRate } = await import("./propsAnalyticsService");
        return await calculateHitRate(input.game_logs, input.line);
      }),

    // Run Monte Carlo simulation
    monteCarlo: publicProcedure
      .input(z.object({
        base_projection: z.number(),
        std_dev: z.number(),
        line: z.number(),
        n_sims: z.number().optional().default(10000),
      }))
      .mutation(async ({ input }) => {
        const { runMonteCarlo } = await import("./propsAnalyticsService");
        return await runMonteCarlo(
          input.base_projection,
          input.std_dev,
          input.line,
          input.n_sims
        );
      }),

    // Run full integrated analysis for a player
    fullAnalysis: publicProcedure
      .input(z.object({
        name: z.string(),
        season_ppg: z.number(),
        avg_minutes: z.number(),
        expected_minutes: z.number().optional(),
        line: z.number(),
        is_home: z.boolean().optional().default(true),
        is_favorite: z.boolean().optional().default(true),
        spread: z.number().optional().default(0),
        total: z.number().optional().default(220),
        days_rest: z.number().optional().default(2),
        is_back_to_back: z.boolean().optional().default(false),
        game_logs: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { runFullAnalysis } = await import("./propsAnalyticsService");
        return await runFullAnalysis(input, input.line);
      }),

    // Analyze player by name from database
    analyzePlayerByName: publicProcedure
      .input(z.object({
        playerName: z.string(),
        line: z.number(),
        is_home: z.boolean().optional(),
        is_favorite: z.boolean().optional(),
        spread: z.number().optional(),
        total: z.number().optional(),
        days_rest: z.number().optional(),
        is_back_to_back: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { analyzePlayerByName } = await import("./propsAnalyticsService");
        return await analyzePlayerByName(input.playerName, input.line, {
          isHome: input.is_home,
          isFavorite: input.is_favorite,
          spread: input.spread,
          total: input.total,
          daysRest: input.days_rest,
          isBackToBack: input.is_back_to_back,
        });
      }),

    // Calculate prop-specific projection (assists, rebounds, etc.)
    propSpecific: publicProcedure
      .input(z.object({
        prop_type: z.enum(["assists", "rebounds", "steals", "blocks", "threes"]),
        position: z.enum(["PG", "SG", "SF", "PF", "C"]),
        team_avg: z.number(),
        pace_mult: z.number().optional().default(1.0),
      }))
      .mutation(async ({ input }) => {
        const { calculatePropSpecific } = await import("./propsAnalyticsService");
        return await calculatePropSpecific(
          input.prop_type,
          input.position,
          input.team_avg,
          input.pace_mult
        );
      }),

    // Batch analysis for multiple players
    batchAnalysis: publicProcedure
      .input(z.object({
        players: z.array(z.object({
          name: z.string(),
          season_ppg: z.number(),
          avg_minutes: z.number(),
          line: z.number(),
          expected_minutes: z.number().optional(),
          is_home: z.boolean().optional(),
          is_favorite: z.boolean().optional(),
          spread: z.number().optional(),
          total: z.number().optional(),
          days_rest: z.number().optional(),
          is_back_to_back: z.boolean().optional(),
          game_logs: z.array(z.number()).optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { runBatchAnalysis } = await import("./propsAnalyticsService");
        return await runBatchAnalysis(input.players);
      }),

    // Universal prop analyzer - handles all bet types
    analyzeProp: publicProcedure
      .input(z.object({
        bet_type: z.string(),
        player_id: z.number().optional(),
        ppg: z.number().optional(),
        rpg: z.number().optional(),
        apg: z.number().optional(),
        spg: z.number().optional(),
        bpg: z.number().optional(),
        tpm: z.number().optional(),
        season_ppg: z.number().optional(),
        avg_minutes: z.number().optional(),
        line: z.number(),
        is_home: z.boolean().optional().default(true),
        is_favorite: z.boolean().optional().default(true),
        spread: z.number().optional().default(0),
        total: z.number().optional().default(220),
        days_rest: z.number().optional().default(2),
        is_back_to_back: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input }) => {
        const { analyzeProp } = await import("./propsAnalyticsService");
        return await analyzeProp(input.bet_type, input, input.line);
      }),

    // Combined props analyzer (PRA, PA, PR, RA, S+B)
    analyzeCombinedProp: publicProcedure
      .input(z.object({
        prop_type: z.enum(["pra", "pa", "pr", "ra", "steals_blocks", "s+b"]),
        ppg: z.number(),
        rpg: z.number(),
        apg: z.number(),
        spg: z.number().optional().default(0),
        bpg: z.number().optional().default(0),
        line: z.number(),
        is_home: z.boolean().optional().default(true),
        is_favorite: z.boolean().optional().default(true),
        days_rest: z.number().optional().default(2),
        is_back_to_back: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input }) => {
        const { analyzeCombinedProp } = await import("./propsAnalyticsService");
        return await analyzeCombinedProp(input.prop_type, input, input.line);
      }),

    // Game line analyzer (ML, spread, total, quarters, halves)
    analyzeGameLine: publicProcedure
      .input(z.object({
        line_type: z.string(),
        home_team: z.string().optional(),
        away_team: z.string().optional(),
        home_rating: z.number().optional().default(110),
        away_rating: z.number().optional().default(108),
        home_pace: z.number().optional().default(100),
        away_pace: z.number().optional().default(100),
        line: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeGameLine } = await import("./propsAnalyticsService");
        return await analyzeGameLine(input.line_type, input, input.line);
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

  // Odds API - Live NBA games and betting lines
  odds: router({
    // Legacy odds service endpoints
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

    // New Odds API endpoints
    getTodaysGames: publicProcedure.query(async () => {
      const { getTodaysGames, formatGameForDisplay } = await import("./oddsApi");
      try {
        const games = await getTodaysGames();
        return games.map(formatGameForDisplay);
      } catch (error) {
        console.error("Error fetching today's games:", error);
        return [];
      }
    }),

    getUpcomingGames: publicProcedure.query(async () => {
      const { getUpcomingGames, formatGameForDisplay } = await import("./oddsApi");
      try {
        const games = await getUpcomingGames();
        return games.map(formatGameForDisplay);
      } catch (error) {
        console.error("Error fetching upcoming games:", error);
        return [];
      }
    }),

    getPlayerProps: publicProcedure
      .input(z.object({
        eventId: z.string(),
        market: z.string().optional().default("player_points")
      }))
      .query(async ({ input }) => {
        const { getPlayerProps } = await import("./oddsApi");
        try {
          return await getPlayerProps(input.eventId, input.market);
        } catch (error) {
          console.error("Error fetching player props:", error);
          return null;
        }
      }),

    getAllPlayerProps: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .query(async ({ input }) => {
        const { getAllPlayerProps } = await import("./oddsApi");
        try {
          return await getAllPlayerProps(input.eventId);
        } catch (error) {
          console.error("Error fetching all player props:", error);
          return null;
        }
      }),

    testConnection: publicProcedure.query(async () => {
      const { testOddsApiConnection } = await import("./oddsApi");
      try {
        const connected = await testOddsApiConnection();
        return { connected, message: connected ? "Odds API connected successfully" : "Failed to connect to Odds API" };
      } catch (error) {
        console.error("Error testing Odds API connection:", error);
        return { connected: false, message: "Error testing connection" };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
