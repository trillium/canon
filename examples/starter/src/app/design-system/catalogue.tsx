// biome-ignore-all lint/style/noJsxLiterals: documentation page, not product copy (data-content-skip on the page root)
import type { ReactNode } from "react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/ui/link";
import { Select } from "@/components/ui/select";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

interface EntryProps {
  name: string;
  description: string;
  variants: string;
  states: string;
  example: string;
  children: ReactNode;
}

function Entry({ name, description, variants, states, example, children }: EntryProps) {
  return (
    <Box
      className="space-y-3 border-t border-border py-6"
      data-content-skip="design-system documentation page"
    >
      <Heading level={3} size="md">
        {name}
      </Heading>
      <Text size="sm" tone="muted">
        {description}
      </Text>
      <Text size="sm">
        <strong>Props and variants:</strong> {variants}
      </Text>
      <Text size="sm">
        <strong>States:</strong> {states}
      </Text>
      <Box className="rounded-md border border-border p-4">{children}</Box>
      <Code block>{example}</Code>
    </Box>
  );
}

export function Catalogue() {
  return (
    <Box data-content-skip="design-system documentation page">
      <Entry
        name="Box"
        description="Generic container. Use it where a bare div would otherwise go."
        variants="Accepts every div prop and className."
        states="Static."
        example={'<Box className="p-4">content</Box>'}
      >
        <Box className="rounded bg-muted p-4">A Box with padding and a muted background</Box>
      </Entry>
      <Entry
        name="Stack"
        description="Flex row or column layout with gap, align and justify props."
        variants="direction: column | row. gap: none | sm | md | lg. align: start | center | end | stretch. justify: start | center | end | between. wrap."
        states="Static."
        example={'<Stack direction="row" gap="sm">...</Stack>'}
      >
        <Stack direction="row" gap="sm" align="center">
          <Box className="rounded bg-muted p-2">One</Box>
          <Box className="rounded bg-muted p-2">Two</Box>
          <Box className="rounded bg-muted p-2">Three</Box>
        </Stack>
      </Entry>
      <Entry
        name="Heading"
        description="Semantic heading. The visual size follows the size prop, not the tag."
        variants="level: 1 to 6 (semantic). size: xl | lg | md (visual)."
        states="Static."
        example={'<Heading level={2} size="lg">Title</Heading>'}
      >
        <Heading level={3} size="lg">
          A level 3 heading at large size
        </Heading>
      </Entry>
      <Entry
        name="Text"
        description="Paragraph or inline text on the type scale."
        variants="size: sm | md. tone: default | muted | danger. inline renders a span."
        states="Static."
        example={'<Text tone="muted">Supporting copy</Text>'}
      >
        <Stack gap="sm">
          <Text>Default paragraph text</Text>
          <Text tone="muted">Muted paragraph text</Text>
          <Text tone="danger">Danger paragraph text</Text>
        </Stack>
      </Entry>
      <Entry
        name="Code"
        description="Inline or block code with monospace styling."
        variants="block renders a scrollable pre block."
        states="Static."
        example={"<Code>pnpm run check:ds</Code>"}
      >
        <Code>pnpm run check:ds</Code>
      </Entry>
      <Entry
        name="Link"
        description="Navigation link. Goes through Next.js routing and prefetching."
        variants="Accepts every next/link prop."
        states="Default, hover, focus (visible outline)."
        example={'<Link href="/">Home</Link>'}
      >
        <Link href="/">Back to the home page</Link>
      </Entry>
      <Entry
        name="Button"
        description="Themed button with variant and size props. Defaults to type button."
        variants="variant: primary | secondary | outline | destructive. size: sm | md | lg."
        states="Default, hover, focus (visible outline), disabled."
        example={'<Button variant="outline">Cancel</Button>'}
      >
        <Stack direction="row" gap="sm" wrap>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </Stack>
      </Entry>
      <Entry
        name="Label"
        description="Form label styled to the type scale. Pair it with a control through htmlFor."
        variants="Accepts every label prop."
        states="Static."
        example={'<Label htmlFor="email">Email</Label>'}
      >
        <Label htmlFor="ds-label-demo">Label text</Label>
        <Input id="ds-label-demo" className="mt-2" />
      </Entry>
      <Entry
        name="Input"
        description="Text input with a themed focus ring and an error state."
        variants="invalid marks the field invalid and styles the error state."
        states="Default, focus (visible outline), disabled, invalid."
        example={'<Input id="email" invalid />'}
      >
        <Stack gap="sm">
          <Input aria-label="Default input" placeholder="Default" />
          <Input aria-label="Invalid input" placeholder="Invalid" invalid />
          <Input aria-label="Disabled input" placeholder="Disabled" disabled />
        </Stack>
      </Entry>
      <Entry
        name="Textarea"
        description="Multi-line input with a themed focus ring and an error state."
        variants="invalid marks the field invalid and styles the error state."
        states="Default, focus (visible outline), disabled, invalid."
        example={'<Textarea id="notes" invalid />'}
      >
        <Textarea aria-label="Demo textarea" placeholder="Write here" />
      </Entry>
      <Entry
        name="Select"
        description="Native select with a themed focus ring and an error state."
        variants="invalid marks the field invalid and styles the error state."
        states="Default, focus (visible outline), disabled, invalid."
        example={'<Select id="plan"><option>One</option></Select>'}
      >
        <Select aria-label="Demo select" defaultValue="one">
          <option value="one">Option one</option>
          <option value="two">Option two</option>
        </Select>
      </Entry>
    </Box>
  );
}
