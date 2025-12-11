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



// This is an example of how to use the requireAuthFromCookies function
// in a server component to protect a page.
/*import { requireAuthFromCookies } from "@/lib/auth-cookie";

export default async function DashboardPage() {
  const user = await requireAuthFromCookies();
  return <div>Hi {user.email}</div>;
}*/