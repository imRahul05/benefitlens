import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      where: {
        markdown: {
          not: null,
        },
        status: {
          in: ["SUCCESS", "PARTIAL_SUCCESS"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });

    return NextResponse.json({
      documents: documents.map((document) => ({
        id: document.id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        status: document.status,
        vectorStoreId: document.vectorStoreId,
        chunkCount: document._count.chunks,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to load parsed documents: ${message}` },
      { status: 500 },
    );
  }
}
