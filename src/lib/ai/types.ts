// Public AI-module types.
//
// The domain/data types now live in the Zod-backed contract at
// "@/lib/schemas" (single source of truth). This module re-exports them so the
// existing `@/lib/ai` / `@/lib/ai/types` import paths keep working, and adds the
// provider-facing `AIProvider` interface.

export type {
  OutputLanguage,
  JobAdLanguage,
  MatchClassification,
  TruthTag,
  SourceOfTruth,
  ParsedJobAd,
  JobRequirement,
  ExtractionResult,
  MatchAnalysis,
  AnalysisAndCv,
  GeneratedDocuments,
  TruthLockFlag,
  TruthLockReport,
  GenerationInput,
  GenerationResult,
} from "@/lib/schemas";

import type {
  GenerationInput,
  GenerationResult,
  ExtractionResult,
  AnalysisAndCv,
} from "@/lib/schemas";

/**
 * The single contract every AI provider must satisfy. Swapping providers means
 * writing a new class that implements this interface — nothing else changes.
 */
export interface AIProvider {
  /** Stable identifier, surfaced in result meta for debugging. */
  readonly name: string;

  /**
   * Stage 1-2: read the experience + job ad into a structured ExtractionResult
   * (Source of Truth + parsed job ad). Truthful extraction only — nothing is
   * invented. Document generation is later constrained to this output.
   */
  parseSources(input: GenerationInput): Promise<ExtractionResult>;

  /**
   * Stage 3-4: from the extracted sources, produce the Match Analysis (strategy)
   * and the tailored CV, constrained to the Source of Truth and the Germany
   * Market Pack. The cover letter is a separate stage (Day 5).
   */
  draftAnalysisAndCv(
    input: GenerationInput,
    extraction: ExtractionResult,
  ): Promise<AnalysisAndCv>;

  /**
   * Stage 5: from the extracted sources, produce the tailored cover letter,
   * constrained to the Source of Truth. Returns the letter text.
   */
  writeCoverLetter(
    input: GenerationInput,
    extraction: ExtractionResult,
  ): Promise<string>;

  /** Full pipeline: produce the final structured result for the browser. */
  generate(input: GenerationInput): Promise<GenerationResult>;
}
