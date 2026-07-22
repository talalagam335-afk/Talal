import { z } from "zod";

// ---------------------------------------------------------------------------
// NextMove pipeline data contract (Day 2).
//
// Zod schemas are the single source of truth for every structured object that
// flows through the AI pipeline. TypeScript types are DERIVED from them via
// z.infer, so the runtime validators and the compile-time types can never drift
// apart. Providers, the API route, and the UI all depend on these types.
//
// Day 2 defines the FULL contract (including stages not yet produced by the
// Day 1 providers — SourceOfTruth, ParsedJobAd, GeneratedDocuments, Truth Lock).
// Later days fill these in; nothing here changes runtime behaviour today.
// ---------------------------------------------------------------------------

// --- primitive enums --------------------------------------------------------

/** Language of the generated documents (user-selected). */
export const OutputLanguageSchema = z.enum(["de", "en"]);
export type OutputLanguage = z.infer<typeof OutputLanguageSchema>;

/** Language auto-detected from the pasted job advertisement. */
export const JobAdLanguageSchema = z.enum(["de", "en", "unknown"]);
export type JobAdLanguage = z.infer<typeof JobAdLanguageSchema>;

/** Coarse match classification. Scope §5 forbids a fake numeric score. */
export const MatchClassificationSchema = z.enum(["strong", "partial", "gaps"]);
export type MatchClassification = z.infer<typeof MatchClassificationSchema>;

/**
 * Truth Lock information tags (scope §6). Every piece of information is one of:
 *  - CONFIRMED: directly stated in the user's experience
 *  - REPHRASED: the same confirmed fact expressed more professionally
 *  - INFERRED:  a reasonable possibility — must be shown as a question, never asserted
 *  - MISSING:   required by the job ad but unsupported by the user's information
 */
export const TruthTagSchema = z.enum(["CONFIRMED", "REPHRASED", "INFERRED", "MISSING"]);
export type TruthTag = z.infer<typeof TruthTagSchema>;

// --- Stage 1: Source of Truth (extracted from the user's experience) --------
// By definition every fact here is CONFIRMED — directly stated by the user.
// Nullable fields mean "not stated", never "invented".

export const WorkExperienceSchema = z.object({
  title: z.string(),
  employer: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  responsibilities: z.array(z.string()),
  achievements: z.array(z.string()),
});
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;

export const EducationSchema = z.object({
  qualification: z.string(),
  institution: z.string().nullable(),
  field: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});
export type Education = z.infer<typeof EducationSchema>;

export const LanguageSkillSchema = z.object({
  language: z.string(),
  /** e.g. "native", "C1", "fluent" — only if the user stated it. */
  level: z.string().nullable(),
});
export type LanguageSkill = z.infer<typeof LanguageSkillSchema>;

export const SourceOfTruthSchema = z.object({
  personalInfo: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
  }),
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(z.string()),
  languages: z.array(LanguageSkillSchema),
  certificates: z.array(z.string()),
});
export type SourceOfTruth = z.infer<typeof SourceOfTruthSchema>;

// --- Stage 2: Parsed job advertisement --------------------------------------

export const JobRequirementSchema = z.object({
  text: z.string(),
  /** "must" = hard requirement, "nice" = nice-to-have. */
  importance: z.enum(["must", "nice"]),
});
export type JobRequirement = z.infer<typeof JobRequirementSchema>;

export const ParsedJobAdSchema = z.object({
  jobTitle: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  language: JobAdLanguageSchema,
  requirements: z.array(JobRequirementSchema),
  responsibilities: z.array(z.string()),
});
export type ParsedJobAd = z.infer<typeof ParsedJobAdSchema>;

// --- Stages 1-2 combined: extraction result ---------------------------------
// The output of the extraction pass — the Source of Truth plus the parsed job
// advertisement. This is the "read the inputs" half of the pipeline and is
// tested in isolation before any document is generated.

export const ExtractionResultSchema = z.object({
  sourceOfTruth: SourceOfTruthSchema,
  parsedJobAd: ParsedJobAdSchema,
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

/** Safe-parse an unknown value (e.g. AI output) as an ExtractionResult. */
export function parseExtractionResult(data: unknown) {
  return ExtractionResultSchema.safeParse(data);
}

// --- Stage 3: Match analysis (Screen 3, tab 1) ------------------------------
// NOTE: shape is kept identical to the Day 1 contract so existing providers
// remain valid without changes.

export const MatchAnalysisSchema = z.object({
  classification: MatchClassificationSchema,
  jobTitle: z.string().nullable(),
  company: z.string().nullable(),
  confirmedStrengths: z.array(z.string()),
  partialMatches: z.array(z.string()),
  missingOrUnconfirmed: z.array(z.string()),
  germanMarketNotes: z.array(z.string()),
  clarificationQuestions: z.array(z.string()),
});
export type MatchAnalysis = z.infer<typeof MatchAnalysisSchema>;

// --- Stages 4-5: Generated documents ----------------------------------------

export const GeneratedDocumentsSchema = z.object({
  /** Tailored CV as plain structured text. */
  cv: z.string(),
  /** Tailored cover letter as plain text. */
  coverLetter: z.string(),
});
export type GeneratedDocuments = z.infer<typeof GeneratedDocumentsSchema>;

// --- Stage 6: Truth Lock validation report ----------------------------------

export const TruthLockFlagSchema = z.object({
  /** The exact unsupported claim as it appears in the generated text. */
  claim: z.string(),
  /** Which document the claim was found in. */
  location: z.enum(["cv", "coverLetter"]),
  /** Why it is unsupported (not traceable to the Source of Truth). */
  reason: z.string(),
  /** How the claim relates to the truth model. */
  tag: z.enum(["INFERRED", "MISSING", "UNSUPPORTED"]),
});
export type TruthLockFlag = z.infer<typeof TruthLockFlagSchema>;

export const TruthLockReportSchema = z.object({
  /** true when no unsupported claims were found. */
  passed: z.boolean(),
  flags: z.array(TruthLockFlagSchema),
});
export type TruthLockReport = z.infer<typeof TruthLockReportSchema>;

// --- API boundary: input + final result -------------------------------------

/** Input the user submits from Screen 1. */
export const GenerationInputSchema = z.object({
  experience: z.string(),
  jobAd: z.string(),
  outputLanguage: OutputLanguageSchema,
});
export type GenerationInput = z.infer<typeof GenerationInputSchema>;

/**
 * The structured result returned to the browser.
 * `truthLock` is optional so Day 1 providers (which do not run validation yet)
 * remain valid; it becomes populated from Day 6.
 */
export const GenerationResultSchema = z.object({
  matchAnalysis: MatchAnalysisSchema,
  cv: z.string(),
  coverLetter: z.string(),
  truthLock: TruthLockReportSchema.optional(),
  meta: z.object({
    provider: z.string(),
    outputLanguage: OutputLanguageSchema,
    detectedJobAdLanguage: JobAdLanguageSchema,
  }),
});
export type GenerationResult = z.infer<typeof GenerationResultSchema>;

// --- validation helpers -----------------------------------------------------

/** Safe-parse an unknown value (e.g. AI output) as a GenerationResult. */
export function parseGenerationResult(data: unknown) {
  return GenerationResultSchema.safeParse(data);
}
