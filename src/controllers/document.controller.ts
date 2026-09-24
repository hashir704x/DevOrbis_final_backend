import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { UTFile } from "uploadthing/server";
import { utapi } from "../utils/uploadThing.js";
import { documents } from "../drizzle/schema.js";
import { db } from "../drizzle/database-client.js";
import type { roles } from "../types/types.js";
import { processDocument } from "../utils/documents/process-document.js";
import { eq } from "drizzle-orm";

export async function uploadDocument(req: Request, res: Response) {
    if (!req.file) {
        throw new AppError("Document not found", 400);
    }
    const file = new UTFile(
        [new Uint8Array(req.file.buffer)],
        req.file.originalname,
        {
            type: req.file.mimetype,
        },
    );
    const uploadResult = await utapi.uploadFiles(file);
    if (uploadResult.error) {
        throw new AppError(uploadResult.error.message, 500);
    }
    const userData = req.userData as {
        userId: string;
        role: roles;
    };
    const document = await db
        .insert(documents)
        .values({
            uploadedBy: userData.userId,
            filename: uploadResult.data.name,
            storageKey: uploadResult.data.key,
            fileUrl: uploadResult.data.ufsUrl,
            fileType: uploadResult.data.type,
            fileSize: uploadResult.data.size,
        })
        .returning();
    const targetDocument = document[0];
    if (!targetDocument) {
        throw new AppError(
            "Failed to create document record, problem at server side",
            500,
        );
    }
    res.status(200).json(
        new ApiResponse(true, "Document uploaded successfully", null),
    );
    try {
        await processDocument({
            buffer: req.file.buffer,
            documentId: targetDocument.id,
            mimeType: req.file.mimetype,
        });
        await db
            .update(documents)
            .set({ status: "success" })
            .where(eq(documents.id, targetDocument.id));
        console.log("Embeddings created and stored for document successfully");
    } catch (error) {
        await db
            .update(documents)
            .set({ status: "failed" })
            .where(eq(documents.id, targetDocument.id));
        console.log("error", error);
    }
}

export async function getDocuments(_: Request, res: Response) {
    const targetDocuments = await db.select().from(documents);
    return res
        .status(200)
        .json(
            new ApiResponse(true, "Documents fetched successfully", targetDocuments),
        );
    
}
