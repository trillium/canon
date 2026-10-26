/** What the literal-text scan looks at and which files and directories it ignores. */

/** Props whose string value a visitor reads or hears. */
export const COPY_ATTRS = new Set([
  "placeholder",
  "title",
  "alt",
  "label",
  "aria-label",
  "aria-description",
  "aria-placeholder",
  "aria-roledescription",
]);
export const SKIP_ATTR = "data-content-skip";
export const IGNORED_FILE = /\.(test|spec|stories)\.[jt]sx?$|[\\/]__tests__[\\/]/;
export const IGNORED_DIR = new Set(["node_modules", ".next", "dist", "build", "coverage", ".git"]);
