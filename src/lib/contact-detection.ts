import { Contact } from "@/types";

// ─── Parsed message output ───────────────────────────────────

export interface ParsedMessage {
  detectedName: string | null;
  cleanedText: string;
  format: "slack" | "teams" | "whatsapp" | "generic" | "none";
}

// ─── Detection result types ──────────────────────────────────

export type DetectionResult =
  | { type: "exact"; contact: Contact }
  | { type: "fuzzy"; contact: Contact; similarity: number }
  | { type: "new"; detectedName: string }
  | { type: "none" };

// ─── Message parser ──────────────────────────────────────────

export function parseMessageSender(rawText: string): ParsedMessage {
  const text = rawText.trim();
  if (!text) return { detectedName: null, cleanedText: text, format: "none" };

  // Pattern 1: Slack — "Name  [10:33 PM]\nMessage"
  const slack = text.match(/^(.+?)\s{2,}\[[\d:]+\s*[APap][Mm]\]\s*\n([\s\S]+)/);
  if (slack) {
    return {
      detectedName: slack[1].trim(),
      cleanedText: slack[2].trim(),
      format: "slack",
    };
  }

  // Pattern 2: WhatsApp bracketed — "[10:33 PM, 3/13/2026] Name: Message"
  const whatsappBracket = text.match(
    /^\[[\d:\/\s,APapMm.-]+\]\s+(.+?):\s*([\s\S]+)/
  );
  if (whatsappBracket) {
    return {
      detectedName: whatsappBracket[1].trim(),
      cleanedText: whatsappBracket[2].trim(),
      format: "whatsapp",
    };
  }

  // Pattern 3: Teams — "Name, 10:33 PM\nMessage"
  const teams = text.match(/^(.+?),\s*[\d:]+\s*[APap][Mm]\s*\n([\s\S]+)/);
  if (teams) {
    return {
      detectedName: teams[1].trim(),
      cleanedText: teams[2].trim(),
      format: "teams",
    };
  }

  // Pattern 4: WhatsApp dash — "Name - 10:33 PM\nMessage"
  const whatsappDash = text.match(
    /^(.+?)\s*-\s*[\d:]+\s*[APap][Mm]\s*\n([\s\S]+)/
  );
  if (whatsappDash) {
    return {
      detectedName: whatsappDash[1].trim(),
      cleanedText: whatsappDash[2].trim(),
      format: "whatsapp",
    };
  }

  // Pattern 5: Generic — "Capitalized Name: Message"
  // Require 1-4 capitalized words, colon, then message
  const generic = text.match(
    /^([A-Z\u0600-\u06FF][a-zA-Z\u0600-\u06FF]+(?:\s[A-Z\u0600-\u06FF][a-zA-Z\u0600-\u06FF]+){0,3}):\s*([\s\S]+)/
  );
  if (generic) {
    const name = generic[1].trim();
    // Avoid matching URLs like "https:" or common words
    if (name.length > 1 && !name.includes("http") && !name.includes("www")) {
      return {
        detectedName: name,
        cleanedText: generic[2].trim(),
        format: "generic",
      };
    }
  }

  return { detectedName: null, cleanedText: text, format: "none" };
}

// ─── String similarity (Dice coefficient on bigrams) ─────────

function getBigrams(str: string): string[] {
  const s = str.toLowerCase().trim();
  const bigrams: string[] = [];
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.push(s.substring(i, i + 2));
  }
  return bigrams;
}

export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const setB = new Set(bigramsB);
  let intersection = 0;
  for (const bg of bigramsA) {
    if (setB.has(bg)) {
      intersection++;
      setB.delete(bg); // count each bigram only once
    }
  }
  return (2 * intersection) / (bigramsA.length + bigramsB.length);
}

// ─── Contact matching ────────────────────────────────────────

const FUZZY_THRESHOLD = 0.6;

export function matchContactByName(
  name: string,
  contacts: Contact[]
): DetectionResult {
  const normalized = name.toLowerCase().trim();

  // 1. Exact match
  const exact = contacts.find((c) => c.name.toLowerCase().trim() === normalized);
  if (exact) return { type: "exact", contact: exact };

  // 2. Fuzzy match — find best score above threshold
  let bestScore = 0;
  let bestContact: Contact | null = null;

  for (const c of contacts) {
    const score = stringSimilarity(normalized, c.name.toLowerCase().trim());
    if (score > bestScore) {
      bestScore = score;
      bestContact = c;
    }
  }

  if (bestContact && bestScore >= FUZZY_THRESHOLD) {
    return { type: "fuzzy", contact: bestContact, similarity: bestScore };
  }

  // 3. No match
  return { type: "new", detectedName: name };
}

// ─── Combined entry point ────────────────────────────────────

export function detectContactFromText(
  rawText: string,
  contacts: Contact[]
): { parsed: ParsedMessage; match: DetectionResult } {
  const parsed = parseMessageSender(rawText);
  if (!parsed.detectedName) {
    return { parsed, match: { type: "none" } };
  }
  const match = matchContactByName(parsed.detectedName, contacts);
  return { parsed, match };
}
