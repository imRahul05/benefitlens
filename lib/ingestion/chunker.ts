export interface MarkdownChunk {
  chunkIndex: number;
  content: string;
}

interface ChunkMarkdownOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;

export function chunkMarkdown(
  markdown: string,
  options: ChunkMarkdownOptions = {},
): MarkdownChunk[] {
  const normalizedMarkdown = markdown.trim();
  if (!normalizedMarkdown) {
    return [];
  }

  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap must be greater than or equal to 0 and less than chunkSize");
  }

  const chunks: MarkdownChunk[] = [];
  const stepSize = chunkSize - overlap;

  for (let start = 0; start < normalizedMarkdown.length; start += stepSize) {
    const content = normalizedMarkdown.slice(start, start + chunkSize);

    chunks.push({
      chunkIndex: chunks.length,
      content,
    });

    if (start + chunkSize >= normalizedMarkdown.length) {
      break;
    }
  }

  return chunks;
}
