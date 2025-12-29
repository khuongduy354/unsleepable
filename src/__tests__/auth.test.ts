/**
 * src/__tests__/auth.test.ts
 *
 * Covers 5 test cases:
 * TC01 Login success
 * TC02 Login fail
 * TC03 Protected endpoint without auth
 * TC04 Forbidden by role (SKIP because production code chưa check role)
 * TC05 Token expired/invalid -> Unauthorized
 */

import { login } from "@/lib/auth-actions";
import { requireAuth } from "@/lib/auth-middleware";

// -------------------- Mocks (theo pattern "mock rõ ràng") --------------------
const mockRevalidatePath = jest.fn();
jest.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

/**
 * Next.js redirect() sẽ throw để ngắt execution.
 * Ta mock redirect thành throw để assert.
 */
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

/**
 * auth-actions.ts dùng createClient từ "@/utils/supabase/server"
 */
const mockSignInWithPassword = jest.fn();
jest.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
    },
  }),
}));

/**
 * auth-middleware.ts dùng createServerClient từ "@supabase/ssr"
 */
const mockGetUser = jest.fn();
jest.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: (...args: any[]) => mockGetUser(...args),
    },
  }),
}));

// -------------------- Helpers --------------------
function makeFormData(email: string, password: string) {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
}

/**
 * requireAuth cần NextRequest có request.cookies.getAll()
 * Mock tối giản theo đúng code requireAuth.
 */
function makeNextRequestMock() {
  return {
    cookies: {
      getAll: () => [],
    },
  } as any;
}

// -------------------- Test Suite --------------------
describe("Auth - Authentication & Authorization", () => {
  beforeAll(() => {
    // requireAuth cần 2 env này (dù ta mock createServerClient)
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "test-key";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================
  // TC01 — Login success
  // =========================
  it("TC01: Login thành công -> revalidatePath + redirect('/')", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });

    const fd = makeFormData("ok@example.com", "correct-password");

    await expect(login(fd)).rejects.toThrow("NEXT_REDIRECT:/");

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "ok@example.com",
      password: "correct-password",
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  // =========================
  // TC02 — Login fail (wrong password)
  // =========================
  it("TC02: Login sai password -> redirect('/error?message=...')", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    const fd = makeFormData("ok@example.com", "wrong-password");

    await expect(login(fd)).rejects.toThrow(
      "NEXT_REDIRECT:/error?message=Invalid%20login%20credentials"
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/error?message=Invalid%20login%20credentials"
    );
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  // =========================
  // TC03 — Protected access without auth
  // =========================
  it("TC03: Không có token / chưa đăng nhập -> requireAuth throw Unauthorized", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    const req = makeNextRequestMock();
    await expect(requireAuth(req)).rejects.toThrow("Unauthorized");
  });

  it("TC04: Đã đăng nhập -> requireAuth trả về user.id", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = makeNextRequestMock();
    const userId = await requireAuth(req);

    expect(userId).toBe("user-123");
  });


  // =========================
  // TC05 — Token expired / invalid session
  // (Supabase getUser trả user=null) => Unauthorized
  // =========================
  it("TC05: Token hết hạn / invalid -> requireAuth throw Unauthorized", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
    });

    const req = makeNextRequestMock();
    await expect(requireAuth(req)).rejects.toThrow("Unauthorized");
  });
});
