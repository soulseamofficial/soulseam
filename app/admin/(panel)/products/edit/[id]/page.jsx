"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProduct({ params }) {
  const { id } = params;
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", price: "", description: "", image: "", stock: "", category: ""
  });

  useEffect(() => {
    fetch(`/api/products?id=${id}`)
      .then(res => res.json())
      .then(data => setForm(data));
  }, []);

  async function save() {
    await fetch(`/api/products?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    router.push("/admin/products");
  }

  return (
    <div
      className="min-h-screen py-10 px-2 sm:px-0 flex flex-col items-center bg-gradient-to-br from-neutral-950 via-fuchsia-900/40 to-neutral-950"
      style={{
        background:
          "radial-gradient(at 80% 18%,rgba(244,114,182,0.14) 0,transparent 75%)"
      }}
    >
      <div className="w-full max-w-xl flex flex-col items-center rounded-2xl bg-black/40 shadow-2xl border border-fuchsia-700/30 p-8 drop-shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-fuchsia-300 via-fuchsia-500 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-fuchsia-700/60 drop-shadow-lg tracking-tight mb-9">
          Edit Product
        </h1>
        <form
          className="w-full flex flex-col gap-6"
          onSubmit={e => {
            e.preventDefault();
            save();
          }}
        >
          {/* Title */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Title <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
            />
          </div>
          {/* Price */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Price (₹) <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="Price"
              className="block w-36 rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              rows={3}
            />
          </div>
          {/* Image URL */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Image URL <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              name="image"
              value={form.image}
              onChange={e => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
              type="url"
            />
          </div>
          {/* Stock */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Stock <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })}
              placeholder="e.g. 100"
              className="block w-36 rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
            />
          </div>
          {/* Category */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Category <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
            >
              <option value="" className="text-black">Select category</option>
              {["Tops","Bottoms","Hats","Outerwear","Shoes","Accessories","Other"].map(opt =>
                <option key={opt} value={opt} className="text-black">{opt}</option>
              )}
            </select>
          </div>
          {/* Save Button */}
          <button
            type="submit"
            className={`
              w-full flex items-center justify-center gap-2
              text-lg font-bold py-3 rounded-xl bg-gradient-to-r from-fuchsia-400 via-fuchsia-500 to-fuchsia-400
              shadow-lg shadow-fuchsia-800/30
              text-black tracking-wide
              hover:scale-[1.012] hover:from-fuchsia-300 hover:to-fuchsia-400
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-200
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            Save Changes
          </button>
        </form>
      </div>
      <style>{`
        html { background: #0f001a; }
        body { background: transparent; }
      `}</style>
    </div>
  );
}
