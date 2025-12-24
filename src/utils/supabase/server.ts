import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function createClient() {
  const cookieStore = await cookies(); // ✅ quan trọng

  // Debug: log presence of required env vars (do not print values)
  try {
    // eslint-disable-next-line no-console
    console.log(
      `[supabase] createClient called — URL present: ${!!supabaseUrl}, anonKey present: ${!!supabaseKey}`
    );
  } catch {}

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options); // ✅ giờ có .set
          });
        } catch {
          // ignore nếu bị gọi từ Server Component không set cookie được
          console.log("Error!!!!!")
        }
      },
    },
  });
}
