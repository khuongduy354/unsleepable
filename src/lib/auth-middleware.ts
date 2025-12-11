import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { NextRequest } from "next/server";

// export async function getAuthenticatedUser(request?: NextRequest) {
//   const cookieStore = request ? request.cookies : cookies();

//   const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         get: (name: string) => cookieStore.get(name)?.value,
//       },
//     }
//   );

//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();

//   if (error || !user) return null;

//   return user;
// }

// export async function requireAuth(request?: NextRequest) {
//   const user = await getAuthenticatedUser(request);

//   if (!user) {
//     throw new Error("Unauthorized: Supabase token missing or invalid");
//   }

//   return user;
// }
