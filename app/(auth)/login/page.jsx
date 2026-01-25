"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email OR phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier) {
      alert("Enter Email or Phone number");
      return;
    }

    const isPhone = /^\d{10}$/.test(identifier);

    // 👉 PHONE LOGIN (OTP – next step)
    if (isPhone) {
      alert("OTP login will be handled here (MSG91)");
      // router.push("/otp"); // future
      return;
    }

    // 👉 EMAIL LOGIN
    if (!password) {
      alert("Password required for email login");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/email/login", {
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
      localStorage.setItem("token", data.token);
      router.push("/");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>User Login</h2>

        <input
          type="text"
          placeholder="Email / Phone number"
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password (for email login)"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Register link */}
        <p style={{ textAlign: "center", marginTop: "14px", fontSize: "14px" }}>
          New user?{" "}
          <span
            className="auth-link"
            onClick={() => router.push("/register")}
          >
            Register
          </span>
        </p>

        {/* Forgot password */}
        <p style={{ textAlign: "center", marginTop: "8px", fontSize: "14px" }}>
          Forgot password?{" "}
          <span
            className="auth-link"
            onClick={async () => {
              if (!identifier || !identifier.includes("@")) {
                alert("Enter your registered email first");
                return;
              }

              const res = await fetch("/api/auth/email/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identifier }),
              });

              const data = await res.json();
              alert(data.message);
            }}
          >
            Reset here
          </span>
        </p>
      </div>
    </div>
  );
}
