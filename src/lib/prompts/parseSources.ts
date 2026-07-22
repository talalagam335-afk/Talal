import type { GenerationInput } from "@/lib/schemas";

// Stage 1-2 prompt: read the user's experience and the job advertisement and
// return a structured ExtractionResult (Source of Truth + parsed job ad).
//
// This is the foundation of Truth Lock: the Source of Truth captures ONLY what
// the user actually stated. Anything not stated is null / empty — never guessed.
// Document generation (Days 4-5) is later constrained to this extraction.

export interface PromptParts {
  system: string;
  user: string;
}

export function buildParseSourcesPrompt(input: GenerationInput): PromptParts {
  const system = [
    "You are NextMove's extraction stage for the German job market.",
    "Your only job is to READ two inputs and return structured JSON. You do not",
    "write, improve, or invent anything.",
    "",
    "TRUTH LOCK (absolute): the Source of Truth must contain ONLY facts the user",
    "explicitly stated in their experience text. Never infer, guess, or add work",
    "experience, employers, education, skills, certificates, achievements, dates,",
    "languages, or personal information. If something is not stated, use null (for",
    "single values) or an empty array (for lists). Do not translate facts into",
    "other facts.",
    "",
    "The user's experience may be written in Arabic, Turkish, or English. Extract",
    "the facts regardless of input language; keep proper nouns as written.",
    "Auto-detect whether the job advertisement is written in German or English.",
    "",
    "Respond with ONLY a single JSON object. No prose, no markdown fences.",
  ].join("\n");

  const user = [
    "Return JSON with EXACTLY this shape (use null / [] where not stated):",
    `{
  "sourceOfTruth": {
    "personalInfo": { "name": string|null, "email": string|null, "phone": string|null, "location": string|null },
    "workExperience": [
      { "title": string, "employer": string|null, "location": string|null,
        "startDate": string|null, "endDate": string|null,
        "responsibilities": string[], "achievements": string[] }
    ],
    "education": [
      { "qualification": string, "institution": string|null, "field": string|null,
        "startDate": string|null, "endDate": string|null }
    ],
    "skills": string[],
    "languages": [ { "language": string, "level": string|null } ],
    "certificates": string[]
  },
  "parsedJobAd": {
    "jobTitle": string|null,
    "company": string|null,
    "location": string|null,
    "language": "de" | "en",
    "requirements": [ { "text": string, "importance": "must" | "nice" } ],
    "responsibilities": string[]
  }
}`,
    "",
    "=== USER EXPERIENCE (may be Arabic / Turkish / English) ===",
    input.experience,
    "",
    "=== JOB ADVERTISEMENT (German or English — detect it) ===",
    input.jobAd,
  ].join("\n");

  return { system, user };
}
