"use client";

import React, { useState, useRef, useEffect } from "react";

const CATEGORY_OPTIONS = [
  "Tops",
  "Bottoms",
  "Hats",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Other",
];

const SIZES = ["S", "M", "L", "XL"];

export default function CreateProduct() {
  const [form, setForm] = useState({
    title: "",
    price: "",
    description: "",
    category: "",
    stock_S: "",
    stock_M: "",
    stock_L: "",
    stock_XL: "",
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleImageChange = (e) => {
    setError("");
    setSuccess("");

    const files = Array.from(e.target.files || []);
    if (files.length === 0 || files.length > 6) {
      setError("Please upload 1–6 images.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, PNG, or WEBP images allowed.");
        return;
      }
    }

    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (images.length === 0) {
      setError("Please upload at least one image.");
      setIsLoading(false);
      return;
    }

    const hasStock = SIZES.some(
      (size) => Number(form[`stock_${size}`]) > 0
    );

    if (!hasStock) {
      setError("Please enter stock for at least one size.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", Number(form.price));
      formData.append("description", form.description);
      formData.append("category", form.category);

      SIZES.forEach((size) => {
        formData.append(
          `stock_${size}`,
          Number(form[`stock_${size}`] || 0)
        );
      });

      images.forEach((img) => {
        formData.append("images", img);
      });

      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Product creation failed.");
        setIsLoading(false);
        return;
      }

      setSuccess("Product created successfully");

      setForm({
        title: "",
        price: "",
        description: "",
        category: "",
        stock_S: "",
        stock_M: "",
        stock_L: "",
        stock_XL: "",
      });

      setImages([]);
      setImagePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Server error. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="px-8 py-10">
      <div
        className="
          relative overflow-hidden
          max-w-3xl mx-auto
          rounded-3xl
          bg-gradient-to-b from-white/8 via-black/25 to-black
          backdrop-blur-2xl
          border border-white/12
          shadow-[0_18px_70px_rgba(255,255,255,0.14)]
          p-10
        "
      >
        {/* TOP LIGHT */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.92)_55%)]" />

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-10">
            Add Product
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              name="title"
              placeholder="Product title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />

            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              required
              className="w-48 px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              required
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />

            {/* SIZE STOCK */}
            <div>
              <p className="text-white font-semibold mb-3">
                Size-wise Stock
              </p>
              <div className="grid grid-cols-2 gap-4">
                {SIZES.map((size) => (
                  <input
                    key={size}
                    type="number"
                    min="0"
                    name={`stock_${size}`}
                    placeholder={`${size} stock`}
                    value={form[`stock_${size}`]}
                    onChange={handleChange}
                    className="px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                  />
                ))}
              </div>
            </div>

            {/* IMAGES */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white"
            />

            {imagePreviews.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    className="w-20 h-20 object-cover rounded-xl border border-white/20"
                  />
                ))}
              </div>
            )}

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-white/30"
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-black">
                  {opt}
                </option>
              ))}
            </select>

            {error && (
              <p className="text-rose-400 font-semibold">{error}</p>
            )}
            {success && (
              <p className="text-emerald-400 font-semibold">
                {success}
              </p>
            )}

            <button
              disabled={isLoading}
              className="
                w-full mt-6 py-3 rounded-xl
                bg-white/10 border border-white/20
                text-white font-bold
                hover:bg-white/15 hover:border-white/30
                hover:scale-[1.02]
                transition-all duration-200
              "
            >
              {isLoading ? "Saving..." : "Save Product"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
