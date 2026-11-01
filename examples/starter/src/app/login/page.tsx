import { Heading } from "@/components/ui/heading";
import { login } from "@/content";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <Heading level={1} size="xl" data-content="login.heading">
        {login.heading}
      </Heading>
    </main>
  );
}
