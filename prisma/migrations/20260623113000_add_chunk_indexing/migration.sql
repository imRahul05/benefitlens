-- Add vector store metadata to parsed documents.
ALTER TABLE "Document"
ADD COLUMN IF NOT EXISTS "vectorStoreId" TEXT;

-- Create chunks if this database was only initialized from migrations.
CREATE TABLE IF NOT EXISTS "Chunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Chunk_documentId_fkey'
    ) THEN
        ALTER TABLE "Chunk"
        ADD CONSTRAINT "Chunk_documentId_fkey"
        FOREIGN KEY ("documentId") REFERENCES "Document"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Chunk_documentId_idx" ON "Chunk"("documentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Chunk_documentId_chunkIndex_key" ON "Chunk"("documentId", "chunkIndex");
