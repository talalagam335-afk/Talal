// ---------------------------------------------------------------------------
// Germany Market Pack v0 (scope §7).
//
// A STATIC, conservative configuration of the rules that adapt an application
// to the German hiring market. It is plain data so that (a) later prompt stages
// can inject it verbatim, and (b) it is trivial to review and tune during
// testing. No logic, no market packs beyond Germany (scope forbids others).
// ---------------------------------------------------------------------------

export interface GermanyMarketPack {
  id: string;
  version: string;
  market: "germany";
  tone: string;
  cv: {
    structure: string;
    dateFormat: string;
    dateFormatExample: string;
    sections: string[];
    /** Length target only — no PDF/pagination in scope; used as guidance. */
    lengthTargetPages: string;
  };
  coverLetter: {
    lengthTargetPages: string;
    missingRecipientRule: string;
  };
  /** Positive rules the generator should follow. */
  rules: string[];
  /** Hard prohibitions the generator must never violate. */
  prohibitions: string[];
  personalDetails: {
    /** Details that must NEVER be auto-added (only via user confirmation). */
    neverAutoAdd: string[];
    note: string;
  };
}

export const GERMANY_MARKET_PACK_V0: GermanyMarketPack = {
  id: "germany-market-pack",
  version: "v0",
  market: "germany",
  tone: "Formal and professional.",
  cv: {
    structure: "Reverse-chronological (most recent experience first).",
    dateFormat: "MM/YYYY, applied consistently to every date.",
    dateFormatExample: "03/2021 – 09/2023",
    sections: [
      "Personal / contact details (only what the user provided)",
      "Professional experience",
      "Education",
      "Skills",
      "Languages",
    ],
    lengthTargetPages: "One or two pages when later formatted.",
  },
  coverLetter: {
    lengthTargetPages: "One page.",
    missingRecipientRule:
      "Never invent a recipient name. If the recipient is unknown, clearly mark it as missing and ask the user to confirm.",
  },
  rules: [
    "Use a formal and professional tone throughout.",
    "Use a clear reverse-chronological experience structure.",
    "Format all dates consistently (MM/YYYY).",
    "Keep language concise and direct.",
    "Draw a direct connection between the user's experience and the job's requirements.",
    "Keep skills, languages, work experience, and education clearly separated.",
    "Target a one-page cover letter.",
  ],
  prohibitions: [
    "No exaggeration.",
    "No irrelevant personal information.",
    "No invented recipient name.",
    "No guaranteed claims about what every German employer expects.",
  ],
  personalDetails: {
    neverAutoAdd: [
      "photo",
      "signature",
      "birth date",
      "nationality",
      "marital status",
    ],
    note:
      "These may be mentioned to the user as optional decisions requiring explicit confirmation, but must never be added automatically.",
  },
};

/**
 * Render the market pack as a compact, bulleted rules block suitable for
 * injecting into an AI prompt (used from Day 4 onward).
 */
export function renderGermanyMarketPackRules(pack: GermanyMarketPack = GERMANY_MARKET_PACK_V0): string {
  const lines: string[] = [];
  lines.push(`GERMANY MARKET PACK (${pack.version}) — apply conservatively:`);
  lines.push(`Tone: ${pack.tone}`);
  lines.push(`CV structure: ${pack.cv.structure}`);
  lines.push(`Dates: ${pack.cv.dateFormat} (e.g. ${pack.cv.dateFormatExample})`);
  lines.push(`CV sections (in order): ${pack.cv.sections.join("; ")}`);
  lines.push(`CV length: ${pack.cv.lengthTargetPages}`);
  lines.push(`Cover letter length: ${pack.coverLetter.lengthTargetPages}`);
  lines.push(`Recipient: ${pack.coverLetter.missingRecipientRule}`);
  lines.push("Rules:");
  for (const r of pack.rules) lines.push(`  - ${r}`);
  lines.push("Prohibitions:");
  for (const p of pack.prohibitions) lines.push(`  - ${p}`);
  lines.push(
    `Personal details never added automatically: ${pack.personalDetails.neverAutoAdd.join(", ")}. ${pack.personalDetails.note}`,
  );
  return lines.join("\n");
}
