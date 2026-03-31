const DICT_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const TRANS_BASE = "https://api.mymemory.translated.net/get";

export type DictionaryMeaning = {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms: string[];
};

export type DictionaryEntry = {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: DictionaryMeaning[];
};

export type WordLookupResult = {
  dictionary?: DictionaryEntry;
  farsiTranslation?: string;
};

const cache = new Map<string, WordLookupResult>();

export function cleanWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^[^a-z'-]+|[^a-z'-]+$/g, "")
    .replace(/'+$/, "");
}

export async function lookupWord(raw: string): Promise<WordLookupResult> {
  const word = cleanWord(raw);
  if (!word || word.length < 2) return {};

  const cached = cache.get(word);
  if (cached) return cached;

  const [dictRes, transRes] = await Promise.allSettled([
    fetchDictionary(word),
    fetchTranslation(word),
  ]);

  const result: WordLookupResult = {
    dictionary:
      dictRes.status === "fulfilled" ? dictRes.value : undefined,
    farsiTranslation:
      transRes.status === "fulfilled" ? transRes.value : undefined,
  };

  cache.set(word, result);
  return result;
}

async function fetchDictionary(
  word: string
): Promise<DictionaryEntry | undefined> {
  const res = await fetch(
    `${DICT_BASE}/${encodeURIComponent(word)}`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return undefined;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return undefined;

  const entry = data[0];
  const withAudio = entry.phonetics?.find(
    (p: Record<string, unknown>) => typeof p.audio === "string" && p.audio
  );

  return {
    word: entry.word,
    phonetic: entry.phonetic || withAudio?.text,
    audioUrl: withAudio?.audio || undefined,
    meanings: (entry.meanings ?? [])
      .flatMap((m: Record<string, unknown>) =>
        ((m.definitions as Record<string, unknown>[]) ?? [])
          .slice(0, 2)
          .map((d) => ({
            partOfSpeech: m.partOfSpeech as string,
            definition: d.definition as string,
            example: (d.example as string) || undefined,
            synonyms: ((d.synonyms as string[]) ?? []).slice(0, 5),
          }))
      )
      .slice(0, 4),
  };
}

async function fetchTranslation(
  word: string
): Promise<string | undefined> {
  const res = await fetch(
    `${TRANS_BASE}?q=${encodeURIComponent(word)}&langpair=en|fa`,
    { signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return undefined;

  const data = await res.json();
  const text = data?.responseData?.translatedText;
  if (!text || typeof text !== "string") return undefined;
  if (text.toLowerCase() === word.toLowerCase()) return undefined;
  return text;
}
