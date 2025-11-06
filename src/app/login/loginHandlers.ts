
// import type { SupabaseClient } from "@supabase/supabase-js";


type RouterLike = { push: (url: string) => void };

export function validate(email: string, password: string): string {
  if (!email.trim()) return "Email là bắt buộc";
  if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
  return "";
}

export async function handleEmailPasswordSubmit(params: {
  e: React.FormEvent;
  supabase: SupabaseClient;
  router: RouterLike;
  email: string;
  password: string;
  setError: (msg: string) => void;
  setLoading: (v: boolean) => void;
}) {
  const { e, supabase, router, email, password, setError, setLoading } = params;
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    const v = validate(email, password);
    if (v) throw new Error(v);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    router.push("/dashboard");
  } catch (err: any) {
    setError(err?.message || "Đăng nhập thất bại");
  } finally {
    setLoading(false);
  }
}

// export async function handleGoogleLogin(
//   supabase: SupabaseClient,
//   setError: (msg: string) => void
// ) {
//   const { error } = await supabase.auth.signInWithOAuth({
//     provider: "google",
//     options: { redirectTo: `${window.location.origin}/dashboard` },
//   });
//   if (error) setError(error.message);
// }

export function handleGuestLogin(router: RouterLike) {
  // guest session tạm thời — tuỳ bạn muốn lưu ở đâu
  localStorage.setItem(
    "guest_session",
    JSON.stringify({ name: "Khách", role: "guest" })
  );
  router.push("/dashboard");
}

export function handleGoToRegister(router: RouterLike) {
  router.push("/register");
}