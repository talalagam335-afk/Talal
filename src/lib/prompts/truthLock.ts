import type { GeneratedDocuments, SourceOfTruth } from "@/lib/schemas";
import type { PromptParts } from "./parseSources";

// Truth Lock — Layer B: independent semantic validator (Stage 6).
//
// A SEPARATE model call that did not write the documents. It receives the
// Source of Truth plus the generated CV and cover letter and returns only the
// claims it cannot trace back to the Source of Truth. Keeping the validator
// independent of the writer is what makes it catch the writer's own
// hallucinations. Its task is narrow: compare against a small structured set.

export function buildTruthLockPrompt(
  sot: SourceOfTruth,
  documents: GeneratedDocuments,
): PromptParts {
  const system = [
    "You are NextMove's Truth Lock validator. You did NOT write these documents.",
    "",
    "Your only task: find every factual claim in the CV or cover letter that is",
    "NOT supported by the SOURCE OF TRUTH JSON. A claim is unsupported if the",
    "Source of Truth does not state it (invented employers, roles, dates, skills,",
    "achievements, numbers, qualifications, or company knowledge). Rephrasing a",
    "supported fact more professionally is NOT a violation. Bracketed placeholders",
    "for missing information (e.g. [recipient not provided]) are NOT violations.",
    "",
    "Classify each flag's tag as:",
    "  INFERRED    — plausibly implied but not actually stated",
    "  MISSING     — required but absent, yet asserted as present",
    "  UNSUPPORTED — contradicts or is unrelated to the Source of Truth",
    "",
    "Respond with ONLY a single JSON object. No prose, no markdown fences.",
  ].join("\n");

  const user = [
    "Return JSON with EXACTLY this shape:",
    `{
  "passed": boolean,
  "flags": [
    { "claim": string, "location": "cv" | "coverLetter", "reason": string,
      "tag": "INFERRED" | "MISSING" | "UNSUPPORTED" }
  ]
}`,
    'Set "passed" to true only when "flags" is empty.',
    "",
    "=== SOURCE OF TRUTH (the only supported facts) ===",
    JSON.stringify(sot, null, 2),
    "",
    "=== GENERATED CV ===",
    documents.cv,
    "",
    "=== GENERATED COVER LETTER ===",
    documents.coverLetter,
  ].join("\n");

  return { system, user };
}
