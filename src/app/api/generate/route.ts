import { NextResponse } from "next/server";
import { getAIProvider, type GenerationInput, type OutputLanguage } from "@/lib/ai";
import { GenerationResultSchema } from "@/lib/schemas";
import { LIMITS } from "@/lib/server/limits";

// The single secure server-side generation endpoint.
// The API key lives only here (via the provider factory) and is never sent to
// the browser. Runs on the Node.js runtime because the Anthropic SDK needs it.
export const runtime = "nodejs";

interface RawBody {
  experience?: unknown;
  jobAd?: unknown;
  outputLanguage?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: RawBody;
  try {
    body = (await request.json()) as RawBody;
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const validation = validate(body);
  if ("error" in validation) {
    return badRequest(validation.error);
  }

  try {
    const provider = getAIProvider();
    const result = await provider.generate(validation.input);

    // Validate the provider's structured output before returning it. This
    // guards against malformed AI JSON (relevant once the live provider runs).
    const checked = GenerationResultSchema.safeParse(result);
    if (!checked.success) {
      console.error("[/api/generate] invalid provider output:", checked.error.issues);
      return NextResponse.json(
        { error: "Generation produced an unexpected result. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json(checked.data, { status: 200 });
  } catch (err) {
    // Basic error handling (scope §10). Never leak internals/keys to client.
    console.error("[/api/generate] provider error:", err);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 502 },
    );
  }
}

function validate(
  body: RawBody,
): { input: GenerationInput } | { error: string } {
  const experience = typeof body.experience === "string" ? body.experience.trim() : "";
  const jobAd = typeof body.jobAd === "string" ? body.jobAd.trim() : "";
  const outputLanguage = body.outputLanguage;

  if (outputLanguage !== "de" && outputLanguage !== "en") {
    return { error: "outputLanguage must be 'de' or 'en'." };
  }
  if (experience.length < LIMITS.minChars) {
    return { error: `Experience is too short (min ${LIMITS.minChars} characters).` };
  }
  if (jobAd.length < LIMITS.minChars) {
    return { error: `Job advertisement is too short (min ${LIMITS.minChars} characters).` };
  }
  if (experience.length > LIMITS.experienceMaxChars) {
    return { error: `Experience exceeds ${LIMITS.experienceMaxChars} characters.` };
  }
  if (jobAd.length > LIMITS.jobAdMaxChars) {
    return { error: `Job advertisement exceeds ${LIMITS.jobAdMaxChars} characters.` };
  }

  return {
    input: { experience, jobAd, outputLanguage: outputLanguage as OutputLanguage },
  };
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}
