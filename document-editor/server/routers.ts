import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createDocument,
  getDocumentsByUserId,
  getDocumentById,
  updateDocument,
  deleteDocument,
  createDocumentVersion,
  getDocumentVersions,
  getDocumentVersion,
  getDocumentWatermark,
  createOrUpdateWatermark,
  getDocumentLayers,
  createDocumentLayer,
  updateDocumentLayer,
  deleteDocumentLayer,
  getDocumentColors,
  createDocumentColor,
  getPrintMaterials,
  createPrintMaterial,
} from "./db";

export const appRouter = router({
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

  // Document Management Procedures
  documents: router({
    // Create a new document
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          content: z.string().default(""),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createDocument(ctx.user.id, input.title, input.content);
        return { success: true };
      }),

    // Get all documents for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getDocumentsByUserId(ctx.user.id);
    }),

    // Get a specific document
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.id, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        return doc;
      }),

    // Update document content
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1),
          content: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.id, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        // Create version before updating
        await createDocumentVersion(input.id, ctx.user.id, doc.title, doc.content);

        // Update document
        await updateDocument(input.id, ctx.user.id, input.title, input.content);
        return { success: true };
      }),

    // Delete document
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.id, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        await deleteDocument(input.id, ctx.user.id);
        return { success: true };
      }),

    // Search documents
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input, ctx }) => {
        const docs = await getDocumentsByUserId(ctx.user.id);
        const query = input.query.toLowerCase();
        return docs.filter(
          doc =>
            doc.title.toLowerCase().includes(query) ||
            doc.content.toLowerCase().includes(query)
        );
      }),
  }),

  // Version History Procedures
  versions: router({
    // Get version history for a document
    list: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        return await getDocumentVersions(input.documentId);
      }),

    // Get a specific version
    get: protectedProcedure
      .input(z.object({ versionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const version = await getDocumentVersion(input.versionId);
        if (!version) throw new Error("Version not found");
        // Verify ownership
        if (version.userId !== ctx.user.id) throw new Error("Unauthorized");
        return version;
      }),

    // Restore from a version
    restore: protectedProcedure
      .input(z.object({ documentId: z.number(), versionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        const version = await getDocumentVersion(input.versionId);
        if (!version) throw new Error("Version not found");
        if (version.userId !== ctx.user.id) throw new Error("Unauthorized");

        // Create version of current state before restoring
        await createDocumentVersion(input.documentId, ctx.user.id, doc.title, doc.content);

        // Restore from version
        await updateDocument(input.documentId, ctx.user.id, version.title, version.content);
        return { success: true };
      }),
  }),

  // Watermark Procedures
  watermarks: router({
    // Get watermark for document
    get: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        return await getDocumentWatermark(input.documentId);
      }),

    // Create or update watermark
    save: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          text: z.string(),
          opacity: z.number().min(0).max(100),
          rotation: z.number().min(0).max(360),
          position: z.enum(["center", "top-left", "top-right", "bottom-left", "bottom-right", "diagonal"]),
          fontSize: z.number().min(8).max(200),
          fontColor: z.string(),
          enabled: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        await createOrUpdateWatermark(input.documentId, ctx.user.id, {
          text: input.text,
          opacity: input.opacity,
          rotation: input.rotation,
          position: input.position,
          fontSize: input.fontSize,
          fontColor: input.fontColor,
          enabled: input.enabled ? 1 : 0,
        });

        return { success: true };
      }),
  }),

  // Image Layer Procedures
  layers: router({
    // Get all layers for a document
    list: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        return await getDocumentLayers(input.documentId);
      }),

    // Create a new layer
    create: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          imageUrl: z.string().url(),
          layerName: z.string(),
          opacity: z.number().min(0).max(100).default(100),
          blendMode: z.string().default("normal"),
          zIndex: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        await createDocumentLayer(input.documentId, ctx.user.id, {
          imageUrl: input.imageUrl,
          layerName: input.layerName,
          opacity: input.opacity,
          blendMode: input.blendMode,
          zIndex: input.zIndex,
        });

        return { success: true };
      }),

    // Update layer properties
    update: protectedProcedure
      .input(
        z.object({
          layerId: z.number(),
          documentId: z.number(),
          opacity: z.number().min(0).max(100).optional(),
          blendMode: z.string().optional(),
          zIndex: z.number().optional(),
          positionX: z.number().optional(),
          positionY: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          visible: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        const updateData: any = {};
        if (input.opacity !== undefined) updateData.opacity = input.opacity;
        if (input.blendMode !== undefined) updateData.blendMode = input.blendMode;
        if (input.zIndex !== undefined) updateData.zIndex = input.zIndex;
        if (input.positionX !== undefined) updateData.positionX = input.positionX;
        if (input.positionY !== undefined) updateData.positionY = input.positionY;
        if (input.width !== undefined) updateData.width = input.width;
        if (input.height !== undefined) updateData.height = input.height;
        if (input.visible !== undefined) updateData.visible = input.visible ? 1 : 0;

        await updateDocumentLayer(input.layerId, updateData);
        return { success: true };
      }),

    // Delete a layer
    delete: protectedProcedure
      .input(z.object({ layerId: z.number(), documentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        await deleteDocumentLayer(input.layerId);
        return { success: true };
      }),
  }),

  // Color Matching Procedures
  colors: router({
    // Get color palettes for document
    list: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        return await getDocumentColors(input.documentId);
      }),

    // Create or save a color palette
    save: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          paletteName: z.string(),
          colors: z.array(z.string()),
          sourceImageUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        await createDocumentColor(input.documentId, ctx.user.id, {
          paletteName: input.paletteName,
          colors: JSON.stringify(input.colors),
          sourceImageUrl: input.sourceImageUrl || null,
        });

        return { success: true };
      }),
  }),

  // Print Material Procedures
  printMaterials: router({
    // Get print materials for document
    list: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");
        return await getPrintMaterials(input.documentId);
      }),

    // Create a print material configuration
    create: protectedProcedure
      .input(
        z.object({
          documentId: z.number(),
          materialType: z.enum(["paper", "canvas", "fabric", "vinyl", "wood", "metal", "acrylic"]),
          materialName: z.string(),
          dpi: z.number().min(72).max(1200),
          colorMode: z.enum(["RGB", "CMYK", "Grayscale"]),
          settings: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        await createPrintMaterial(input.documentId, ctx.user.id, {
          materialType: input.materialType,
          materialName: input.materialName,
          dpi: input.dpi,
          colorMode: input.colorMode,
          settings: input.settings ? JSON.stringify(input.settings) : null,
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
