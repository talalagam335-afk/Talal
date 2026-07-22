import type { GeneratedDocuments, SourceOfTruth, TruthLockFlag } from "@/lib/schemas";

// ---------------------------------------------------------------------------
// Truth Lock — Layer C: deterministic numeric guardrail (no AI).
//
// Dates and numeric quantities are exactly what a model is most likely to
// invent and what a reviewer cares most about. This cheap check extracts every
// year / MM-YYYY date / multi-digit number from the generated documents and
// flags any that do NOT appear in the Source of Truth. It runs on every request
// regardless of provider, alongside the semantic Layer B validator.
//
// Deliberately conservative: single digits are ignored (too noisy) and this is
// substring matching, not semantic understanding — that is Layer B's job.
// ---------------------------------------------------------------------------

export function runNumericGuardrail(
  sot: SourceOfTruth,
  documents: GeneratedDocuments,
): TruthLockFlag[] {
  const haystack = buildHaystack(sot);
  const flags: TruthLockFlag[] = [];

  const docs: [TruthLockFlag["location"], string][] = [
    ["cv", documents.cv],
    ["coverLetter", documents.coverLetter],
  ];

  for (const [location, text] of docs) {
    for (const token of extractNumericTokens(text)) {
      if (!haystack.includes(token.toLowerCase())) {
        flags.push({
          claim: token,
          location,
          reason: `The number "${token}" appears in the ${location} but is not present in the Source of Truth.`,
          tag: "UNSUPPORTED",
        });
      }
    }
  }

  return flags;
}

/** Flatten every string value of the Source of Truth into one lowercased blob. */
function buildHaystack(sot: SourceOfTruth): string {
  const parts: string[] = [];
  const p = sot.personalInfo;
  parts.push(p.name ?? "", p.email ?? "", p.phone ?? "", p.location ?? "");

  for (const w of sot.workExperience) {
    parts.push(
      w.title,
      w.employer ?? "",
      w.location ?? "",
      w.startDate ?? "",
      w.endDate ?? "",
      ...w.responsibilities,
      ...w.achievements,
    );
  }
  for (const e of sot.education) {
    parts.push(e.qualification, e.institution ?? "", e.field ?? "", e.startDate ?? "", e.endDate ?? "");
  }
  parts.push(...sot.skills);
  for (const l of sot.languages) parts.push(l.language, l.level ?? "");
  parts.push(...sot.certificates);

  return parts.join(" ").toLowerCase();
}

/**
 * Extract candidate numeric tokens: MM/YYYY dates, and any run of 2+ digits.
 * The MM/YYYY alternative is listed first so a date is captured whole rather
 * than split into its parts. Duplicates are removed, order preserved.
 */
function extractNumericTokens(text: string): string[] {
  const matches = text.match(/\d{1,2}\/\d{4}|\d{2,}/g) ?? [];
  return Array.from(new Set(matches));
}
