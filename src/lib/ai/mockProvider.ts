import type {
  AIProvider,
  AnalysisAndCv,
  ExtractionResult,
  GenerationInput,
  GenerationResult,
  JobAdLanguage,
} from "./types";
import type {
  GeneratedDocuments,
  ParsedJobAd,
  SourceOfTruth,
  TruthLockReport,
} from "@/lib/schemas";
import { runPipeline } from "./orchestrator";

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

  /**
   * Deterministic Stage 5 cover letter, built ONLY from the Source of Truth.
   * The recipient is never invented: when unknown it is marked with a bracketed
   * placeholder, per the Germany Market Pack.
   */
  async writeCoverLetter(
    input: GenerationInput,
    extraction: ExtractionResult,
  ): Promise<string> {
    return renderMockCoverLetter(
      extraction.sourceOfTruth,
      extraction.parsedJobAd,
      input.outputLanguage === "de",
    );
  }

  /**
   * Stage 6 (Layer B), mock: the mock has no semantic model, and its generated
   * documents use only Source-of-Truth facts, so the semantic layer reports
   * nothing. The deterministic numeric guardrail (Layer C) still runs in the
   * orchestrator and can still raise flags.
   */
  async validateTruth(
    _sourceOfTruth: SourceOfTruth,
    _documents: GeneratedDocuments,
  ): Promise<TruthLockReport> {
    return { passed: true, flags: [] };
  }

  /** Full pipeline via the shared orchestrator (extract -> analyse+CV -> letter). */
  async generate(input: GenerationInput): Promise<GenerationResult> {
    return runPipeline(this, input);
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

/**
 * Render a plain-text cover letter from the Source of Truth ONLY. Connects the
 * first confirmed role to the job title; never invents a recipient or company
 * knowledge. Missing details are shown as bracketed placeholders.
 */
function renderMockCoverLetter(sot: SourceOfTruth, job: ParsedJobAd, de: boolean): string {
  const role = job.jobTitle ?? (de ? "die ausgeschriebene Stelle" : "the advertised role");
  const company = job.company ?? (de ? "[Unternehmen nicht angegeben]" : "[company not provided]");
  const firstRole = sot.workExperience[0]?.title;
  const name = sot.personalInfo.name ?? (de ? "[Name nicht angegeben]" : "[name not provided]");
  const recipient = de ? "[Empfänger nicht angegeben]" : "[recipient not provided]";

  if (de) {
    return [
      "[MOCK ANSCHREIBEN — DE]",
      "",
      recipient,
      "",
      "Sehr geehrte Damen und Herren,",
      "",
      `hiermit bewerbe ich mich auf ${role} bei ${company}.`,
      firstRole
        ? `Meine bisherige Tätigkeit als ${firstRole} ist für diese Position relevant.`
        : "[Bitte bestätigen oder ergänzen Sie Ihre relevante Erfahrung.]",
      "",
      "Mit freundlichen Grüßen",
      name,
    ].join("\n");
  }

  return [
    "[MOCK COVER LETTER — EN]",
    "",
    recipient,
    "",
    "Dear Hiring Team,",
    "",
    `I am writing to apply for ${role} at ${company}.`,
    firstRole
      ? `My experience as ${firstRole} is relevant to this position.`
      : "[Please confirm or provide your relevant experience.]",
    "",
    "Kind regards,",
    name,
  ].join("\n");
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
