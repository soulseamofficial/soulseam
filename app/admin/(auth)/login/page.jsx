"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔑 IMPORTANT (cookie receive cheyyadaniki)
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // ✅ cookie already set by API
      router.replace("/admin/dashboard");
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-black">
      <div className="w-full max-w-md bg-neutral-950 p-10 rounded-2xl shadow-2xl">
        <h1 className="text-white text-3xl font-bold text-center mb-8">
          Admin Login
        </h1>

        <div className="space-y-4">
          <input
            className="w-full p-3 rounded-xl bg-neutral-900 text-white border border-white/10"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-3 rounded-xl bg-neutral-900 text-white border border-white/10"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          )}

          <button
            onClick={login}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              loading
                ? "bg-neutral-400 text-black cursor-not-allowed"
                : "bg-white text-black hover:opacity-90"
            }`}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}


// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function AdminLoginPage() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const login = async () => {
//     setLoading(true);
//     setError("");

//     const res = await fetch("/api/admin/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password })
//     });

//     const data = await res.json();

//     if (res.ok) {
//       sessionStorage.setItem("admin", "1");
//       router.replace("/admin/dashboard");
//     } else {
//       setError(data.message || "Login failed");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-black">
//       <div className="w-full max-w-md bg-neutral-950 p-10 rounded-2xl shadow-2xl">
//         <h1 className="text-white text-3xl font-bold text-center mb-8">
//           Admin Login
//         </h1>

//         <div className="space-y-4">
//           <input
//             className="w-full p-3 rounded-xl bg-neutral-900 text-white border border-white/10"
//             placeholder="Email"
//             value={email}
//             onChange={e => setEmail(e.target.value)}
//           />

//           <input
//             type="password"
//             className="w-full p-3 rounded-xl bg-neutral-900 text-white border border-white/10"
//             placeholder="Password"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//           />

//           {error && <p className="text-red-400 text-sm">{error}</p>}

//           <button
//               onClick={login}
//               disabled={loading}
//               className={`w-full py-3 rounded-xl font-semibold transition ${
//                 loading ? "bg-neutral-400 text-black" : "bg-white text-black hover:opacity-90"
//               }`}
//             >
//               {loading ? "Signing in..." : "Login"}
//             </button>
//           <p className="text-white text-sm text-center mt-4 font-medium">
//             Don’t have an account?{" "}
//             <span
//               onClick={() => router.push("/admin/register")}
//               className="text-white font-bold cursor-pointer hover:underline"
//             >
//               Register
//             </span>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
