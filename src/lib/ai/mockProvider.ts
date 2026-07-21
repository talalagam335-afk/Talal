import type {
  AIProvider,
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
