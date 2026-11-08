// biome-ignore-all lint/style/noJsxLiterals: documentation page, not product copy (data-content-skip on the page root)
import { Box } from "@/components/ui/box";
import { Code } from "@/components/ui/code";
import { Heading } from "@/components/ui/heading";
import { DS_RULES } from "@/components/ui/manifest";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { Catalogue } from "./catalogue";

export const metadata = { title: "Design System" };

/**
 * The /design-system page has eight required sections. Their ids are checked by
 * scripts/check-ds-page.ts, and it also checks that every manifest component is named on this
 * page or in a file beside it (see catalogue.tsx).
 */
const OPT_OUTS = [
  {
    directive: "// ds-ignore",
    scope: "Nearby lines",
    effect: "Skips design-system rule findings within 3 lines",
  },
  {
    directive: "{/* ds-ignore */}",
    scope: "Nearby lines (JSX)",
    effect: "Same, usable inside JSX",
  },
  {
    directive: "/* ds-ignore-file */",
    scope: "Whole file",
    effect: "Skips all design-system rules for the file",
  },
];

const SWATCHES = [
  { name: "primary-100", className: "bg-primary-100" },
  { name: "primary-300", className: "bg-primary-300" },
  { name: "primary-500", className: "bg-primary-500" },
  { name: "primary-700", className: "bg-primary-700" },
  { name: "primary-900", className: "bg-primary-900" },
  { name: "secondary-100", className: "bg-secondary-100" },
  { name: "secondary-300", className: "bg-secondary-300" },
  { name: "secondary-500", className: "bg-secondary-500" },
  { name: "secondary-700", className: "bg-secondary-700" },
  { name: "secondary-900", className: "bg-secondary-900" },
];

const TOKENS = [
  ["--background / --foreground", "Page surface and body text"],
  ["--primary / --primary-foreground", "Primary actions and the text on them"],
  ["--muted / --muted-foreground", "Quiet surfaces and supporting text"],
  ["--accent / --accent-foreground", "Hover and selected surfaces"],
  ["--destructive / --destructive-foreground", "Destructive actions and errors"],
  ["--border / --input / --ring", "Borders, field borders and focus rings"],
];

export default function DesignSystemPage() {
  return (
    <main
      className="mx-auto max-w-4xl space-y-12 p-8"
      data-content-skip="design-system documentation page"
    >
      <header>
        <Heading level={1} size="xl">
          Design System
        </Heading>
        <Text size="sm" tone="muted" className="mt-2">
          Every component below replaces a raw HTML element. The pre-commit hook, pre-push hook, CI
          and the Claude Code hook reject the raw form outside <Code>components/ui</Code>.
        </Text>
      </header>

      <section id="ds-principles" aria-labelledby="ds-principles-title">
        <Heading id="ds-principles-title">Principles</Heading>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          <li>Clear over clever: say what happened and what the person can do next.</li>
          <li>
            Honest by default: the interface never implies that an action happened when it did not.
          </li>
          <li>Components first: screens are composed from this catalogue, not from raw markup.</li>
          <li>
            Readable by default: contrast, focus and keyboard use are part of every component.
          </li>
        </ul>
      </section>

      <section id="ds-foundations" aria-labelledby="ds-foundations-title">
        <Heading id="ds-foundations-title">Foundations</Heading>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          <li>
            Color: the primary (teal) and secondary (blue) scales, plus the surface tokens below
          </li>
          <li>Type scale: text-sm and text-base for body, text-lg to text-3xl for headings</li>
          <li>
            Spacing and grid: the Tailwind 4 spacing scale; page content is capped at max-w-4xl
          </li>
          <li>Radius: rounded-md for controls, rounded for chips and code</li>
          <li>Elevation: borders rather than shadows</li>
          <li>Motion: none by default; any motion honors prefers-reduced-motion</li>
          <li>Iconography: lucide-react, never raw emoji</li>
        </ul>
        <Stack direction="row" gap="sm" wrap className="mt-4">
          {SWATCHES.map((swatch) => (
            <Box key={swatch.name} className="w-24">
              <Box className={`h-12 rounded border border-border ${swatch.className}`} />
              <Text size="sm" tone="muted">
                {swatch.name}
              </Text>
            </Box>
          ))}
        </Stack>
      </section>

      <section id="ds-tokens" aria-labelledby="ds-tokens-title">
        <Heading id="ds-tokens-title">Tokens</Heading>
        <Text size="sm" tone="muted" className="mt-2">
          Semantic tokens are CSS variables in <Code>globals.css</Code> with light values on{" "}
          <Code>:root</Code> and dark values on <Code>.dark</Code>, exposed to Tailwind through{" "}
          <Code>@theme inline</Code>.
        </Text>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-4">Token</th>
              <th className="py-2">Use</th>
            </tr>
          </thead>
          <tbody>
            {TOKENS.map(([token, use]) => (
              <tr key={token} className="border-t border-border">
                <td className="py-2 pr-4 font-mono">{token}</td>
                <td className="py-2">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="ds-components" aria-labelledby="ds-components-title">
        <Heading id="ds-components-title">Components</Heading>
        <Text size="sm" tone="muted" className="mt-2">
          One entry per manifest component, each with a description, props and variants, states, a
          code example and a live demo.
        </Text>
        <Catalogue />
      </section>

      <section id="ds-patterns" aria-labelledby="ds-patterns-title">
        <Heading id="ds-patterns-title">Patterns</Heading>
        <Text size="sm" tone="muted" className="mt-2">
          Page layouts and multi-component flows are added here as screens are built. Until then,
          compose a page as a main element holding a Stack of Heading, Text and form fields.
        </Text>
      </section>

      <section id="ds-content" aria-labelledby="ds-content-title">
        <Heading id="ds-content-title">Content guidelines</Heading>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          <li>Plain, calm voice. No urgency language and no pressure to act.</li>
          <li>Say what happened and what the person can do next.</li>
          <li>Button labels are verbs. Error messages name the problem and the fix.</li>
          <li>
            Product copy lives in JSON files under <Code>src/content</Code> and is accepted by a
            human before release; agents never accept copy.
          </li>
        </ul>
      </section>

      <section id="ds-accessibility" aria-labelledby="ds-accessibility-title">
        <Heading id="ds-accessibility-title">Accessibility</Heading>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          <li>Text meets WCAG AA contrast in both light and dark themes.</li>
          <li>Every interactive component shows a visible focus outline.</li>
          <li>Form controls pair with a Label or carry an aria-label.</li>
          <li>Motion honors prefers-reduced-motion. The Playwright suite runs axe-core.</li>
        </ul>
      </section>

      <section id="ds-governance" aria-labelledby="ds-governance-title">
        <Heading id="ds-governance-title">Governance</Heading>
        <Text size="sm" tone="muted" className="mt-2">
          Owner: the team that maintains this app. To add or change a component: build it in{" "}
          <Code>components/ui</Code>, register it in <Code>manifest.config.ts</Code>, add its entry
          above, then migrate call sites.
        </Text>

        <Heading level={3} size="md" className="mt-6">
          Enforcement rules
        </Heading>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-4">Instead of</th>
              <th className="py-2 pr-4">Use</th>
              <th className="py-2 pr-4">Import from</th>
              <th className="py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {DS_RULES.map((rule) => (
              <tr key={rule.name} className="border-t border-border">
                <td className="py-2 pr-4 font-mono">{rule.rawPattern}</td>
                <td className="py-2 pr-4 font-mono">{rule.component}</td>
                <td className="py-2 pr-4 font-mono">{rule.importPath}</td>
                <td className="py-2">{rule.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Heading level={3} size="md" className="mt-6">
          Opt-out directives
        </Heading>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2 pr-4">Directive</th>
              <th className="py-2 pr-4">Scope</th>
              <th className="py-2">Effect</th>
            </tr>
          </thead>
          <tbody>
            {OPT_OUTS.map((optOut) => (
              <tr key={optOut.directive} className="border-t border-border">
                <td className="py-2 pr-4 font-mono">{optOut.directive}</td>
                <td className="py-2 pr-4">{optOut.scope}</td>
                <td className="py-2">{optOut.effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
