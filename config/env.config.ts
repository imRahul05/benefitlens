function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not defined.`);
  }
  return value;
}

export const env = {
  get DATABASE_URL(): string {
    return requireEnv("DATABASE_URL");
  },
  get NODE_ENV(): "development" | "production" | "test" {
    const value = process.env.NODE_ENV;
    if (value === "production" || value === "test") {
      return value;
    }
    return "development";
  },
  get OPENAI_API_KEY(): string {
    return requireEnv("OPENAI_API_KEY");
  },
  get OPENAI_RAG_MODEL(): string {
    return process.env.OPENAI_RAG_MODEL || "gpt-4o-mini";
  },
  get LLAMA_CLOUD_API_KEY(): string {
    return requireEnv("LLAMA_CLOUD_API_KEY");
  },
  get LLAMA_URL(): string | undefined {
    return process.env.LLAMA_PARSER_URL;
  },
  get NEXT_PUBLIC_URL(): string | undefined {
    return process.env.NEXT_PUBLIC_URL;
  },
};