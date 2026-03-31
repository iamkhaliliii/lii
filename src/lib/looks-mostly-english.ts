/**
 * Heuristic: selection is suitable for English TTS (Latin-heavy, not mostly Arabic script).
 */
export function looksMostlyEnglish(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;

  let latinLetters = 0;
  let arabicScript = 0;

  for (const ch of trimmed) {
    if (/[A-Za-z]/.test(ch)) latinLetters++;
    // Persian / Arabic blocks used in UI copy
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(ch)) {
      arabicScript++;
    }
  }

  if (latinLetters === 0) return false;
  if (arabicScript > 0 && arabicScript >= latinLetters * 0.35) return false;

  return true;
}
