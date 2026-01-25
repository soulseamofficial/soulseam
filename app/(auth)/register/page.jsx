"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email OR phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!identifier || !password) {
      alert("Email / Phone number and password required");
      return;
    }

    setLoading(true);

    const isPhone = /^\d{10}$/.test(identifier);

    // 👉 For now: only EMAIL register
    if (isPhone) {
      alert("Phone registration will be handled via OTP");
      setLoading(false);
      router.push("/login");
      return;
    }

    const res = await fetch("/api/auth/email/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: identifier,
        password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert("Registered successfully");
      router.push("/login");
    } else {
      if (data.message?.includes("already")) {
        alert("Account already exists. Redirecting to login...");
        router.push("/login");
      } else {
        alert(data.message);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Email / Phone number"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleRegister} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: "14px",
            opacity: 0.85,
          }}
        >
          Already have an account?{" "}
          <span className="auth-link" onClick={() => router.push("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
