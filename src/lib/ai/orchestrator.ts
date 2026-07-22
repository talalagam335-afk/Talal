import type {
  GeneratedDocuments,
  GenerationInput,
  GenerationResult,
  SourceOfTruth,
  TruthLockReport,
} from "@/lib/schemas";
import type { AIProvider } from "./types";
import { runNumericGuardrail } from "./truthLock";

// Shared pipeline orchestrator. Composes a provider's stage methods into the
// final GenerationResult, so the ordering/assembly logic lives in ONE place and
// every provider's generate() delegates here.

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

  // Stage 6: Truth Lock — deterministic numeric guardrail (Layer C, always on)
  // merged with the provider's independent semantic validator (Layer B).
  const documents: GeneratedDocuments = { cv, coverLetter };
  const truthLock = await runTruthLock(provider, extraction.sourceOfTruth, documents);

  // Stage 7: assemble the structured result.
  return {
    matchAnalysis,
    cv,
    coverLetter,
    truthLock,
    meta: {
      provider: provider.name,
      outputLanguage: input.outputLanguage,
      detectedJobAdLanguage: extraction.parsedJobAd.language,
    },
  };
}

async function runTruthLock(
  provider: AIProvider,
  sourceOfTruth: SourceOfTruth,
  documents: GeneratedDocuments,
): Promise<TruthLockReport> {
  const layerC = runNumericGuardrail(sourceOfTruth, documents); // deterministic
  const layerB = await provider.validateTruth(sourceOfTruth, documents); // semantic
  const flags = [...layerB.flags, ...layerC];
  return { passed: flags.length === 0, flags };
}
