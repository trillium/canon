/** Fills `{name}` placeholders in a message from src/content. Unknown placeholders are left as written. */
export function formatMessage(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
