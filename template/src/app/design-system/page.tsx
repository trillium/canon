/**
 * /design-system — live UI component catalogue.
 *
 * Renders every reusable primitive in `src/components/ui/` with its
 * variants, plus the enforcement table derived from `DS_RULES` (single
 * source of truth — never a hardcoded copy). Before building UI, check
 * here first: if the pattern exists, use it; if not, build it as a
 * `ui/` primitive, catalogue it on this page, then use it.
 *
 * This page is exempt from the reuse gate by path
 * (`scripts/check-design-system.ts` skips `design-system/`).
 */
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DS_COMPONENTS_BY_CATEGORY,
  DS_RULES,
} from "@/components/ui/manifest";

function Section({
  id,
  title,
  path,
  children,
}: {
  id: string;
  title: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <p className="mt-1 font-mono text-xs text-gray-500">{path}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Design System
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Pages compose these primitives — they never hand-roll raw UI. Rule
          registry: <code>src/components/ui/manifest.ts</code>
        </p>
      </header>

      <Section id="button" title="Button" path="src/components/ui/button.tsx">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section id="input" title="Input" path="src/components/ui/input.tsx">
        <div className="w-64">
          <Input placeholder="Default input" aria-label="Default input" />
        </div>
        <div className="w-64">
          <Input
            placeholder="With error"
            aria-label="Input with error"
            error="This field is required"
          />
        </div>
        <div className="w-64">
          <Input placeholder="Disabled" aria-label="Disabled input" disabled />
        </div>
      </Section>

      <Section id="badge" title="Badge" path="src/components/ui/badge.tsx">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </Section>

      <Section id="card" title="Card" path="src/components/ui/card.tsx">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cards own rounded+border+padded surfaces. Never rebuild this
              pattern inline.
            </p>
            <div className="mt-4">
              <Button size="sm">Card action</Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      <section id="enforcement" className="mb-12 scroll-mt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Enforcement
        </h2>
        <p className="mt-1 font-mono text-xs text-gray-500">
          derived from DS_RULES — {DS_RULES.length} rules,{" "}
          {Object.values(DS_COMPONENTS_BY_CATEGORY).flat().length} components
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="py-2 pr-4 font-medium">Rule</th>
                <th className="py-2 pr-4 font-medium">Use instead</th>
                <th className="py-2 font-medium">Raw pattern</th>
              </tr>
            </thead>
            <tbody>
              {DS_RULES.map((rule) => (
                <tr
                  key={rule.name}
                  className="border-b border-gray-100 dark:border-gray-900"
                >
                  <td className="py-2 pr-4 font-mono text-xs">{rule.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {rule.component}
                  </td>
                  <td className="py-2 font-mono text-xs text-gray-500">
                    {rule.rawPattern}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
