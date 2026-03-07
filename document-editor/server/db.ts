import { eq, desc, asc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, documents, documentVersions, documentWatermarks, documentLayers, documentColors, printMaterials } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createDocument(userId: number, title: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const wordCount = content.trim().split(/\s+/).length;
  const result = await db.insert(documents).values({
    userId,
    title,
    content,
    wordCount,
  });
  
  return result;
}

export async function getDocumentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.updatedAt));
}

export async function getDocumentById(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(documents).where(and(eq(documents.id, documentId), eq(documents.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateDocument(documentId: number, userId: number, title: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const wordCount = content.trim().split(/\s+/).length;
  await db.update(documents).set({ title, content, wordCount }).where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
}

export async function deleteDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(documents).where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
}

export async function createDocumentVersion(documentId: number, userId: number, title: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const wordCount = content.trim().split(/\s+/).length;
  await db.insert(documentVersions).values({ documentId, userId, title, content, wordCount });
}

export async function getDocumentVersions(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).orderBy(desc(documentVersions.createdAt));
}

export async function getDocumentVersion(versionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(documentVersions).where(eq(documentVersions.id, versionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDocumentWatermark(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(documentWatermarks).where(eq(documentWatermarks.documentId, documentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateWatermark(documentId: number, userId: number, watermarkData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getDocumentWatermark(documentId);
  if (existing) {
    await db.update(documentWatermarks).set(watermarkData).where(eq(documentWatermarks.documentId, documentId));
  } else {
    await db.insert(documentWatermarks).values({ documentId, userId, ...watermarkData });
  }
}

export async function getDocumentLayers(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documentLayers).where(eq(documentLayers.documentId, documentId)).orderBy(asc(documentLayers.zIndex));
}

export async function createDocumentLayer(documentId: number, userId: number, layerData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(documentLayers).values({ documentId, userId, ...layerData });
}

export async function updateDocumentLayer(layerId: number, layerData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(documentLayers).set(layerData).where(eq(documentLayers.id, layerId));
}

export async function deleteDocumentLayer(layerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(documentLayers).where(eq(documentLayers.id, layerId));
}

export async function getDocumentColors(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documentColors).where(eq(documentColors.documentId, documentId));
}

export async function createDocumentColor(documentId: number, userId: number, colorData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(documentColors).values({ documentId, userId, ...colorData });
}

export async function getPrintMaterials(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(printMaterials).where(eq(printMaterials.documentId, documentId));
}

export async function createPrintMaterial(documentId: number, userId: number, materialData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(printMaterials).values({ documentId, userId, ...materialData });
}
