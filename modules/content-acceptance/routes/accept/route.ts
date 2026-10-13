import { type NextRequest, NextResponse } from "next/server";
import { fieldHash } from "@/lib/content-acceptance";
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
    return NextResponse.json(
      { error: "Provide {path, value} to accept a field" },
      { status: 400 },
    );
  }

  const [page, ...rest] = body.path.split(".");
  const fieldPath = rest.join(".");
  const email = user.email ?? "unknown";

  const { data: row, error: fetchErr } = await supabase
    .from("page_content")
    .select("accepted_fields")
    .eq("page", page)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json({ error: `Page not found: ${page}` }, { status: 404 });
  }

  const accepted = row.accepted_fields ?? {};
  const existing = accepted[fieldPath];
  const hash = fieldHash(body.value);

  if (existing?.hash === hash && existing.by.includes(email)) {
    return NextResponse.json({ ok: true, already: true });
  }

  accepted[fieldPath] = {
    hash,
    by: existing?.hash === hash ? [...new Set([...existing.by, email])] : [email],
    at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from("page_content")
    .update({ accepted_fields: accepted })
    .eq("page", page);
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

  const { data: row, error: fetchErr } = await supabase
    .from("page_content")
    .select("accepted_fields")
    .eq("page", page)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json({ error: `Page not found: ${page}` }, { status: 404 });
  }

  const accepted = row.accepted_fields ?? {};
  if (!(fieldPath in accepted)) return NextResponse.json({ ok: true, already: true });

  delete accepted[fieldPath];
  const { error: updateErr } = await supabase
    .from("page_content")
    .update({ accepted_fields: accepted })
    .eq("page", page);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, field: fieldPath });
}
