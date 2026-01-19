"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const router = useRouter();

  const fetchProducts = async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;

    await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
    });

    fetchProducts(); // refresh list
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-pink-400">Products</h1>
        <button
          onClick={() => router.push("/admin/products/create")}
          className="border px-4 py-2 rounded"
        >
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-purple-300">No products yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="border rounded p-4 bg-black/30"
            >
              <h2 className="text-xl font-semibold">{p.title}</h2>
              <p>₹ {p.price}</p>
              <p className="text-sm text-gray-400">{p.category}</p>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() =>
                    router.push(`/admin/products/edit?id=${p._id}`)
                  }
                  className="px-3 py-1 border rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteProduct(p._id)}
                  className="px-3 py-1 border border-red-500 text-red-400 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
