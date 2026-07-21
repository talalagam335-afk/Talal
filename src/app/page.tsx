"use client";

import { useState } from "react";
import type { GenerationResult, OutputLanguage } from "@/lib/ai/types";

// Day 1 vertical slice: input form -> secure endpoint -> structured result
// rendered raw. The full 3-screen flow (Processing screen, tabbed Results,
// Copy / Regenerate / Return) arrives on Days 7-8.
export default function Home() {
  const [experience, setExperience] = useState("");
  const [jobAd, setJobAd] = useState("");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("de");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience, jobAd, outputLanguage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
      } else {
        setResult(data as GenerationResult);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = experience.trim().length > 0 && jobAd.trim().length > 0 && !loading;

  return (
    <main>
      <h1 className="brand">NextMove</h1>
      <p className="promise">
        Give us your real experience and the job you want. NextMove creates a
        stronger, honest application adapted to the German hiring market.
      </p>

      <div className="field">
        <label htmlFor="experience">Your experience</label>
        <textarea
          id="experience"
          placeholder="Paste your CV or describe your professional experience…"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        />
        <div className="hint">
          Arabic, Turkish, or English accepted. Paste as plain text.
        </div>
      </div>

      <div className="field">
        <label htmlFor="jobAd">Job advertisement</label>
        <textarea
          id="jobAd"
          placeholder="Paste the full job advertisement (German or English)…"
          value={jobAd}
          onChange={(e) => setJobAd(e.target.value)}
        />
        <div className="hint">Language is detected automatically.</div>
      </div>

      <div className="field">
        <label htmlFor="outputLanguage">Output language</label>
        <select
          id="outputLanguage"
          value={outputLanguage}
          onChange={(e) => setOutputLanguage(e.target.value as OutputLanguage)}
        >
          <option value="de">German</option>
          <option value="en">English</option>
        </select>
      </div>

      <button onClick={handleGenerate} disabled={!canSubmit}>
        {loading ? "Analyzing…" : "Analyze and Generate"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <h2>Result (raw — Day 1 slice)</h2>
          <p className="hint">
            Provider: <strong>{result.meta.provider}</strong> · Output:{" "}
            {result.meta.outputLanguage} · Detected job-ad language:{" "}
            {result.meta.detectedJobAdLanguage}
          </p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
