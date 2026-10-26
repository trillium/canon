import { createHash } from "node:crypto";

/** One acceptance record. `by` lists every human who accepted this exact value. */
export interface Acceptance {
  hash: string;
  by: string[];
  at: string;
}

export type AcceptedFields = Record<string, Acceptance>;

/** SHA-256 of a field value, truncated to 12 hex chars. */
export function fieldHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

/**
 * Keys that are not copywriting and are excluded from acceptance.
 * Extend per project (href/src/alt = technical attributes, metadata = SEO,
 * episodes/posts = dynamic content that is not editable here).
 */
export const STRUCTURAL_KEYS = new Set([
  "type",
  "rows",
  "href",
  "src",
  "alt",
  "img",
  "metadata",
  "id",
  "importance",
  "importanceReason",
  "signals",
]);

/** Walk a JSON value and collect every leaf string with its dot-path (arrays as `[i]`). */
export function collectFields(
  value: unknown,
  prefix: string,
  out: Record<string, string>,
  skipKeys: Set<string> = STRUCTURAL_KEYS,
): void {
  if (typeof value === "string") {
    out[prefix] = value;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      collectFields(item, `${prefix}[${i}]`, out, skipKeys);
    });
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      if (skipKeys.has(key)) continue;
      collectFields(val, prefix ? `${prefix}.${key}` : key, out, skipKeys);
    }
  }
}

/** A field is unaccepted when it has no record, or the record's hash no longer matches. */
export function unacceptedFields(
  content: unknown,
  accepted: AcceptedFields | null | undefined,
): string[] {
  const fields: Record<string, string> = {};
  collectFields(content, "", fields);
  const records = accepted ?? {};
  return Object.entries(fields)
    .filter(([path, value]) => records[path]?.hash !== fieldHash(value))
    .map(([path]) => path);
}
