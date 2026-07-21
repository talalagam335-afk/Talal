// Domain + provider-contract types for the NextMove AI service layer.
//
// The rest of the application depends ONLY on these types and on the
// `AIProvider` interface below — never on a concrete provider (Claude, mock,
// or any future replacement). This is the isolation boundary that lets the AI
// provider be swapped without touching the app.

export type OutputLanguage = "de" | "en";

/** Language auto-detected from the pasted job advertisement. */
export type JobAdLanguage = "de" | "en" | "unknown";

/** Coarse match classification. The scope forbids a fake numeric score. */
export type MatchClassification = "strong" | "partial" | "gaps";

/** Input the user provides on Screen 1. */
export interface GenerationInput {
  /** Pasted CV / free-text professional experience. */
  experience: string;
  /** Pasted full job advertisement. */
  jobAd: string;
  /** Desired language of the generated documents. */
  outputLanguage: OutputLanguage;
}

/** The Match Analysis block (Screen 3, tab 1). */
export interface MatchAnalysis {
  classification: MatchClassification;
  jobTitle: string | null;
  company: string | null;
  confirmedStrengths: string[];
  partialMatches: string[];
  missingOrUnconfirmed: string[];
  germanMarketNotes: string[];
  clarificationQuestions: string[];
}

/** The full structured result returned to the browser. */
export interface GenerationResult {
  matchAnalysis: MatchAnalysis;
  /** Tailored CV as plain structured text. */
  cv: string;
  /** Tailored cover letter as plain text. */
  coverLetter: string;
  meta: {
    /** Which provider produced this result ("mock" | "claude"). */
    provider: string;
    outputLanguage: OutputLanguage;
    detectedJobAdLanguage: JobAdLanguage;
  };
}

/**
 * The single contract every AI provider must satisfy. Swapping providers means
 * writing a new class that implements this interface — nothing else changes.
 */
export interface AIProvider {
  /** Stable identifier, surfaced in result meta for debugging. */
  readonly name: string;
  generate(input: GenerationInput): Promise<GenerationResult>;
}
