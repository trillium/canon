import { Heading } from "@/components/ui/heading";
import { home } from "@/content";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <Heading level={1} size="xl" data-content="home.heading">
        {home.heading}
      </Heading>
    </main>
  );
}
