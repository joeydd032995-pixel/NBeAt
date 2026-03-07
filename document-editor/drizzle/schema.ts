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

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  wordCount: int("wordCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const documentVersions = mysqlTable("documentVersions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  wordCount: int("wordCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;

export const documentLayers = mysqlTable("documentLayers", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  layerName: varchar("layerName", { length: 255 }).notNull(),
  opacity: int("opacity").default(100).notNull(),
  blendMode: varchar("blendMode", { length: 50 }).default("normal").notNull(),
  zIndex: int("zIndex").default(0).notNull(),
  positionX: int("positionX").default(0).notNull(),
  positionY: int("positionY").default(0).notNull(),
  width: int("width"),
  height: int("height"),
  visible: int("visible").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentLayer = typeof documentLayers.$inferSelect;
export type InsertDocumentLayer = typeof documentLayers.$inferInsert;

export const documentWatermarks = mysqlTable("documentWatermarks", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  text: text("text").notNull(),
  opacity: int("opacity").default(30).notNull(),
  rotation: int("rotation").default(0).notNull(),
  position: varchar("position", { length: 50 }).default("center").notNull(),
  fontSize: int("fontSize").default(48).notNull(),
  fontColor: varchar("fontColor", { length: 7 }).default("#000000").notNull(),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentWatermark = typeof documentWatermarks.$inferSelect;
export type InsertDocumentWatermark = typeof documentWatermarks.$inferInsert;

export const documentColors = mysqlTable("documentColors", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  paletteName: varchar("paletteName", { length: 255 }).notNull(),
  colors: text("colors").notNull(),
  sourceImageUrl: text("sourceImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentColor = typeof documentColors.$inferSelect;
export type InsertDocumentColor = typeof documentColors.$inferInsert;

export const printMaterials = mysqlTable("printMaterials", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  materialType: varchar("materialType", { length: 100 }).notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  dpi: int("dpi").default(300).notNull(),
  colorMode: varchar("colorMode", { length: 50 }).default("RGB").notNull(),
  settings: text("settings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PrintMaterial = typeof printMaterials.$inferSelect;
export type InsertPrintMaterial = typeof printMaterials.$inferInsert;