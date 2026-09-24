/* ds-ignore-file */
/**
 * Design System Manifest — single source of truth for the DS component
 * registry and the rule patterns that flag hand-rolled UI.
 *
 * Framework-free (no JSX, no React imports) so it can be imported from both
 * Next.js source and plain-node scripts. Keep this file free of
 * non-erasable TypeScript (no enums, namespaces, parameter properties) so
 * `node scripts/check-design-system.ts` can load it via type stripping.
 * Scripts MUST resolve it from `process.cwd()` + `src/components/ui/`,
 * never via the `@/` alias, so the module copy and the project copy of
 * each script stay byte-identical.
 *
 * To add a new DS component: (1) add the PascalCase name under
 * `DS_COMPONENTS_BY_CATEGORY`; (2) if it deserves a "use X instead of raw
 * HTML" rule, push a `DsRule` onto `DS_RULES`; (3) render it from
 * `src/app/design-system/page.tsx` (directly or via a file under
 * `_sections/`).
 *
 * Enforcement scripts: check-design-system.ts (raw-HTML matcher),
 * check-ds-coverage.ts (every src/components/ui/ export must appear in
 * the catalogue page).
 */

/**
 * Match strategy. A rule fires if ANY pattern hits a source line.
 *   - `jsx`       — element-level (e.g. `<input ... className=...>`).
 *   - `className` — utility-class only (focus rings, ad-hoc badges).
 *   - `jsxStyle`  — composite: BOTH `element` and `styling` must match.
 */
export interface DsRulePattern {
  jsx?: RegExp;
  className?: RegExp;
  jsxStyle?: {
    element: RegExp;
    styling: RegExp;
  };
}

/** Categories used in the catalogue + script error output. */
export type DsRuleCategory =
  | "interactive"
  | "display"
  | "layout"
  | "feedback"
  | "navigation";

/**
 * Registered DS rule. `selfExempt` skips the rule on the file that DEFINES
 * the target component (`raw-input` must not fire on `input.tsx`).
 * `rawPattern` is the string form of the regex, kept for grep/docs.
 */
export interface DsRule {
  name: string;
  component: string;
  importPath: string;
  category: DsRuleCategory;
  selfExempt?: boolean;
  hint?: string;
  patterns: DsRulePattern[];
  description: string;
  rawPattern: string;
}

/** Canonical, category-grouped component registry. PascalCase only. */
export const DS_COMPONENTS_BY_CATEGORY: Record<DsRuleCategory, string[]> = {
  interactive: ["Button", "Input"],
  display: ["Badge"],
  layout: ["Card"],
  feedback: [],
  navigation: [],
};

/** Flat, deduplicated list of every registered DS component name. */
export const DS_COMPONENT_NAMES: string[] = Array.from(
  new Set(Object.values(DS_COMPONENTS_BY_CATEGORY).flat()),
);

/**
 * Rule registry. Order matters: more specific rules (`raw-button-…`)
 * come before broader ones so the first matching error is the most
 * actionable. Every rule target must exist in the registry above.
 */
export const DS_RULES: DsRule[] = [
  {
    name: "raw-button-destructive",
    component: '<Button variant="destructive">',
    importPath: "@/components/ui/button",
    category: "interactive",
    selfExempt: true,
    description:
      "Use Button with the destructive variant instead of a raw element.",
    rawPattern: "<button\\b[^>]*\\bclassName=[^>]*bg-red",
    patterns: [{ jsx: /<button\b[^>]*\bclassName=[^>]*bg-red/ }],
  },
  {
    name: "raw-button-primary",
    component: "<Button>",
    importPath: "@/components/ui/button",
    category: "interactive",
    selfExempt: true,
    description: "Use Button instead of a raw element styled by hand.",
    rawPattern: "<button\\b[^>]*\\bclassName=[^>]*bg-primary",
    patterns: [{ jsx: /<button\b[^>]*\bclassName=[^>]*bg-primary/ }],
  },
  {
    name: "raw-input",
    component: "<Input>",
    importPath: "@/components/ui/input",
    category: "interactive",
    selfExempt: true,
    description: "Use Input instead of a raw element with classes.",
    rawPattern: "<input\\b[^>]*\\bclassName=",
    patterns: [{ jsx: /<input\b[^>]*\bclassName=/ }],
  },
  {
    name: "raw-badge",
    component: "<Badge>",
    importPath: "@/components/ui/badge",
    category: "display",
    selfExempt: true,
    description:
      "Use Badge instead of an inline rounded-full pill with classes.",
    rawPattern: "rounded-full\\s.*px-.*(?:text-xs|text-sm).*font-medium",
    patterns: [
      { className: /rounded-full\s.*px-.*(?:text-xs|text-sm).*font-medium/ },
    ],
  },
  {
    name: "focus-ring-inconsistency",
    component: "DS focus ring pattern",
    importPath: "focus:ring-primary-500 (with focus:outline-none focus:ring-2)",
    category: "interactive",
    hint:
      "Use focus:ring-primary-500 on the line. Canonical: " +
      "focus:outline-none focus:ring-2 focus:ring-primary-500.",
    description:
      "Focus rings must use focus:ring-primary-500 for consistency.",
    rawPattern: "focus:ring-* without focus:ring-primary-500 on same line",
    patterns: [
      { className: /(?=.*focus:ring-)(?!.*focus:ring-primary-500)^.*$/ },
    ],
  },
  {
    name: "undocumented-card-pattern",
    component: "<Card>",
    importPath: "@/components/ui/card",
    category: "layout",
    selfExempt: true,
    description: "Use Card instead of an ad-hoc rounded+border container.",
    rawPattern:
      "className=[\"'`]([^\"'`\\n]*\\brounded\\b[^\"'`\\n]*\\bborder\\b" +
      "[^\"'`\\n]*\\bp-\\d[^\"'`\\n]*\\b(?:space-y-|gap-)[^\"'`\\n]*)[\"'`]",
    patterns: [
      {
        className: new RegExp(
          "className=[\"'`]([^\"'`\\n]*\\brounded\\b" +
            "[^\"'`\\n]*\\bborder\\b[^\"'`\\n]*\\bp-\\d" +
            "[^\"'`\\n]*\\b(?:space-y-|gap-)[^\"'`\\n]*)[\"'`]",
        ),
      },
    ],
  },
];
