import Anthropic from "@anthropic-ai/sdk";
import {
  ExtractionResultSchema,
  AnalysisAndCvSchema,
  CoverLetterSchema,
  type AnalysisAndCv,
  type ExtractionResult,
} from "@/lib/schemas";
import { buildParseSourcesPrompt } from "@/lib/prompts/parseSources";
import {
  buildAnalysisAndCvPrompt,
  buildCoverLetterPrompt,
} from "@/lib/prompts/generateDocuments";
import { extractJsonObject } from "./json";
import { runPipeline } from "./orchestrator";
import type { AIProvider, GenerationInput, GenerationResult } from "./types";

/**
 * Live provider backed by the Claude API.
 *
 * Same `AIProvider` contract as the mock. The rest of the app is insulated by
 * that interface, so expanding this file never touches the app. Each stage is a
 * schema-validated Messages round-trip; generate() delegates to the shared
 * orchestrator (extract -> analyse+CV -> cover letter).
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
      throw new Error(schemaError("extraction", check.error.issues));
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
      throw new Error(schemaError("generation", check.error.issues));
    }
    return check.data;
  }

  /** Stage 5: cover letter, constrained to the Source of Truth. */
  async writeCoverLetter(
    input: GenerationInput,
    extraction: ExtractionResult,
  ): Promise<string> {
    const { system, user } = buildCoverLetterPrompt(input, extraction);
    const raw = await this.callModelForText(system, user, 2048);
    const parsed = extractJsonObject(raw);

    const check = CoverLetterSchema.safeParse(parsed);
    if (!check.success) {
      throw new Error(schemaError("cover letter", check.error.issues));
    }
    return check.data.coverLetter;
  }

  /** Full pipeline via the shared orchestrator. */
  async generate(input: GenerationInput): Promise<GenerationResult> {
    return runPipeline(this, input);
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

function schemaError(
  stage: string,
  issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): string {
  return `Claude ${stage} returned an invalid shape: ${issues
    .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
    .join("; ")}`;
}
