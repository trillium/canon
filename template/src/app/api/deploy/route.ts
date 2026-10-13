import { NextResponse } from "next/server";
import { unacceptedFields } from "@/lib/content-acceptance";
import { requireAdmin } from "@/lib/require-admin";

// POST /api/deploy — shape of the deploy gate. Replace the marked block with
// the project's real publish step (commit content to git, trigger a build, ...).
//
// Gate mode (env CONTENT_ACCEPTANCE_GATE):
//   unset / "warn" (default) — publish proceeds, response carries `warnings`
//   "hard"                   — publish is refused while anything is unaccepted

export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data: pages, error } = await auth.supabase
    .from("page_content")
    .select("page, content, accepted_fields");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unaccepted = (pages ?? []).flatMap((row) =>
    unacceptedFields(row.content, row.accepted_fields).map((f) => `${row.page}.${f}`),
  );

  if (unaccepted.length > 0 && process.env.CONTENT_ACCEPTANCE_GATE === "hard") {
    return NextResponse.json(
      { error: "Accept all fields before deploying", unaccepted },
      { status: 409 },
    );
  }

  // --- publish step goes here ---

  return NextResponse.json({
    ok: true,
    warnings: unaccepted.length > 0 ? { unaccepted } : undefined,
  });
}
