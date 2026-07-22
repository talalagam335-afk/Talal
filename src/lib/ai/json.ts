// Tolerant JSON extraction for model output.
//
// Model responses are asked for pure JSON, but can occasionally include stray
// prose or markdown fences. This helper parses the JSON defensively so a single
// stray character does not fail the whole pipeline. Structural correctness is
// still enforced afterwards by the relevant Zod schema.

export function extractJsonObject(raw: string): unknown {
  const text = stripCodeFences(raw).trim();
  try {
    return JSON.parse(text);
  } catch {
    // Fall back to the first balanced-looking {...} block.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        /* ignore — caller's schema validation will reject */
      }
    }
    return {};
  }
}

function stripCodeFences(raw: string): string {
  // Remove a leading ```json / ``` fence and a trailing ``` if present.
  return raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "");
}
