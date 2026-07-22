import type {
  AIProvider,
  ExtractionResult,
  GenerationInput,
  GenerationResult,
  JobAdLanguage,
} from "./types";

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
