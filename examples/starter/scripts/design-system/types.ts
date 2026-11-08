/** Shapes shared by the design-system checker modules. */

export interface DsRulePattern {
  jsx?: RegExp;
  className?: RegExp;
  jsxStyle?: { element: RegExp; styling: RegExp };
}

export interface DsRule {
  name: string;
  component: string;
  importPath: string;
  hint?: string;
  noEscapeHatch?: boolean;
  patterns: DsRulePattern[];
}

export interface Finding {
  file: string;
  line: number;
  rule: string;
  action: string;
  noEscapeHatch: boolean;
  excerpt: string;
}

export interface HookPayload {
  cwd?: string;
  tool_input?: {
    file_path?: string;
    content?: string;
    old_string?: string;
    new_string?: string;
    edits?: { old_string?: string; new_string?: string }[];
  };
}
