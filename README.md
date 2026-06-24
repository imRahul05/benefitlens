# BenefitLens

BenefitLens is an AI-powered document intelligence and ingestion platform designed to parse complex documents (such as insurance policies, benefits booklets, and healthcare guides) into structured markdown, index their contents, and enable context-grounded conversations using Retrieval-Augmented Generation (RAG).

---

## Project Objective

The primary objective of BenefitLens is to simplify the consumption of dense, unstructured benefits documents. By converting multi-format documents into clean, machine-readable markdown and indexing them in a secure vector database, the application provides users with an interactive, natural-language interface to query their policies. The system guarantees high fact-grounding by citing specific source document chunks and calculating confidence scores.

---

## Core Features

- **Multi-Format Ingestion**: Supports drag-and-drop uploads for PDF, DOCX, TXT, and images (PNG, JPG, WEBP) with a 10MB file size limit.
- **High-Fidelity Extraction**: Integrates with LlamaParse (via LlamaCloud) to extract hierarchical text, tables, and complex formatting from documents.
- **Dynamic Real-Time Ingestion Logs**: Employs a long-polling mechanism and stepper component to track upload, extraction, and indexing status in real time, backed by a 10-minute timeout safety limit.
- **Local Cache & Database Caching**: Persists document records, job statuses, and raw markdown outputs in PostgreSQL via Prisma, preventing redundant, costly API calls for already-processed documents.
- **Sliding-Window Markdown Chunking**: Splits extracted markdown into character-based chunks (1,000-character size with a 200-character overlap) and stores them in PostgreSQL to serve as retrieval reference points.
- **Automated Vector Store Indexing**: Packages text chunks into individual markdown files and uploads them to an OpenAI Vector Store via the OpenAI File Batches API.
- **Citations-Enriched RAG Chat**: Leverages OpenAI's File Search tool to answer user queries, returning responses that link directly back to the matching source chunks in the database.

---

## System Architecture

The BenefitLens architecture consists of a Next.js single-page client interface, Next.js API route handlers, localized ingestion/RAG services, and external integrations with LlamaCloud and OpenAI.

```mermaid
flowchart TB
    %% Subgraphs
    subgraph Client ["Client Layer (Next.js Client Components)"]
        A["HomePageClient"]
        B["DocumentUpload (Drag & Drop)"]
        C["IngestionLogsList (Logs & Progress)"]
        D["DocumentViewerModal (Viewer & Chat Panel)"]
        E[("LocalStorage (Local Job Cache)")]
        F["React Query (Polling & Mutations)"]
    end

    subgraph Backend ["Backend API Layer (Next.js Route Handlers)"]
        G["POST /api/upload"]
        H["GET/DELETE /api/jobs/[id]"]
        I["POST /api/documents/[id]/index"]
        J["GET /api/documents/[id]/chunks"]
        K["POST /api/chat"]
    end

    subgraph Services ["Service & Processing Layer"]
        L["DocumentIndexer Orchestrator"]
        M["chunkMarkdown Utility"]
        N["chunkPersistence Service"]
        O["vectorStore Creator"]
        P["askDocumentQuestion (RAG Engine)"]
    end

    subgraph Storage ["Storage & External Services"]
        Q[("PostgreSQL DB (Prisma ORM)")]
        R["LlamaCloud / LlamaParse API"]
        S["OpenAI Assistant / Responses API"]
        T["OpenAI Vector Store Storage"]
    end

    %% Client Interactions
    A --> B
    A --> C
    A --> D
    A <--> E
    A <--> F

    %% Client to API Communication
    F -->|Upload File| G
    F -->|Long-Poll Status| H
    F -->|Trigger Indexing| I
    F -->|Fetch Chunks| J
    F -->|Chat Queries| K

    %% API to Service Mapping
    G -->|Extract Metadata| R
    H -->|Read Cache / Update State| Q
    H -->|Poll Job Status| R
    I --> L
    J -->|Read Database Chunks| Q
    K --> P

    %% Service Connections
    L -->|1. Segment Text| M
    L -->|2. Save Chunks| N
    L -->|3. Index Chunks| O
    N -->|Store Chunks| Q
    O -->|Upload Files & Poll Batch| S
    O -->|Link Vector Store ID| Q

    %% RAG Query Flow
    P -->|Fetch Local Chunks| Q
    P -->|Request file_search| S
    S <-->|Retrieve from| T
    P -->|Inject Citations & Response| A

    %% Styling
    style Client fill:#1c1917,stroke:#44403c,stroke-width:2px,color:#fafafa
    style Backend fill:#18181b,stroke:#3f3f46,stroke-width:2px,color:#fafafa
    style Services fill:#09090b,stroke:#27272a,stroke-width:2px,color:#fafafa
    style Storage fill:#111827,stroke:#1f2937,stroke-width:2px,color:#fafafa

    classDef component fill:#27272a,stroke:#52525b,stroke-width:1px,color:#e4e4e7;
    classDef route fill:#0284c7,stroke:#0369a1,stroke-width:1px,color:#fff;
    classDef external fill:#b45309,stroke:#92400e,stroke-width:1px,color:#fff;
    classDef database fill:#047857,stroke:#065f46,stroke-width:1px,color:#fff;

    class A,B,C,D component;
    class G,H,I,J,K route;
    class Q database;
    class R,S,T,E external;
```

---

## Technical Workflows

### 1. Ingestion & Extraction Workflow
1. The client uploads a file through `DocumentUpload`.
2. The client triggers the `POST /api/upload` endpoint, creating a record in PostgreSQL with status `PROCESSING`.
3. The API handler sends the file payload to the LlamaCloud API, which initiates a parsing job.
4. The client polls `GET /api/jobs/[id]`, which checks the LlamaCloud job status. When LlamaCloud completes the extraction, the API handler caches the returned markdown text in PostgreSQL and marks the document status as `SUCCESS`.

### 2. Chunking & Indexing Workflow
1. When the user clicks "Index", the client triggers `POST /api/documents/[id]/index`.
2. The server loads the cached markdown from PostgreSQL and runs it through the `chunkMarkdown` sliding-window utility.
3. The generated chunks are persisted to the database under the `Chunk` table.
4. The server packages these chunks into temporary markdown files, uploads them to OpenAI, and creates a Vector Store.
5. The resulting `vectorStoreId` is written to the database record, making the document ready for query.

### 3. Retrieval-Augmented Generation (RAG) Chat Workflow
1. The user enters a question in the chat panel of `DocumentViewerModal`.
2. The client issues a `POST /api/chat` request containing the `documentId` and the query text.
3. The server invokes OpenAI's Responses API using the `file_search` tool, passing the document's `vectorStoreId`.
4. OpenAI retrieves the most relevant chunks from its vector storage and generates a grounded response.
5. The server extracts the search result metadata, matches them back to the local PostgreSQL database chunks by matching chunk indices, resolves citations, and returns a compiled response to the client.

---

## Technology Stack

- **Frontend**: Next.js 15+ (App Router), React, TanStack React Query v5, Tailwind CSS, Shadcn UI
- **Database & ORM**: PostgreSQL, Prisma ORM
- **AI Integrations**: LlamaCloud SDK (LlamaParse), OpenAI NodeJS SDK (Assistant / Responses API)

---

## Environment Configuration

Configure the following environment variables in your `.env` file at the root of the project:

```bash
# Database Connection
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# External API Keys
OPENAI_API_KEY="your-openai-api-key"
LLAMA_CLOUD_API_KEY="your-llamacloud-api-key"

# Optional Model Configuration
OPENAI_RAG_MODEL="gpt-4o-mini" # The model used by the RAG search agent
LLAMA_PARSER_URL="https://llama-webhook-intake.example.com" # Hook URL if using proxy intake
```

---

## Getting Started

### 1. Install Dependencies
Ensure you have Node.js and `pnpm` installed. Run the following command:
```bash
pnpm install
```

### 2. Database Migration
Apply the Prisma schema migrations to set up the PostgreSQL database and generate the Prisma Client:
```bash
pnpm prisma migrate dev
```

### 3. Run the Development Server
Start the Next.js development server locally:
```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).
