import { describe, expect, it } from "vitest";
import { chunkKnowledgeText } from "@/lib/knowledge-indexing.server";
import { countTokens } from "gpt-tokenizer";

describe("document indexing chunks", () => {
  it("keeps every non-empty source sentence and stays within the 3000-token embedding input budget", () => {
    const sentence = "The Right to Information Act gives Indian citizens access to public records. ";
    const source = sentence.repeat(320);
    const chunks = chunkKnowledgeText(source);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => countTokens(chunk) <= 3000)).toBe(true);
    for (const piece of sentence.trim().split(" ").filter(Boolean)) {
      expect(chunks.join(" ")).toContain(piece);
    }
  });

  it("returns no chunks for empty or whitespace-only documents", () => {
    expect(chunkKnowledgeText(" \n\t ")).toEqual([]);
  });
});