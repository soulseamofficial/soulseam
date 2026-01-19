"use client";
import React, { useState, useRef, useEffect } from "react";

const CATEGORY_OPTIONS = [
  "Tops",
  "Bottoms",
  "Hats",
  "Outerwear",
  "Shoes",
  "Accessories",
  "Other"
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
    stock_XL: ""
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
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
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
      size => Number(form[`stock_${size}`]) > 0
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

      SIZES.forEach(size => {
        formData.append(
          `stock_${size}`,
          Number(form[`stock_${size}`] || 0)
        );
      });

      images.forEach(img => {
        formData.append("images", img);
      });

      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Product creation failed.");
        setIsLoading(false);
        return;
      }

      setSuccess("Product created successfully 🎉");

      setForm({
        title: "",
        price: "",
        description: "",
        category: "",
        stock_S: "",
        stock_M: "",
        stock_L: "",
        stock_XL: ""
      });

      setImages([]);
      setImagePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (err) {
      setError("Server error. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-black via-[#201134] to-fuchsia-950">
      <div className="w-full max-w-2xl bg-neutral-900/80 border border-fuchsia-800/20 rounded-3xl px-10 py-12 shadow-lg">
        <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-fuchsia-300 via-pink-400 to-violet-500 text-transparent bg-clip-text">
          Add Product
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            name="title"
            placeholder="Product title"
            value={form.title}
            onChange={handleChange}
            required
            className="rounded-xl p-3 bg-neutral-900 text-white border border-fuchsia-700/20"
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
            className="w-40 rounded-xl p-3 bg-neutral-900 text-white border border-fuchsia-700/20"
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            required
            className="rounded-xl p-3 bg-neutral-900 text-white border border-fuchsia-700/20"
          />

          {/* SIZE STOCK */}
          <div>
            <label className="text-white font-semibold mb-2 block">
              Size-wise Stock
            </label>
            <div className="grid grid-cols-2 gap-4">
              {SIZES.map(size => (
                <input
                  key={size}
                  type="number"
                  min="0"
                  name={`stock_${size}`}
                  placeholder={`${size} stock`}
                  value={form[`stock_${size}`]}
                  onChange={handleChange}
                  className="rounded-xl p-3 bg-neutral-900 text-white border border-fuchsia-700/20"
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
            className="rounded-xl p-3 bg-neutral-900 text-white border border-fuchsia-700/20"
          />

          <div className="flex gap-3 flex-wrap">
            {imagePreviews.map((src, i) => (
              <img
                key={i}
                src={src}
                className="w-20 h-20 object-cover rounded-xl border border-fuchsia-700/30"
              />
            ))}
          </div>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="rounded-xl p-3 bg-neutral-900 text-white border border-fuchsia-700/20"
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="text-black">
                {opt}
              </option>
            ))}
          </select>

          {error && <p className="text-red-400 font-semibold">{error}</p>}
          {success && <p className="text-green-400 font-semibold">{success}</p>}

          <button
            disabled={isLoading}
            className="mt-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-400 to-pink-400 text-black font-bold"
          >
            {isLoading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
