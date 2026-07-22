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
  MatchAnalysis,
  GeneratedDocuments,
  TruthLockFlag,
  TruthLockReport,
  GenerationInput,
  GenerationResult,
} from "@/lib/schemas";

import type { GenerationInput, GenerationResult } from "@/lib/schemas";

/**
 * The single contract every AI provider must satisfy. Swapping providers means
 * writing a new class that implements this interface — nothing else changes.
 */
export interface AIProvider {
  /** Stable identifier, surfaced in result meta for debugging. */
  readonly name: string;
  generate(input: GenerationInput): Promise<GenerationResult>;
}
