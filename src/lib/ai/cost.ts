// Deterministic, provider-agnostic token & cost ESTIMATION.
//
// This does not call any API. It gives a rough, repeatable size estimate so we
// can reason about cost-per-run without a live key. The ~4 chars/token ratio is
// a standard heuristic; real token counts and real prices must be confirmed
// against a live run (see report — marked unverified until then).

/** Rough token estimate for a piece of text (~4 characters per token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface RunTokenEstimate {
  inputTokens: number;
  /** Assumed output tokens (documents are bounded; a conservative default). */
  outputTokens: number;
  totalTokens: number;
}

/**
 * Estimate tokens for one generation run given the prompt text that would be
 * sent (system + user across the stages) and an assumed output size.
 */
export function estimateRunTokens(
  promptTexts: string[],
  assumedOutputTokens = 1200,
): RunTokenEstimate {
  const inputTokens = promptTexts.reduce((sum, t) => sum + estimateTokens(t), 0);
  return {
    inputTokens,
    outputTokens: assumedOutputTokens,
    totalTokens: inputTokens + assumedOutputTokens,
  };
}

/**
 * Convert a token estimate to an approximate cost given per-million-token
 * prices. Prices are inputs (not hard-coded) because they depend on the chosen
 * model and must be confirmed; callers pass the current rates.
 */
export function estimateCostUsd(
  estimate: RunTokenEstimate,
  inputPricePerMTok: number,
  outputPricePerMTok: number,
): number {
  const input = (estimate.inputTokens / 1_000_000) * inputPricePerMTok;
  const output = (estimate.outputTokens / 1_000_000) * outputPricePerMTok;
  return input + output;
}
