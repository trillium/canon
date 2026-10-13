/* ds-ignore-file */
import { DS_RULES } from "@/components/ui/manifest";

export const metadata = { title: "Design System" };

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

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-12 p-8">
      <header>
        <h1 className="text-3xl font-bold">Design System</h1>
        <p className="mt-2 text-sm opacity-70">
          Every component below replaces a raw HTML element. The pre-commit hook, pre-push hook, CI
          and the Claude Code hook reject the raw form outside <code>components/ui</code>.
        </p>
      </header>

      <section aria-labelledby="ds-rules">
        <h2 id="ds-rules" className="text-2xl font-bold">
          Enforcement rules
        </h2>
        {DS_RULES.length === 0 ? (
          <p className="mt-2 text-sm opacity-70">
            No rules enabled yet. Enable presets in <code>components/ui/manifest.config.ts</code> as
            you add components.
          </p>
        ) : (
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
                <tr key={rule.name} className="border-t">
                  <td className="py-2 pr-4 font-mono">{rule.rawPattern}</td>
                  <td className="py-2 pr-4 font-mono">{rule.component}</td>
                  <td className="py-2 pr-4 font-mono">{rule.importPath}</td>
                  <td className="py-2">{rule.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="ds-tokens">
        <h2 id="ds-tokens" className="text-2xl font-bold">
          Tokens
        </h2>
        {/* Add colour swatches (from globals.css) and the typography scale here. */}
      </section>

      <section aria-labelledby="ds-components">
        <h2 id="ds-components" className="text-2xl font-bold">
          Components
        </h2>
        {/*
          One live example per manifest component. check-ds-page.ts fails when a component
          named in the manifest does not appear on this page.
        */}
      </section>

      <section aria-labelledby="ds-opt-outs">
        <h2 id="ds-opt-outs" className="text-2xl font-bold">
          Opt-out directives
        </h2>
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
              <tr key={optOut.directive} className="border-t">
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
