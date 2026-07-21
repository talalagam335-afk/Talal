import type { AIProvider } from "./types";
import { MockProvider } from "./mockProvider";
import { ClaudeProvider } from "./claudeProvider";

export * from "./types";

/**
 * Provider factory — the single place that decides which concrete AI provider
 * the app uses. Selection rules (server-side only):
 *
 *   1. If AI_PROVIDER is explicitly set, honour it ("mock" | "claude").
 *   2. Otherwise use Claude when ANTHROPIC_API_KEY is present.
 *   3. Otherwise fall back to the mock provider (keeps the slice runnable
 *      with no secret configured).
 *
 * The rest of the codebase calls getAIProvider() and depends only on the
 * AIProvider interface, so replacing the provider never touches the app.
 */
export function getAIProvider(): AIProvider {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim();

  if (forced === "mock") return new MockProvider();
  if (forced === "claude") {
    if (!apiKey) {
      throw new Error("AI_PROVIDER=claude but ANTHROPIC_API_KEY is not set.");
    }
    return new ClaudeProvider(apiKey, model);
  }

  if (apiKey) return new ClaudeProvider(apiKey, model);
  return new MockProvider();
}
