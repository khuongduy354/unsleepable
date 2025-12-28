// middleware.ts (Next.js)
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

// Returns the authenticated user's id string, or throws an Error("Unauthorized")
// if no user is found. Callers should `await` this and let their try/catch
// map the error to a 401 response.
export async function requireAuth(request: NextRequest): Promise<string> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        // minimal cookie helpers backed by the incoming request
        getAll: () => request.cookies.getAll(),
        // setAll is a noop for API handlers; we don't mutate cookies here
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user)
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}
