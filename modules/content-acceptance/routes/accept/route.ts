import { type NextRequest, NextResponse } from "next/server";
import { collectFields, fieldHash } from "@/lib/content-acceptance";
import { requireAdmin } from "@/lib/require-admin";

// POST   /api/content/accept  { path: "home.hero.heading", value: "current text" }
// DELETE /api/content/accept  { path: "home.hero.heading" }
// `path` is `page.section.field`; the first segment is the page key.

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = (await req.json()) as { path?: string; value?: string };
  if (!body.path || typeof body.value !== "string") {
    return NextResponse.json({ error: "Provide {path, value} to accept a field" }, { status: 400 });
  }

  const [page, ...rest] = body.path.split(".");
  const fieldPath = rest.join(".");
  const email = user.email ?? "unknown";

  const { data: row, error: fetchErr } = await supabase
    .from("page_content")
    .select("content")
    .eq("page", page)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json({ error: `Page not found: ${page}` }, { status: 404 });
  }

  const fields: Record<string, string> = {};
  collectFields(row.content, "", fields);
  if (fields[fieldPath] !== body.value) {
    return NextResponse.json(
      { error: `Stored value of ${fieldPath} differs from the value sent` },
      { status: 409 },
    );
  }

  const { data: accepted, error: updateErr } = await supabase.rpc("accept_content_field", {
    p_page: page,
    p_field: fieldPath,
    p_hash: fieldHash(fields[fieldPath]),
    p_email: email,
  });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, field: fieldPath, accepted_fields: accepted });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { path } = (await req.json()) as { path?: string };
  if (!path) return NextResponse.json({ error: "Provide {path}" }, { status: 400 });

  const [page, ...rest] = path.split(".");
  const fieldPath = rest.join(".");

  const { data: accepted, error: updateErr } = await supabase.rpc("unaccept_content_field", {
    p_page: page,
    p_field: fieldPath,
  });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  if (accepted === null) {
    return NextResponse.json({ error: `Page not found: ${page}` }, { status: 404 });
  }
  return NextResponse.json({ ok: true, field: fieldPath });
}
