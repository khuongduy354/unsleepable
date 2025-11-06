"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { loginStyles as styles } from "./LoginStyles";

import {
  handleEmailPasswordSubmit,
  // handleGoogleLogin,
  handleGuestLogin,
  handleGoToRegister,
} from "./loginHandlers";

export default function LoginPage() {
  const router = useRouter();
  // const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div style={styles.wrap}>
      <form
        onSubmit={(e) =>
          handleEmailPasswordSubmit({
            e,
            // supabase,
            router,
            email,
            password,
            setError,
            setLoading,
          })
        }
        style={styles.card}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Đăng nhập</h1>
        <p style={{ marginTop: 8, color: "#667085" }}>Chọn phương thức đăng nhập</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={styles.input}
            autoComplete="email"
            required
          />
        </label>

        <label style={styles.label}>
          Mật khẩu
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...styles.input, paddingRight: 72 }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              style={styles.eyeBtn}
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div style={styles.rowBetween}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {}}
            />
            Ghi nhớ tôi
          </label>
        </div>

        <button type="submit" style={styles.primaryBtn} disabled={loading}>
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>

        <button
          type="button"
          // onClick={() => handleGoogleLogin(supabase, setError)}
          style={styles.secondaryBtn}
        >
          🔑 Đăng nhập bằng Google
        </button>

        <button
          type="button"
          onClick={() => handleGuestLogin(router)}
          style={styles.guestBtn}
        >
          👤 Đăng nhập với tư cách khách
        </button>

        <p style={{ marginTop: 16, fontSize: 14, color: "#667085" }}>
          Chưa có tài khoản?{" "}
          <button
            type="button"
            onClick={() => handleGoToRegister(router)}
            style={styles.linkBtn}
          >
            Đăng ký ngay
          </button>
        </p>
      </form>
    </div>
  );
}

