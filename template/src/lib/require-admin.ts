import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Acceptance is a human act. Only a real signed-in session whose email is in
 * ADMIN_EMAILS (comma-separated) passes. There is deliberately no API-key or
 * header bypass: agents and scripts can never accept.
 *
 * On success, `supabase` is a service-role client (RLS bypassed) — it is only
 * ever handed out after the session check above it.
 */
export async function requireAdmin() {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user?.email || !admins.includes(user.email.toLowerCase())) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  return { user, supabase } as const;
}
