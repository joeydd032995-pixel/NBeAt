import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: any) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Document Operations", () => {
  it("should create a document", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.documents.create({
      title: "Test Document",
      content: "<p>Test content</p>",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should list documents for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a document first
    await caller.documents.create({
      title: "Test Doc 1",
      content: "Content 1",
    });

    // List documents
    const result = await caller.documents.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should search documents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a document
    await caller.documents.create({
      title: "Searchable Document",
      content: "<p>This is searchable content</p>",
    });

    // Search for it
    const result = await caller.documents.search({
      query: "Searchable",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update a document", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a document
    const created = await caller.documents.create({
      title: "Original Title",
      content: "Original content",
    });

    // Get the document ID (assuming it returns an ID or we can list and get it)
    const docs = await caller.documents.list();
    const docId = docs[0]?.id;

    if (docId) {
      const result = await caller.documents.update({
        id: docId,
        title: "Updated Title",
        content: "Updated content",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should handle watermarks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a document
    const docs = await caller.documents.list();
    const docId = docs[0]?.id;

    if (docId) {
      const result = await caller.watermarks.save({
        documentId: docId,
        text: "CONFIDENTIAL",
        opacity: 50,
        rotation: 45,
        position: "center",
        fontSize: 48,
        fontColor: "#000000",
        enabled: true,
      });

      expect(result.success).toBe(true);
    }
  });

  it("should handle image layers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.documents.list();
    const docId = docs[0]?.id;

    if (docId) {
      const result = await caller.layers.create({
        documentId: docId,
        imageUrl: "https://example.com/image.jpg",
        layerName: "Test Layer",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should handle color palettes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.documents.list();
    const docId = docs[0]?.id;

    if (docId) {
      const result = await caller.colors.save({
        documentId: docId,
        paletteName: "Test Palette",
        colors: ["#FF0000", "#00FF00", "#0000FF"],
      });

      expect(result.success).toBe(true);
    }
  });

  it("should handle print materials", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.documents.list();
    const docId = docs[0]?.id;

    if (docId) {
      const result = await caller.printMaterials.create({
        documentId: docId,
        materialType: "canvas",
        materialName: "Premium Canvas",
        dpi: 300,
        colorMode: "RGB",
      });

      expect(result.success).toBe(true);
    }
  });

  it("should handle version history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const docs = await caller.documents.list();
    const docId = docs[0]?.id;

    if (docId) {
      // List versions
      const versions = await caller.versions.list({
        documentId: docId,
      });

      expect(Array.isArray(versions)).toBe(true);
    }
  });
});

describe("Authentication", () => {
  it("should logout successfully", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBe(1);
  });

  it("should get current user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
  });
});
