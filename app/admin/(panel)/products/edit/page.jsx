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
    description: "",
    category: "",
    sizes: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
    },
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
          description: data.description,
          category: data.category,
          sizes: sizeMap,
        });
      });
  }, [id]);

  const updateProduct = async (e) => {
    e.preventDefault();

    const sizesArray = Object.entries(form.sizes).map(
      ([size, stock]) => ({
        size,
        stock: Number(stock),
      })
    );

    await fetch(`/api/admin/products?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        price: form.price,
        description: form.description,
        category: form.category,
        sizes: sizesArray,
      }),
    });

    router.push("/admin/products");
  };

  return (
    <form onSubmit={updateProduct} className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl mb-4">Edit Product</h1>

      <input
        placeholder="Title"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        className="w-full mb-3 p-2 rounded bg-black/30"
      />

      <input
        placeholder="Price"
        type="number"
        value={form.price}
        onChange={e => setForm({ ...form, price: e.target.value })}
        className="w-full mb-3 p-2 rounded bg-black/30"
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        className="w-full mb-3 p-2 rounded bg-black/30"
      />

      <input
        placeholder="Category"
        value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
        className="w-full mb-3 p-2 rounded bg-black/30"
      />

      <h3 className="text-lg mt-4 mb-2">Size-wise Stock</h3>

      {["S", "M", "L", "XL"].map(size => (
        <input
          key={size}
          type="number"
          placeholder={`${size} stock`}
          value={form.sizes[size]}
          onChange={e =>
            setForm({
              ...form,
              sizes: { ...form.sizes, [size]: e.target.value },
            })
          }
          className="w-full mb-2 p-2 rounded bg-black/30"
        />
      ))}

      <button className="border px-4 py-2 rounded mt-4">
        Update Product
      </button>
    </form>
  );
}
