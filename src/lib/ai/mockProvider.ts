import type {
  AIProvider,
  AnalysisAndCv,
  ExtractionResult,
  GenerationInput,
  GenerationResult,
  JobAdLanguage,
} from "./types";
import type { SourceOfTruth } from "@/lib/schemas";

/**
 * Deterministic mock provider used for Day 1 and for local development without
 * an API key. It returns a well-formed `GenerationResult` so the entire
 * vertical slice (form -> endpoint -> structured JSON -> render) can be
 * exercised end-to-end. It intentionally does NOT call any external service.
 *
 * The mock is deliberately truthful about being a mock: it never fabricates CV
 * facts. It echoes back short, clearly-labelled placeholder content derived
 * from the user's own input.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";

  /**
   * Deterministic Stage 1-2 extraction. It does NOT fabricate structured facts
   * (that would violate Truth Lock, even in a mock): personal info, education,
   * skills, and languages come back empty because the mock does not parse them.
   * It only echoes the first line of each input as a single, clearly-derived
   * placeholder so the shape is exercised and tests are reproducible.
   */
  async parseSources(input: GenerationInput): Promise<ExtractionResult> {
    const expLine = firstLine(input.experience);
    const jobLine = firstLine(input.jobAd);
    const language = detectJobAdLanguage(input.jobAd);

    return {
      sourceOfTruth: {
        personalInfo: { name: null, email: null, phone: null, location: null },
        workExperience: expLine
          ? [
              {
                title: expLine,
                employer: null,
                location: null,
                startDate: null,
                endDate: null,
                responsibilities: [],
                achievements: [],
              },
            ]
          : [],
        education: [],
        skills: [],
        languages: [],
        certificates: [],
      },
      parsedJobAd: {
        jobTitle: null,
        company: null,
        location: null,
        language,
        requirements: jobLine ? [{ text: jobLine, importance: "must" }] : [],
        responsibilities: [],
      },
    };
  }

  /**
   * Deterministic Stage 3-4 generation. The CV is assembled ONLY from the
   * Source of Truth (nothing invented), following the Germany Market Pack
   * section order; the analysis is derived from the extraction. Classification
   * is a fixed "partial" because real judgement needs the live model.
   */
  async draftAnalysisAndCv(
    input: GenerationInput,
    extraction: ExtractionResult,
  ): Promise<AnalysisAndCv> {
    const de = input.outputLanguage === "de";
    const sot = extraction.sourceOfTruth;
    const job = extraction.parsedJobAd;

    const confirmedStrengths = sot.workExperience
      .map((w) => w.title)
      .filter((t) => t.length > 0);
    const missingOrUnconfirmed = job.requirements
      .filter((r) => r.importance === "must")
      .map((r) => r.text);

    return {
      matchAnalysis: {
        classification: "partial",
        jobTitle: job.jobTitle,
        company: job.company,
        confirmedStrengths,
        partialMatches: [],
        missingOrUnconfirmed,
        germanMarketNotes: [
          de
            ? "(Mock) Germany Market Pack angewendet: formeller Ton, umgekehrt chronologische Struktur, einheitliches MM/JJJJ-Datumsformat."
            : "(Mock) Germany Market Pack applied: formal tone, reverse-chronological structure, consistent MM/YYYY dates.",
        ],
        clarificationQuestions: [
          de
            ? "Bitte bestätigen oder ergänzen Sie diese Information."
            : "Please confirm or provide this information.",
        ],
      },
      cv: renderMockCv(sot, de),
    };
  }

  async generate(input: GenerationInput): Promise<GenerationResult> {
    const detectedJobAdLanguage = detectJobAdLanguage(input.jobAd);
    const de = input.outputLanguage === "de";

    const excerpt = firstLine(input.experience) || "(no experience provided)";
    const jobExcerpt = firstLine(input.jobAd) || "(no job advertisement provided)";

    return {
      matchAnalysis: {
        classification: "partial",
        jobTitle: null,
        company: null,
        confirmedStrengths: [
          de
            ? "Platzhalter: bestätigte Stärke aus der Erfahrung des Nutzers."
            : "Placeholder: a confirmed strength drawn from the user's experience.",
        ],
        partialMatches: [
          de ? "Platzhalter: teilweise Übereinstimmung." : "Placeholder: a partial match.",
        ],
        missingOrUnconfirmed: [
          de
            ? "Platzhalter: fehlende oder unbestätigte Anforderung."
            : "Placeholder: a missing or unconfirmed requirement.",
        ],
        germanMarketNotes: [
          de
            ? "Platzhalter: Hinweis zur Anpassung an den deutschen Arbeitsmarkt."
            : "Placeholder: a note about adaptation to the German job market.",
        ],
        clarificationQuestions: [
          de
            ? "Bitte bestätigen oder ergänzen Sie diese Information."
            : "Please confirm or provide this information.",
        ],
      },
      cv: [
        `[MOCK ${de ? "LEBENSLAUF" : "CV"} — Day 1 vertical slice]`,
        "",
        de ? "Erfahrung (Auszug):" : "Experience (excerpt):",
        `  ${excerpt}`,
      ].join("\n"),
      coverLetter: [
        `[MOCK ${de ? "ANSCHREIBEN" : "COVER LETTER"} — Day 1 vertical slice]`,
        "",
        de ? "Stelle (Auszug):" : "Position (excerpt):",
        `  ${jobExcerpt}`,
      ].join("\n"),
      meta: {
        provider: this.name,
        outputLanguage: input.outputLanguage,
        detectedJobAdLanguage,
      },
    };
  }
}

/**
 * Render a plain-text CV from the Source of Truth ONLY, in Germany Market Pack
 * section order. Empty sections are shown as "(none provided)" rather than
 * filled with invented content — Truth Lock applies even in the mock.
 */
function renderMockCv(sot: SourceOfTruth, de: boolean): string {
  const none = de ? "(nicht angegeben)" : "(none provided)";
  const L = de
    ? {
        header: "[MOCK LEBENSLAUF — DE]",
        name: "(Name nicht angegeben)",
        experience: "BERUFSERFAHRUNG",
        skills: "KENNTNISSE",
        languages: "SPRACHEN",
        education: "AUSBILDUNG",
      }
    : {
        header: "[MOCK CV — EN]",
        name: "(name not provided)",
        experience: "PROFESSIONAL EXPERIENCE",
        skills: "SKILLS",
        languages: "LANGUAGES",
        education: "EDUCATION",
      };

  const lines: string[] = [L.header, ""];
  lines.push(sot.personalInfo.name ?? L.name);
  const contact = [sot.personalInfo.location, sot.personalInfo.email, sot.personalInfo.phone]
    .filter((x): x is string => !!x)
    .join(" · ");
  if (contact) lines.push(contact);

  lines.push("", L.experience);
  if (sot.workExperience.length === 0) {
    lines.push(`  ${none}`);
  } else {
    for (const w of sot.workExperience) {
      const dates = [w.startDate, w.endDate].filter(Boolean).join(" – ");
      const head = [w.title, w.employer, w.location].filter(Boolean).join(", ");
      lines.push(`  ${head}${dates ? ` (${dates})` : ""}`);
      for (const r of w.responsibilities) lines.push(`    - ${r}`);
    }
  }

  lines.push("", L.skills, `  ${sot.skills.length ? sot.skills.join(", ") : none}`);
  lines.push(
    "",
    L.languages,
    `  ${
      sot.languages.length
        ? sot.languages.map((l) => (l.level ? `${l.language} (${l.level})` : l.language)).join(", ")
        : none
    }`,
  );
  lines.push("", L.education);
  if (sot.education.length === 0) {
    lines.push(`  ${none}`);
  } else {
    for (const e of sot.education) {
      const dates = [e.startDate, e.endDate].filter(Boolean).join(" – ");
      const head = [e.qualification, e.field, e.institution].filter(Boolean).join(", ");
      lines.push(`  ${head}${dates ? ` (${dates})` : ""}`);
    }
  }

  return lines.join("\n");
}

/** First non-empty line of a block of text, trimmed and length-capped. */
function firstLine(text: string): string {
  const line = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) return "";
  return line.length > 160 ? `${line.slice(0, 157)}...` : line;
}

/**
 * Very light heuristic job-ad language detection for the mock. The real
 * providers will let the model detect language; this keeps the mock
 * self-contained. Looks for common German-only characters/stopwords.
 */
function detectJobAdLanguage(jobAd: string): JobAdLanguage {
  const text = jobAd.toLowerCase();
  if (!text.trim()) return "unknown";
  const germanSignals = [
    "ä",
    "ö",
    "ü",
    "ß",
    " und ",
    " oder ",
    " mit ",
    " für ",
    " sie ",
    " wir ",
    "aufgaben",
    "kenntnisse",
    "erfahrung",
    "bewerbung",
  ];
  const hits = germanSignals.filter((s) => text.includes(s)).length;
  return hits >= 2 ? "de" : "en";
}
