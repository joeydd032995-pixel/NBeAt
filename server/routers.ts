import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

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
      const { syncNBAData } = await import("./nbaDataService");
      return await syncNBAData();
    }),
    getAllPlayers: publicProcedure.query(async () => {
      const { getAllPlayers } = await import("./db");
      return await getAllPlayers();
    }),
    getPlayerByName: publicProcedure.input(z.object({ name: z.string() })).query(async ({ input }) => {
      const { getPlayerByName } = await import("./db");
      return await getPlayerByName(input.name);
    }),
    getAllTeams: publicProcedure.query(async () => {
      const { getAllTeams } = await import("./db");
      return await getAllTeams();
    }),
  }),

  // Betting Calculators
  betting: router({
    calculateKelly: publicProcedure
      .input(
        z.object({
          probability: z.number().min(0).max(1),
          decimalOdds: z.number().min(1),
          bankroll: z.number().min(0),
          kellyMultiplier: z.number().min(0).max(1).default(0.25),
        })
      )
      .mutation(({ input }) => {
        const { calculateBetSuggestion } = require("./bettingCalculators");
        return calculateBetSuggestion(
          input.probability,
          input.decimalOdds,
          input.bankroll,
          input.kellyMultiplier
        );
      }),
    
    calculateEV: publicProcedure
      .input(
        z.object({
          probability: z.number().min(0).max(1),
          decimalOdds: z.number().min(1),
        })
      )
      .query(({ input }) => {
        const { calculateEV } = require("./bettingCalculators");
        const ev = calculateEV(input.probability, input.decimalOdds);
        return {
          ev: parseFloat(ev.toFixed(4)),
          evPercent: parseFloat((ev * 100).toFixed(2)),
        };
      }),
    
    convertOdds: publicProcedure
      .input(
        z.object({
          value: z.number(),
          fromFormat: z.enum(["decimal", "american", "implied"]),
        })
      )
      .query(({ input }) => {
        const { convertOdds } = require("./bettingCalculators");
        return convertOdds(input.value, input.fromFormat);
      }),
    
    buildTickets: publicProcedure
      .input(
        z.object({
          markets: z.array(
            z.object({
              type: z.string(),
              description: z.string(),
              odds: z.number(),
              prob: z.number(),
              ev: z.number().optional(),
              variance: z.string().optional(),
            })
          ),
        })
      )
      .mutation(({ input }) => {
        const { buildTickets1to9 } = require("./bettingCalculators");
        return buildTickets1to9(input.markets);
      }),
    
    calculateParlayOdds: publicProcedure
      .input(
        z.object({
          legs: z.array(z.object({ odds: z.number(), prob: z.number() })),
        })
      )
      .query(({ input }) => {
        const { calculateParlayOdds, calculateParlayProbability } = require("./bettingCalculators");
        return {
          combinedOdds: parseFloat(calculateParlayOdds(input.legs).toFixed(2)),
          combinedProb: parseFloat(calculateParlayProbability(input.legs).toFixed(4)),
        };
      }),
  }),

  // Bankroll Management
  bankroll: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const { getUserBankrollSettings } = await import("./db");
      return await getUserBankrollSettings(ctx.user.id);
    }),
    
    updateSettings: protectedProcedure
      .input(
        z.object({
          totalBankroll: z.string(),
          kellyMultiplier: z.string().default("0.25"),
          riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { upsertBankrollSettings } = await import("./db");
        await upsertBankrollSettings({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Bet History
  bets: router({
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const { getUserBets } = await import("./db");
      return await getUserBets(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(
        z.object({
          betType: z.string(),
          stake: z.string(),
          odds: z.string(),
          probability: z.string().optional(),
          ev: z.string().optional(),
          kellyFraction: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createBet } = await import("./db");
        await createBet({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    updateOutcome: protectedProcedure
      .input(
        z.object({
          betId: z.number(),
          outcome: z.enum(["won", "lost"]),
          profit: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateBetOutcome } = await import("./db");
        await updateBetOutcome(input.betId, input.outcome, input.profit);
        return { success: true };
      }),
  }),

  // Parlay Management
  parlays: router({
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const { getUserParlays } = await import("./db");
      return await getUserParlays(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(
        z.object({
          ticketNumber: z.number().optional(),
          ticketName: z.string().optional(),
          legs: z.string(),
          combinedProb: z.string().optional(),
          totalOdds: z.string().optional(),
          stake: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createParlay } = await import("./db");
        await createParlay({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    
    updateOutcome: protectedProcedure
      .input(
        z.object({
          parlayId: z.number(),
          outcome: z.enum(["won", "lost"]),
          profit: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateParlayOutcome } = await import("./db");
        await updateParlayOutcome(input.parlayId, input.outcome, input.profit);
        return { success: true };
      }),
  }),

  // Notifications
  notifications: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const { getUserNotifications } = await import("./db");
      return await getUserNotifications(ctx.user.id);
    }),
    
    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        const { markNotificationRead } = await import("./db");
        await markNotificationRead(input.notificationId);
        return { success: true };
      }),
  }),

  // LLM Chatbot
  chatbot: router({
    chat: publicProcedure
      .input(
        z.object({
          message: z.string(),
          conversationHistory: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        const messages = [
          {
            role: "system" as const,
            content: `You are an expert NBA betting analyst and strategy advisor. You help users understand:
- Kelly Criterion and optimal bet sizing
- Expected Value (EV) calculations
- Bankroll management strategies
- Risk tolerance and fractional Kelly multipliers
- NBA player statistics and performance trends
- Parlay construction and probability calculations
- Market analysis for spreads, totals, and props

Provide clear, actionable advice based on mathematical principles and data-driven insights. When discussing bet sizing, always emphasize responsible gambling and proper bankroll management.`,
          },
          ...(input.conversationHistory || []).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: "user" as const,
            content: input.message,
          },
        ];

        const response = await invokeLLM({ messages });
        return {
          response: response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
