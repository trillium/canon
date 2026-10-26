import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiContent } from "@/content";
import { collectFields, fieldHash } from "@/lib/content-acceptance";
import { formatMessage } from "@/lib/format-message";
import { requireAdmin } from "@/lib/require-admin";

// POST   /api/content/accept  { path: "home.hero.heading", value: "current text" }
// DELETE /api/content/accept  { path: "home.hero.heading" }
// `path` is `page.section.field`; the first segment is the page key.

const acceptSchema = z.object({ path: z.string().min(1), value: z.string() });
const unacceptSchema = z.object({ path: z.string().min(1) });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const parsed = acceptSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: apiContent.acceptBodyInvalid }, { status: 400 });
  }
  const body = parsed.data;

  const [page, ...rest] = body.path.split(".");
  const fieldPath = rest.join(".");
  const email = user.email ?? "unknown";

  const { data: row, error: fetchErr } = await supabase
    .from("page_content")
    .select("content")
    .eq("page", page)
    .single();
  if (fetchErr || !row) {
    return NextResponse.json(
      { error: formatMessage(apiContent.pageNotFound, { page }) },
      { status: 404 },
    );
  }

  const fields: Record<string, string> = {};
  collectFields(row.content, "", fields);
  if (fields[fieldPath] !== body.value) {
    return NextResponse.json(
      { error: formatMessage(apiContent.valueDiffers, { field: fieldPath }) },
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

  const parsed = unacceptSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: apiContent.unacceptBodyInvalid }, { status: 400 });
  const { path } = parsed.data;

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
    return NextResponse.json(
      { error: formatMessage(apiContent.pageNotFound, { page }) },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, field: fieldPath });
}
