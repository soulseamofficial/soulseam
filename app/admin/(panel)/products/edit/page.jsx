"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function EditProductPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    price: "",
    compareAtPrice: "",
    description: "",
    category: "",
    sizes: { S: 0, M: 0, L: 0, XL: 0 },
  });

  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/products?id=${id}`)
      .then(res => res.json())
      .then(data => {
        const sizeMap = { S: 0, M: 0, L: 0, XL: 0 };
        data.sizes?.forEach(s => {
          sizeMap[s.size] = s.stock;
        });

        setForm({
          title: data.title,
          price: data.price,
          compareAtPrice: data.compareAtPrice || "",
          description: data.description,
          category: data.category,
          sizes: sizeMap,
        });
      });
  }, [id]);

  const updateProduct = async (e) => {
    e.preventDefault();

    const sizesArray = Object.entries(form.sizes).map(
      ([size, stock]) => ({ size, stock: Number(stock) })
    );

    await fetch(`/api/admin/products?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        price: form.price,
        compareAtPrice: form.compareAtPrice || null,
        description: form.description,
        category: form.category,
        sizes: sizesArray,
      }),
    });

    router.push("/admin/products");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black px-4">
      <form
        onSubmit={updateProduct}
        className="
          w-full max-w-xl p-8 rounded-2xl
          bg-white/5 backdrop-blur-xl
          border border-white/10
          shadow-[0_0_40px_rgba(255,255,255,0.05)]
          transition-all duration-500
          hover:shadow-[0_0_60px_rgba(255,255,255,0.15)]
          animate-fadeIn
        "
      >
        <h1 className="text-3xl font-semibold mb-6 text-white tracking-wide">
          Edit Product
        </h1>

        {/* INPUT STYLE */}
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="
            w-full mb-4 p-3 rounded-xl
            bg-black/40 text-white
            border border-white/10
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-white/30
            focus:scale-[1.02]
          "
        />

        <div className="flex gap-4 mb-4">
          <input
            type="number"
            placeholder="Selling Price"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="
              flex-1 p-3 rounded-xl
              bg-black/40 text-white
              border border-white/10
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-white/30
              focus:scale-[1.02]
            "
          />
          <input
            type="number"
            placeholder="Original Price (MRP) - Optional"
            value={form.compareAtPrice}
            onChange={e => setForm({ ...form, compareAtPrice: e.target.value })}
            className="
              flex-1 p-3 rounded-xl
              bg-black/40 text-white
              border border-white/10
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-white/30
              focus:scale-[1.02]
            "
          />
        </div>

        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className="
            w-full mb-4 p-3 rounded-xl
            bg-black/40 text-white
            border border-white/10
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-white/30
            focus:scale-[1.02]
          "
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="
            w-full mb-4 p-3 rounded-xl
            bg-black/40 text-white
            border border-white/10
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-white/30
            focus:scale-[1.02]
          "
        />

        <h3 className="text-lg mt-6 mb-3 text-white/80">
          Size-wise Stock
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {["S", "M", "L", "XL"].map(size => (
            <input
              key={size}
              type="number"
              placeholder={`${size} Stock`}
              value={form.sizes[size]}
              onChange={e =>
                setForm({
                  ...form,
                  sizes: { ...form.sizes, [size]: e.target.value },
                })
              }
              className="
                p-3 rounded-xl
                bg-black/40 text-white
                border border-white/10
                transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-white/30
                hover:scale-[1.05]
              "
            />
          ))}
        </div>

        {/* PREMIUM BUTTON */}
        <button
          className="
            w-full mt-8 py-3 rounded-xl
            bg-gradient-to-r from-white to-zinc-300
            text-black font-semibold tracking-wide
            transition-all duration-300
            hover:scale-[1.05]
            hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]
            active:scale-95
          "
        >
          Update Product
        </button>
      </form>
    </div>
  );
}
