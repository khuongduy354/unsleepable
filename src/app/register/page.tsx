"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { registerStyles as styles } from "./RegisterStyles";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      alert("Vui lòng kiểm tra email để xác nhận tài khoản.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.wrap }}>
      <form 
        onSubmit={handleRegister} 
        style={styles.card}>
        <h1>Đăng ký</h1>
        {error && <div style={styles.error}>{error}</div>}
        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" style={styles.primaryBtn} disabled={loading}>
          {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/login")}
          style={styles.secondaryBtn}
        >
          ← Quay lại đăng nhập
        </button>
      </form>
    </div>
  );
}

