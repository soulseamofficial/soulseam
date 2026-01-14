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

export default function CreateProduct() {
  const [form, setForm] = useState({
    title: "",
    price: "",
    description: "",
    stock: "",
    category: ""
  });
  // Images are stored as File objects
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
    if (files.length > 6) {
      setError("You can upload up to 6 images.");
      return;
    }
    // Only accept image files (jpg, jpeg, png, webp)
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const f of files) {
      if (!validTypes.includes(f.type)) {
        setError("Only JPG, PNG, or WEBP images allowed.");
        return;
      }
    }
    setImages(files);
    // Generate preview URLs
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // Clean up preview URLs on unmount/change
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
      setError("Please select at least one product image.");
      setIsLoading(false);
      return;
    }
    if (images.length > 6) {
      setError("You can upload up to 6 images.");
      setIsLoading(false);
      return;
    }
    // Optional: Minimum 1, max 6 images, all validations
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", Number(form.price));
      formData.append("description", form.description);
      formData.append("stock", Number(form.stock));
      formData.append("category", form.category);
      images.forEach((img, idx) => {
        formData.append(`images`, img); // As an array
      });

      const res = await fetch("/api/products", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Product saved 🎉");
        setForm({
          title: "",
          price: "",
          description: "",
          stock: "",
          category: ""
        });
        setImages([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setError(data.error || "Save failed ❌");
      }
    } catch (e) {
      setError("Error saving product.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-black via-[#201134] to-fuchsia-950 relative">
      <div className="w-full max-w-2xl bg-neutral-900/80 border border-fuchsia-800/20 rounded-3xl px-10 py-12 shadow-lg">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-10 bg-gradient-to-r from-fuchsia-300 via-pink-400 to-violet-500 text-transparent bg-clip-text drop-shadow">
          Add Product
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" encType="multipart/form-data">
          {/* Title */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Title <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Product name"
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
              maxLength={120}
              autoComplete="off"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Price ($) <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 29.99"
              className="block w-36 rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Description <span className="text-fuchsia-300 ml-1">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Short description"
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              rows={3}
              required
              maxLength={500}
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-[15px] sm:text-base font-semibold text-white mb-2">
              Product Images <span className="text-fuchsia-300 ml-1">*</span>
              <span className="text-[13px] font-normal text-fuchsia-200 ml-2">(JPG, PNG, WEBP, up to 6 images)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              name="images"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm cursor-pointer"
              required
            />
            {/* Previews */}
            <div className="flex flex-wrap gap-3 mt-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="w-20 h-20 rounded-xl bg-neutral-800 flex items-center justify-center border border-fuchsia-700/30 overflow-hidden shadow">
                  <img
                    src={src}
                    alt={`preview ${idx + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm mt-1 text-fuchsia-200">
              {images.length} selected / 6 max
            </div>
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="block w-full rounded-xl border border-fuchsia-700/20 bg-neutral-900/90 px-3 py-2 text-white placeholder-gray-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400 transition-all duration-200 shadow-sm"
              required
            >
              <option value="" className="text-black">Select category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="text-black">{opt}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-900/75 border border-red-500/30 text-red-200 py-2 px-4 font-semibold shadow-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg bg-fuchsia-900/80 border border-fuchsia-400/60 text-fuchsia-200 py-2 px-4 font-semibold shadow-sm drop-shadow">
              {success}
            </div>
          )}

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
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {isLoading ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
      <style>{`
        html { background: #0a0a0e; }
        body { background: transparent; }
      `}</style>
    </div>
  );
}
