import type { ExtractionResult, GenerationInput } from "@/lib/schemas";
import {
  renderGermanyMarketPackRules,
  GERMANY_MARKET_PACK_V0,
} from "@/lib/config/germanyMarketPack";
import type { PromptParts } from "./parseSources";

// Stage 3-4 prompt: given the extracted Source of Truth + parsed job ad, produce
// the Match Analysis (strategy) and a tailored CV. The generation is HARD
// CONSTRAINED to the Source of Truth — this is where Truth Lock is enforced at
// generation time (prevention), before the Day 6 validator (detection).
//
// The cover letter is a separate stage (Day 5).

export function buildAnalysisAndCvPrompt(
  input: GenerationInput,
  extraction: ExtractionResult,
): PromptParts {
  const outputLangName = input.outputLanguage === "de" ? "German" : "English";
  const pack = renderGermanyMarketPackRules(GERMANY_MARKET_PACK_V0);

  const system = [
    "You are NextMove's generation stage for the German job market.",
    "You write a Match Analysis and a tailored CV in professional " + outputLangName + ".",
    "",
    "TRUTH LOCK (absolute): you may ONLY use facts present in the provided",
    "SOURCE OF TRUTH JSON. Never invent or add experience, employers, education,",
    "skills, certificates, achievements, dates, languages, or personal details.",
    "You may rephrase confirmed facts more professionally and reorder them for",
    "relevance, but you must not assert anything not supported by the Source of",
    "Truth. If the job requires something the Source of Truth does not support,",
    "put it under missingOrUnconfirmed — never place it in the CV as fact.",
    "Do not assign a numeric score; classify as strong | partial | gaps.",
    "",
    pack,
    "",
    "Respond with ONLY a single JSON object. No prose, no markdown fences.",
  ].join("\n");

  const user = [
    `Output language: ${outputLangName}.`,
    "",
    "Return JSON with EXACTLY this shape:",
    `{
  "matchAnalysis": {
    "classification": "strong" | "partial" | "gaps",
    "jobTitle": string | null,
    "company": string | null,
    "confirmedStrengths": string[],
    "partialMatches": string[],
    "missingOrUnconfirmed": string[],
    "germanMarketNotes": string[],
    "clarificationQuestions": string[]
  },
  "cv": string
}`,
    "",
    "The CV must be plain structured text following the Germany Market Pack: a",
    "clear reverse-chronological structure with sections separated, consistent",
    "MM/YYYY dates, formal tone, concise. Use ONLY Source of Truth facts.",
    "",
    "=== SOURCE OF TRUTH (the only facts you may use) ===",
    JSON.stringify(extraction.sourceOfTruth, null, 2),
    "",
    "=== PARSED JOB ADVERTISEMENT ===",
    JSON.stringify(extraction.parsedJobAd, null, 2),
  ].join("\n");

  return { system, user };
}
