import { notFound } from "next/navigation";

export default function AdminRegisterPage() {
  notFound(); // 🔒 permanently disabled
}



// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// export default function AdminRegisterPage() {
//   const router = useRouter();

//   const [form, setForm] = useState({ email: "", password: "" });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const register = async () => {
//     setLoading(true);
//     setError("");

//     const res = await fetch("/api/admin/register", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form)
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       setError(data.message || "Registration failed");
//       setLoading(false);
//       return;
//     }

//     router.push("/admin/login");
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-black">
//       <div className="w-full max-w-md bg-neutral-950 p-10 rounded-2xl shadow-xl">
//         <h1 className="text-white text-3xl font-bold text-center mb-8">
//           Admin Register
//         </h1>

//         <div className="space-y-4">
//           <input
//             className="w-full p-3 rounded-xl bg-neutral-900 text-white border border-white/10"
//             placeholder="Email"
//             value={form.email}
//             onChange={e => setForm({ ...form, email: e.target.value })}
//           />

//           <input
//             type="password"
//             className="w-full p-3 rounded-xl bg-neutral-900 text-white border border-white/10"
//             placeholder="Password"
//             value={form.password}
//             onChange={e => setForm({ ...form, password: e.target.value })}
//           />

//           {error && <p className="text-red-400 text-sm">{error}</p>}

//           <button
//             onClick={register}
//             disabled={loading}
//             className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
//           >
//             {loading ? "Creating account..." : "Create Account"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
