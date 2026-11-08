/* ds-ignore-file */
/**
 * Per-project design-system decisions. Edit this file; leave `manifest.ts` alone.
 *
 * Workflow: add a primitive to `components/ui/`, enable (or define) the rule
 * that bans its raw-HTML equivalent, add a live example to /design-system,
 * then migrate existing call sites. The hooks block new violations from the
 * moment the rule is enabled.
 */
import type { DsPresetName, DsPresetOverride, DsRule } from "./manifest";

/**
 * Presets from `manifest.ts` to enforce. Every preset is enabled: each one has its component in
 * `components/ui/`, so raw HTML for these elements is rejected outside that directory.
 */
export const ENABLED_RULES: DsPresetName[] = [
  "raw-input",
  "raw-textarea",
  "raw-select",
  "raw-button",
  "raw-label",
  "raw-heading",
  "raw-p",
  "raw-span",
  "raw-code",
  "raw-anchor",
  "raw-div",
  "raw-stack",
];

/** Adjust a preset, e.g. point `raw-anchor` at your own Link: { "raw-anchor": { importPath: "@/components/Link" } } */
export const PRESET_OVERRIDES: Partial<Record<DsPresetName, DsPresetOverride>> = {};

/**
 * Project-specific rules. A rule with `patterns: []` registers a component for
 * coverage and the catalogue page without banning anything.
 */
export const CUSTOM_RULES: DsRule[] = [];
