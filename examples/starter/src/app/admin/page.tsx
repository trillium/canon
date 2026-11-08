import { Heading } from "@/components/ui/heading";
import { admin } from "@/content";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <Heading level={1} size="xl" data-content="admin.heading">
        {admin.heading}
      </Heading>
    </main>
  );
}
