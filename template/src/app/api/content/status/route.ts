import { NextResponse } from "next/server";
import { unacceptedFields } from "@/lib/content-acceptance";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/content/status -> { pages: [{ page, total, unaccepted, unaccepted_fields, accepted_fields }], totalUnaccepted }

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { data: pages, error } = await auth.supabase
    .from("page_content")
    .select("page, content, accepted_fields")
    .order("page");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (pages ?? []).map((row) => {
    const unaccepted = unacceptedFields(row.content, row.accepted_fields);
    return {
      page: row.page,
      unaccepted: unaccepted.length,
      unaccepted_fields: unaccepted,
      accepted_fields: row.accepted_fields ?? {},
    };
  });
  const totalUnaccepted = result.reduce((sum, p) => sum + p.unaccepted, 0);

  return NextResponse.json({ pages: result, totalUnaccepted });
}
