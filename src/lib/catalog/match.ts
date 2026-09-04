import type { Style } from "./types";

export function normalize(s: string) {
  return s.toUpperCase().replace(/[\s\-_()（）]/g, "");
}

export function extractAliases(code: string): string[] {
  const out = new Set<string>();
  for (const line of code.split(/[\n\r]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const inner = trimmed.match(/[（(]([^）)]+)[）)]/g);
    if (inner) {
      for (const m of inner) out.add(m.replace(/[（()）]/g, "").trim());
    }
    out.add(trimmed.replace(/[（(][^）)]*[）)]/g, "").trim());
  }
  return [...out].filter(Boolean);
}

export function tokens(text: string): string[] {
  return text
    .split(/[\s,，、;；]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function keysOf(style: Style): string[] {
  return [style.code, ...(style.aliases ?? []), ...extractAliases(style.code)];
}

export function findStyles(catalog: Style[], query: string): Style[] {
  const nq = normalize(query);
  if (!nq) return [];
  const exact = catalog.filter((s) => keysOf(s).some((k) => normalize(k) === nq));
  if (exact.length) return exact;
  return catalog.filter((s) =>
    keysOf(s).some((k) => normalize(k).includes(nq)),
  );
}

export function findStyle(catalog: Style[], query: string): Style | null {
  return findStyles(catalog, query)[0] ?? null;
}

export function matchQuery(catalog: Style[], text: string) {
  const qs = tokens(text);
  const seen = new Set<string>();
  const hits: Style[] = [];
  const misses: string[] = [];
  for (const q of qs) {
    const found = findStyles(catalog, q);
    if (!found.length) {
      misses.push(q);
      continue;
    }
    for (const s of found) {
      if (seen.has(s.code)) continue;
      seen.add(s.code);
      hits.push(s);
    }
  }
  hits.sort((a, b) => a.code.localeCompare(b.code, "en"));
  return { hits, misses, queries: qs };
}
