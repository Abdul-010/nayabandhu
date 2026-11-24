import { describe, expect, it } from "vitest";
import { chunkKnowledgeText, isWorkspaceCreditBlock } from "@/lib/knowledge-indexing";
import { countTokens } from "gpt-tokenizer";

describe("document indexing chunks", () => {
  it("keeps every non-empty source sentence and stays within the 3000-token embedding input budget", () => {
    const sentence = "The Right to Information Act gives Indian citizens access to public records. ";
    const source = sentence.repeat(320);
    const chunks = chunkKnowledgeText(source);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => countTokens(chunk) <= 3000)).toBe(true);
    expect(chunks.join(" ").replace(/\s+/gu, " ").trim()).toBe(source.replace(/\s+/gu, " ").trim());
  });

  it("returns no chunks for empty or whitespace-only documents", () => {
    expect(chunkKnowledgeText(" \n\t ")).toEqual([]);
  });

  it("pauses indexing only for workspace-level credit or AI access blocks", () => {
    expect(isWorkspaceCreditBlock({ error: { type: "provider_access_denied" } }, 403)).toBe(false);
    expect(isWorkspaceCreditBlock({ error: { type: "account_restricted" } }, 403)).toBe(false);
    expect(isWorkspaceCreditBlock({ error: { props: { requires: "admin_action" } } }, 403)).toBe(true);
    expect(isWorkspaceCreditBlock({ error: { type: "credit_limit_reached" } }, 403)).toBe(true);
    expect(isWorkspaceCreditBlock({ error: "Payment required" }, 402)).toBe(true);
  });
});