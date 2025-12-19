import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * NBA Teams table
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  abbr: varchar("abbr", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * NBA Players table with comprehensive stats
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  externalId: int("externalId"),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  teamId: int("teamId"),
  position: varchar("position", { length: 20 }),
  ppg: varchar("ppg", { length: 20 }),
  fgm: varchar("fgm", { length: 20 }),
  fga: varchar("fga", { length: 20 }),
  fgPct: varchar("fgPct", { length: 20 }),
  ftm: varchar("ftm", { length: 20 }),
  fta: varchar("fta", { length: 20 }),
  ftPct: varchar("ftPct", { length: 20 }),
  tpm: varchar("tpm", { length: 20 }),
  tpa: varchar("tpa", { length: 20 }),
  tpPct: varchar("tpPct", { length: 20 }),
  rpg: varchar("rpg", { length: 20 }),
  orpg: varchar("orpg", { length: 20 }),
  drpg: varchar("drpg", { length: 20 }),
  apg: varchar("apg", { length: 20 }),
  topg: varchar("topg", { length: 20 }),
  spg: varchar("spg", { length: 20 }),
  bpg: varchar("bpg", { length: 20 }),
  pfpg: varchar("pfpg", { length: 20 }),
  ts: varchar("ts", { length: 20 }),
  efg: varchar("efg", { length: 20 }),
  gamesPlayed: int("gamesPlayed"),
  minutesPerGame: varchar("minutesPerGame", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Bets table for historical tracking
 */
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  betType: varchar("betType", { length: 50 }).notNull(),
  stake: varchar("stake", { length: 20 }).notNull(),
  odds: varchar("odds", { length: 20 }).notNull(),
  probability: varchar("probability", { length: 20 }),
  ev: varchar("ev", { length: 20 }),
  kellyFraction: varchar("kellyFraction", { length: 20 }),
  outcome: mysqlEnum("outcome", ["pending", "won", "lost"]).default("pending").notNull(),
  profit: varchar("profit", { length: 20 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

/**
 * Parlays table for multi-leg bet tracking
 */
export const parlays = mysqlTable("parlays", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticketNumber: int("ticketNumber"),
  ticketName: varchar("ticketName", { length: 100 }),
  legs: text("legs").notNull(),
  combinedProb: varchar("combinedProb", { length: 20 }),
  totalOdds: varchar("totalOdds", { length: 20 }),
  stake: varchar("stake", { length: 20 }),
  outcome: mysqlEnum("outcome", ["pending", "won", "lost"]).default("pending").notNull(),
  profit: varchar("profit", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Parlay = typeof parlays.$inferSelect;
export type InsertParlay = typeof parlays.$inferInsert;

/**
 * Notifications table for high-EV alerts
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Bankroll settings table
 */
export const bankrollSettings = mysqlTable("bankrollSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalBankroll: varchar("totalBankroll", { length: 20 }).notNull(),
  kellyMultiplier: varchar("kellyMultiplier", { length: 20 }).default("0.25").notNull(),
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]).default("moderate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankrollSetting = typeof bankrollSettings.$inferSelect;
export type InsertBankrollSetting = typeof bankrollSettings.$inferInsert;

/**
 * Custom alerts table for user-defined betting triggers
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  playerName: varchar("playerName", { length: 200 }).notNull(),
  alertType: mysqlEnum("alertType", ["points", "rebounds", "assists", "streak", "custom"]).notNull(),
  condition: varchar("condition", { length: 50 }).notNull(), // "greater_than", "less_than", "equals", "streak"
  threshold: varchar("threshold", { length: 20 }).notNull(),
  consecutiveGames: int("consecutiveGames").default(1), // For streak alerts
  isActive: int("isActive").default(1).notNull(),
  lastTriggered: timestamp("lastTriggered"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;