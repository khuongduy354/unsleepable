// lib/auth-cookie.ts
import { createClient } from "@/utils/supabase/server";

export async function requireAuthFromCookies() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: no session cookie");
  }

  return user;
}
