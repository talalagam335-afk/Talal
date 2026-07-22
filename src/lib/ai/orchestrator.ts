import type { GenerationInput, GenerationResult } from "@/lib/schemas";
import type { AIProvider } from "./types";

// Shared pipeline orchestrator. Composes a provider's stage methods into the
// final GenerationResult, so the ordering/assembly logic lives in ONE place and
// every provider's generate() delegates here. Day 6 inserts Truth Lock
// validation between generation and assembly.

export async function runPipeline(
  provider: AIProvider,
  input: GenerationInput,
): Promise<GenerationResult> {
  // Stage 1-2: read inputs into the Source of Truth + parsed job ad.
  const extraction = await provider.parseSources(input);

  // Stage 3-4: strategy + CV, constrained to the Source of Truth.
  const { matchAnalysis, cv } = await provider.draftAnalysisAndCv(input, extraction);

  // Stage 5: cover letter, same Truth Lock constraint.
  const coverLetter = await provider.writeCoverLetter(input, extraction);

  // Stage 7: assemble the structured result. (Stage 6, Truth Lock, is Day 6.)
  return {
    matchAnalysis,
    cv,
    coverLetter,
    meta: {
      provider: provider.name,
      outputLanguage: input.outputLanguage,
      detectedJobAdLanguage: extraction.parsedJobAd.language,
    },
  };
}
