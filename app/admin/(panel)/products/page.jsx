"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const router = useRouter();

  // Async product-fetching function, declared before useEffect
  const fetchProducts = async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    // Only call the async fetchProducts function here
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;

    await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
    });

    fetchProducts();
  };

  /* 🔍 SEARCH */
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  /* 🔃 SORT */
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const stockA =
      a.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;
    const stockB =
      b.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;

    if (sortBy === "priceLow") return a.price - b.price;
    if (sortBy === "priceHigh") return b.price - a.price;
    if (sortBy === "stockLow") return stockA - stockB;
    if (sortBy === "stockHigh") return stockB - stockA;

    return 0;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-pink-400">Products</h1>

        <div className="flex gap-3">
          {/* 🔍 Search */}
          <input
            type="text"
            placeholder="Search product..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border px-3 py-2 rounded bg-black text-white"
          />

          {/* 🔃 Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border px-3 py-2 rounded bg-black text-white"
          >
            <option value="">Sort by</option>
            <option value="priceLow">Price: Low → High</option>
            <option value="priceHigh">Price: High → Low</option>
            <option value="stockLow">Stock: Low → High</option>
            <option value="stockHigh">Stock: High → Low</option>
          </select>

          <button
            onClick={() => router.push("/admin/products/create")}
            className="border px-4 py-2 rounded"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Content */}
      {sortedProducts.length === 0 ? (
        <p className="text-center text-purple-300">
          No products found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedProducts.map((p) => {
            const totalStock =
              p.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;

            const lowStock = p.sizes?.some((s) => s.stock <= 2);

            return (
              <div
                key={p._id}
                className="border rounded p-4 bg-black/30"
              >
                <h2 className="text-xl font-semibold">{p.title}</h2>
                <p>₹ {p.price}</p>
                <p className="text-sm text-gray-400">{p.category}</p>

                {/* Total stock */}
                <p className="text-sm text-green-400 mt-1">
                  Total Stock: {totalStock}
                </p>

                {/* Low stock warning */}
                {lowStock && (
                  <p className="text-xs text-red-400 font-semibold">
                    ⚠️ Low stock
                  </p>
                )}

                {/* Size-wise stock */}
                {p.sizes && p.sizes.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2 text-sm">
                    {p.sizes.map((s) => (
                      <span
                        key={s.size}
                        className="px-2 py-1 rounded bg-white/10 border border-white/20"
                      >
                        {s.size}: {s.stock}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/products/edit?id=${p._id}`
                      )
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
            );
          })}
        </div>
      )}
    </div>
  );
}
