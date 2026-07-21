import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  GenerationInput,
  GenerationResult,
  JobAdLanguage,
  MatchClassification,
} from "./types";

/**
 * Live provider backed by the Claude API.
 *
 * Day 1 scope: this proves the real round-trip and the same `AIProvider`
 * contract as the mock. It asks Claude for a single structured JSON object.
 * The full multi-stage pipeline + Truth Lock (Days 3-6) will expand this file
 * ONLY — the rest of the app is insulated by the `AIProvider` interface.
 */
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";

  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || "claude-sonnet-5";
  }

  async generate(input: GenerationInput): Promise<GenerationResult> {
    const outputLangName = input.outputLanguage === "de" ? "German" : "English";

    const system = [
      "You are NextMove, a truthful job-application assistant for the German job market.",
      "Absolute rule (Truth Lock): never invent experience, employers, education, skills,",
      "certificates, achievements, dates, languages, or personal information. Only use facts",
      "present in the user's experience text. If a job requirement is not supported by the",
      "user's experience, list it under missing/unconfirmed — never assert it as fact.",
      "Respond with ONLY a single JSON object, no prose, no markdown fences.",
    ].join(" ");

    const user = [
      `Output language for the CV and cover letter: ${outputLangName}.`,
      "Auto-detect whether the job advertisement is written in German or English.",
      "",
      "Return JSON with exactly this shape:",
      `{
  "matchAnalysis": {
    "classification": "strong" | "partial" | "gaps",
    "jobTitle": string | null,
    "company": string | null,
    "confirmedStrengths": string[],
    "partialMatches": string[],
    "missingOrUnconfirmed": string[],
    "germanMarketNotes": string[],
    "clarificationQuestions": string[]
  },
  "cv": string,
  "coverLetter": string,
  "detectedJobAdLanguage": "de" | "en"
}`,
      "",
      "=== USER EXPERIENCE ===",
      input.experience,
      "",
      "=== JOB ADVERTISEMENT ===",
      input.jobAd,
    ].join("\n");

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });

    const raw = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    const parsed = parseModelJson(raw);

    return {
      matchAnalysis: {
        classification: coerceClassification(parsed?.matchAnalysis?.classification),
        jobTitle: strOrNull(parsed?.matchAnalysis?.jobTitle),
        company: strOrNull(parsed?.matchAnalysis?.company),
        confirmedStrengths: strArray(parsed?.matchAnalysis?.confirmedStrengths),
        partialMatches: strArray(parsed?.matchAnalysis?.partialMatches),
        missingOrUnconfirmed: strArray(parsed?.matchAnalysis?.missingOrUnconfirmed),
        germanMarketNotes: strArray(parsed?.matchAnalysis?.germanMarketNotes),
        clarificationQuestions: strArray(parsed?.matchAnalysis?.clarificationQuestions),
      },
      cv: typeof parsed?.cv === "string" ? parsed.cv : "",
      coverLetter: typeof parsed?.coverLetter === "string" ? parsed.coverLetter : "",
      meta: {
        provider: this.name,
        outputLanguage: input.outputLanguage,
        detectedJobAdLanguage: coerceJobAdLanguage(parsed?.detectedJobAdLanguage),
      },
    };
  }
}

// --- tolerant parsing helpers (the model output is untrusted structurally) ---

function parseModelJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    // Fall back to the first {...} block if the model added stray text.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        /* ignore */
      }
    }
    return {};
  }
}

function coerceClassification(v: unknown): MatchClassification {
  return v === "strong" || v === "partial" || v === "gaps" ? v : "partial";
}

function coerceJobAdLanguage(v: unknown): JobAdLanguage {
  return v === "de" || v === "en" ? v : "unknown";
}

function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
