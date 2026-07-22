import Anthropic from "@anthropic-ai/sdk";
import {
  ExtractionResultSchema,
  AnalysisAndCvSchema,
  type AnalysisAndCv,
  type ExtractionResult,
  type JobAdLanguage,
  type MatchClassification,
} from "@/lib/schemas";
import { buildParseSourcesPrompt } from "@/lib/prompts/parseSources";
import { buildAnalysisAndCvPrompt } from "@/lib/prompts/generateDocuments";
import { extractJsonObject } from "./json";
import type { AIProvider, GenerationInput, GenerationResult } from "./types";

/**
 * Live provider backed by the Claude API.
 *
 * Same `AIProvider` contract as the mock. The rest of the app is insulated by
 * that interface, so expanding this file (Days 3-6) never touches the app.
 * Day 3 adds the real Stage 1-2 extraction (`parseSources`).
 */
export class ClaudeProvider implements AIProvider {
  readonly name = "claude";

  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || "claude-sonnet-5";
  }

  /** Stage 1-2: extract Source of Truth + parsed job ad, validated by schema. */
  async parseSources(input: GenerationInput): Promise<ExtractionResult> {
    const { system, user } = buildParseSourcesPrompt(input);
    const raw = await this.callModelForText(system, user, 4096);
    const parsed = extractJsonObject(raw);

    const check = ExtractionResultSchema.safeParse(parsed);
    if (!check.success) {
      throw new Error(
        `Claude extraction returned an invalid shape: ${check.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
    }
    return check.data;
  }

  /** Stage 3-4: Match Analysis + CV, constrained to the Source of Truth. */
  async draftAnalysisAndCv(
    input: GenerationInput,
    extraction: ExtractionResult,
  ): Promise<AnalysisAndCv> {
    const { system, user } = buildAnalysisAndCvPrompt(input, extraction);
    const raw = await this.callModelForText(system, user, 4096);
    const parsed = extractJsonObject(raw);

    const check = AnalysisAndCvSchema.safeParse(parsed);
    if (!check.success) {
      throw new Error(
        `Claude generation returned an invalid shape: ${check.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
    }
    return check.data;
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

    const raw = await this.callModelForText(system, user, 4096);
    const parsed = extractJsonObject(raw) as any;

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

  /** Single Messages API round-trip that returns concatenated text blocks. */
  private async callModelForText(
    system: string,
    user: string,
    maxTokens: number,
  ): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    return message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
  }
}

// --- tolerant coercion helpers (model output is untrusted structurally) ------

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
