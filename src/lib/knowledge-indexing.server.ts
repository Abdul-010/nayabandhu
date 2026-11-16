import { countTokens } from "gpt-tokenizer";

export const KNOWLEDGE_EMBEDDING_MODEL = "google/gemini-embedding-2";
const EMBEDDING_ENDPOINT = "https://ai.gateway.lovable.dev/v1/embeddings";
const CHUNK_TOKEN_BUDGET = 3000;
const BATCH_SIZE = 50;
const EMBEDDING_DIMENSIONS = 3072;

export class KnowledgeEmbeddingError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly pauseWorkspace = false,
  ) {
    super(message);
    this.name = "KnowledgeEmbeddingError";
  }
}

function splitLongText(text: string): string[] {
  const pieces = text.split(/\s+/u).filter(Boolean);
  const result: string[] = [];
  let current = "";
  for (const piece of pieces) {
    const candidate = current ? `${current} ${piece}` : piece;
    if (countTokens(candidate) <= CHUNK_TOKEN_BUDGET) {
      current = candidate;
      continue;
    }
    if (current) result.push(current);
    if (countTokens(piece) <= CHUNK_TOKEN_BUDGET) {
      current = piece;
      continue;
    }
    let fragment = "";
    for (const point of Array.from(piece)) {
      const next = fragment + point;
      if (fragment && countTokens(next) > CHUNK_TOKEN_BUDGET) {
        result.push(fragment);
        fragment = point;
      } else {
        fragment = next;
      }
    }
    current = fragment;
  }
  if (current) result.push(current);
  return result;
}

export function chunkKnowledgeText(text: string): string[] {
  const normalized = text.replace(/\r\n?/gu, "\n").trim();
  if (!normalized) return [];
  const units = normalized.split(/(?<=[.!?।！？])\s+|\n{2,}/u).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const unit of units) {
    if (countTokens(unit) > CHUNK_TOKEN_BUDGET) {
      if (current) chunks.push(current);
      current = "";
      chunks.push(...splitLongText(unit));
      continue;
    }
    const candidate = current ? `${current}\n\n${unit}` : unit;
    if (countTokens(candidate) > CHUNK_TOKEN_BUDGET && current) {
      chunks.push(current);
      current = unit;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function safeMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error.trim().slice(0, 1000);
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message.trim().slice(0, 1000);
    }
  }
  return status === 402
    ? "AI credits are unavailable for document indexing. Add credits, then resume indexing."
    : `Document indexing is temporarily unavailable (HTTP ${status}).`;
}

function isWorkspaceBlock(payload: unknown, status: number): boolean {
  if (status === 402) return true;
  if (status !== 403 || !payload || typeof payload !== "object" || !("error" in payload)) return false;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return false;
  const details = error as { type?: unknown; props?: unknown };
  const props = details.props && typeof details.props === "object" ? (details.props as { requires?: unknown }) : null;
  return props?.requires === "admin_action" || props?.requires === "top_up" || details.type === "credit_limit_reached" || details.type === "ai_disabled";
}

async function requestEmbeddingBatch(apiKey: string, input: string[]): Promise<number[][]> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(EMBEDDING_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: KNOWLEDGE_EMBEDDING_MODEL, input }),
    });
    if (response.ok) {
      const result = (await response.json()) as { data?: { index: number; embedding: number[] }[] };
      const ordered: (number[] | undefined)[] = Array.from({ length: input.length });
      for (const item of result.data ?? []) {
        if (!Number.isInteger(item.index) || item.index < 0 || item.index >= ordered.length || ordered[item.index]) {
          throw new KnowledgeEmbeddingError(502, "The document index returned an invalid result. Please try again.");
        }
        if (!Array.isArray(item.embedding) || item.embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new KnowledgeEmbeddingError(502, "The document index returned an unsupported vector size.");
        }
        ordered[item.index] = item.embedding;
      }
      if (ordered.some((embedding) => !embedding)) {
        throw new KnowledgeEmbeddingError(502, "The document index returned an incomplete result. Please try again.");
      }
      return ordered as number[][];
    }

    const payload = await response.json().catch(() => null);
    const message = safeMessage(payload, response.status);
    const pauseWorkspace = isWorkspaceBlock(payload, response.status);
    const retryable = response.status === 429 || response.status >= 500;
    const accountProblem = /account|configuration|not registered|invalid api key/iu.test(message);
    if (!retryable || accountProblem || attempt === maxAttempts) {
      throw new KnowledgeEmbeddingError(response.status, message, pauseWorkspace);
    }
    const retryAfter = Number(response.headers.get("Retry-After"));
    const delay = retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 300);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new KnowledgeEmbeddingError(500, "Document indexing is temporarily unavailable.");
}

export async function embedKnowledgeChunks(apiKey: string, chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
    embeddings.push(...(await requestEmbeddingBatch(apiKey, chunks.slice(start, start + BATCH_SIZE))));
  }
  return embeddings;
}