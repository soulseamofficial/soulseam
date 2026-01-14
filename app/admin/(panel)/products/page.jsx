"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const router = useRouter();

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div
      className="min-h-screen py-10 px-2 sm:px-0 flex flex-col items-center bg-gradient-to-br from-neutral-950 via-fuchsia-900/40 to-neutral-950"
      style={{
        background:
          "radial-gradient(at 80% 18%,rgba(244,114,182,0.14) 0,transparent 75%)"
      }}
    >
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Add Product Button is here, to the top right of the Products heading */}
        <div className="w-full flex items-center justify-between px-1 mb-10">
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-fuchsia-300 via-fuchsia-500 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-fuchsia-700/60 drop-shadow-lg tracking-tight">
            Products
          </h1>
          {/* The "+ Add Product" button is on the right side of the heading */}
          <button
            onClick={() => router.push("/admin/products/create")}
            className="rounded-md border-[1.5px] border-fuchsia-300/60 px-6 py-2.5 text-base font-semibold text-fuchsia-200 hover:bg-fuchsia-700/20 outline-none transition-all duration-150 focus:ring-2 focus:ring-fuchsia-300/50 shadow-sm"
            style={{ minWidth: 134 }}
          >
            + Add Product
          </button>
        </div>
        <div className="w-full flex flex-col gap-5">
          {products.length === 0 && (
            <div className="text-fuchsia-300/70 text-center py-12 font-semibold tracking-wide text-lg">
              No products yet.
            </div>
          )}
          {products.map((p) => (
            <div
              key={p._id}
              className="relative flex flex-row items-center justify-between bg-gradient-to-tr from-white/5 via-fuchsia-900/40 to-fuchsia-900/10 border border-white/10 rounded-xl px-6 py-4 group transition-all"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white break-all mb-2">
                  {p.title}
                </h2>
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="inline-block bg-white/10 text-fuchsia-100 px-2 py-0.5 rounded font-medium">
                    ₹{p.price}
                  </span>
                  {p.stock !== undefined && (
                    <span className="inline-block bg-fuchsia-900/70 text-fuchsia-200 px-1.5 py-0.5 rounded ml-1 font-semibold">
                      Stock: {p.stock}
                    </span>
                  )}
                  {p.category && (
                    <span className="inline-block bg-fuchsia-950/70 text-fuchsia-300 border border-fuchsia-600/40 px-2 py-0.5 rounded ml-1 font-semibold">
                      {p.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <button
                  onClick={() => router.push(`/admin/products/edit/${p._id}`)}
                  className="flex items-center gap-2 px-3 py-0.5 rounded border border-fuchsia-700/40 text-fuchsia-200 bg-white/5 hover:bg-fuchsia-700/10 font-medium text-sm transition"
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 20 20">
                    <path d="M2 14.5V18h3.5l10-10.05-3.5-3.45L2 14.5zm15.71-8.29a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.5 3.45 2.09-2.09z" fill="#f5d0fe"/>
                  </svg>
                  Edit
                </button>
               
                <button
                  onClick={() => deleteProduct(p._id)}
                  className="flex items-center gap-2 px-3 py-0.5 rounded border border-red-700/40 text-red-200 bg-red-950/50 hover:bg-red-800/70 font-medium text-sm transition"
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 20 20">
                    <path d="M6 7v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" stroke="#fecaca" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M9 3h2a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Zm7 3H4" stroke="#fecaca" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        html { background: #0f001a; }
        body { background: transparent; }
      `}</style>
    </div>
  );
}
