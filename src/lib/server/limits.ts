// Basic input-length limits (scope §10: "Basic input length limits").
// Kept as plain constants so they are easy to tune during testing.

export const LIMITS = {
  /** Max characters accepted for the experience field. */
  experienceMaxChars: 12_000,
  /** Max characters accepted for the job advertisement field. */
  jobAdMaxChars: 12_000,
  /** Minimum characters before we bother calling the AI. */
  minChars: 20,
} as const;
