/** Extract [placeholders] from a pattern (e.g. [city], [deliverable]) */
export function variableKeysFromPattern(pattern: string): string[] {
  const re = /\[([^\]]+)\]/g;
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(pattern)) !== null) {
    if (!keys.includes(m[1])) keys.push(m[1]);
  }
  return keys;
}

export function applyVariables(pattern: string, values: Record<string, string>): string {
  let out = pattern;
  for (const [k, v] of Object.entries(values)) {
    const safe = v ?? `[${k}]`;
    out = out.split(`[${k}]`).join(safe);
  }
  return out;
}

/** Pick random element */
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function randomFillVariables(
  variables: Record<string, string[]>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, options] of Object.entries(variables)) {
    if (options.length) out[key] = pickRandom(options);
  }
  return out;
}
