/** Shapes returned by the literal-text scan. */

export interface Violation {
  file: string;
  line: number;
  what: string;
  shown: string;
}

export interface Escape {
  file: string;
  line: number;
  kind: string;
  reason: string;
}

export interface ScanResult {
  violations: Violation[];
  escapes: Escape[];
}
