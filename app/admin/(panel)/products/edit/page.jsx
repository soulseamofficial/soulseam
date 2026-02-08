"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function EditProductPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    price: "",
    compareAtPrice: "",
    description: "",
    category: "",
    sizes: { S: 0, M: 0, L: 0, XL: 0 },
  });

  // Image management state
  const [existingImages, setExistingImages] = useState([]); // Cloudinary URLs
  const [newImageFiles, setNewImageFiles] = useState([]); // File objects
  const [newImagePreviews, setNewImagePreviews] = useState([]); // Preview URLs
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/products?id=${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch product: ${res.status}`);
        }
        return res.json();
      })
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

        // Load existing images - ensure it's an array
        const images = Array.isArray(data.images) ? data.images : [];
        setExistingImages(images);
      })
      .catch(err => {
        console.error("Error loading product:", err);
        setError("Failed to load product data. Please refresh the page.");
      });
  }, [id]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  const handleImageSelect = (files) => {
    setError("");
    const fileArray = Array.from(files);

    // Validate file types
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of fileArray) {
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, PNG, or WEBP images allowed.");
        return;
      }
    }

    // Check total image count (existing + new)
    const totalImages = existingImages.length + newImageFiles.length + fileArray.length;
    if (totalImages > 6) {
      setError("Maximum 6 images allowed. Please remove some images first.");
      return;
    }

    setNewImageFiles([...newImageFiles, ...fileArray]);
    setNewImagePreviews([
      ...newImagePreviews,
      ...fileArray.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageSelect(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageSelect(e.dataTransfer.files);
    }
  };

  const deleteExistingImage = (index) => {
    if (existingImages.length <= 1 && newImageFiles.length === 0) {
      setError("At least one image is required.");
      return;
    }
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const deleteNewImage = (index) => {
    // Revoke preview URL
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const setAsCoverImage = (index) => {
    const newOrder = [...existingImages];
    const [moved] = newOrder.splice(index, 1);
    newOrder.unshift(moved);
    setExistingImages(newOrder);
  };

  const setNewImageAsCover = (index) => {
    // Move new image to be first, and it will become cover after upload
    const newFiles = [...newImageFiles];
    const newPreviews = [...newImagePreviews];
    const [movedFile] = newFiles.splice(index, 1);
    const [movedPreview] = newPreviews.splice(index, 1);
    newFiles.unshift(movedFile);
    newPreviews.unshift(movedPreview);
    setNewImageFiles(newFiles);
    setNewImagePreviews(newPreviews);
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation: At least one image required
    if (existingImages.length === 0 && newImageFiles.length === 0) {
      setError("At least one image is required.");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", Number(form.price));
      if (form.compareAtPrice) {
        formData.append("compareAtPrice", Number(form.compareAtPrice));
      }
      formData.append("description", form.description);
      formData.append("category", form.category);

      // Add sizes
      const sizesArray = Object.entries(form.sizes)
        .map(([size, stock]) => ({ size, stock: Number(stock) }))
        .filter((s) => s.stock > 0);
      formData.append("sizes", JSON.stringify(sizesArray));

      // Determine final image order
      // If new images exist and first new image is marked as cover (index 0) 
      // AND there are no existing images, new images come first
      // Otherwise, existing images come first (they take priority)
      const shouldNewImagesBeFirst = existingImages.length === 0 && newImageFiles.length > 0;
      formData.append("newImagesFirst", shouldNewImagesBeFirst ? "true" : "false");

      // Add existing images (as JSON array)
      formData.append("existingImages", JSON.stringify(existingImages));

      // Add new image files
      newImageFiles.forEach((file) => {
        formData.append("newImages", file);
      });

      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Update failed.");
        setIsLoading(false);
        return;
      }

      router.push("/admin/products");
    } catch (err) {
      setError("Server error. Please try again.");
      setIsLoading(false);
    }
  };

  const totalImages = existingImages.length + newImageFiles.length;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black px-4 py-8">
      <form
        onSubmit={updateProduct}
        className="
          w-full max-w-4xl p-8 rounded-2xl
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

        {/* IMAGE MANAGEMENT SECTION */}
        <div className="mb-6">
          <h3 className="text-lg mb-3 text-white/80 font-semibold">
            Product Images ({totalImages}/6)
          </h3>
          <p className="text-sm text-white/50 mb-4">
            First image will be used as the cover image for product cards
          </p>

          {/* Show message if no images exist */}
          {existingImages.length === 0 && newImageFiles.length === 0 && (
            <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
              ⚠️ No images found. Please add at least one image for this product.
            </div>
          )}

          {/* Existing Images Grid */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm text-white/60 mb-2">Existing Images ({existingImages.length})</h4>
              <div className="grid grid-cols-4 gap-4">
                {existingImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/20"
                  >
                    <img
                      src={imageUrl}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Cover Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded">
                        ⭐ COVER
                      </div>
                    )}
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsCoverImage(index)}
                          className="px-3 py-1.5 bg-yellow-500/90 text-black text-xs font-semibold rounded hover:bg-yellow-400 transition-colors"
                        >
                          ⭐ Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteExistingImage(index)}
                        className="px-3 py-1.5 bg-red-500/90 text-white text-xs font-semibold rounded hover:bg-red-400 transition-colors"
                      >
                        ❌ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Image Previews */}
          {newImagePreviews.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm text-white/60 mb-2">New Images (Preview)</h4>
              <div className="grid grid-cols-4 gap-4">
                {newImagePreviews.map((previewUrl, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-white/20 bg-black/20"
                  >
                    <img
                      src={previewUrl}
                      alt={`New ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Cover Badge */}
                    {index === 0 && existingImages.length === 0 && (
                      <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded">
                        ⭐ COVER
                      </div>
                    )}
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => setNewImageAsCover(index)}
                          className="px-3 py-1.5 bg-yellow-500/90 text-black text-xs font-semibold rounded hover:bg-yellow-400 transition-colors"
                        >
                          ⭐ Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNewImage(index)}
                        className="px-3 py-1.5 bg-red-500/90 text-white text-xs font-semibold rounded hover:bg-red-400 transition-colors"
                      >
                        ❌ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          {totalImages < 6 && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-6 text-center
                transition-all duration-300
                ${
                  isDragOver
                    ? "border-white/40 bg-white/10"
                    : "border-white/20 bg-black/20"
                }
                hover:border-white/30 hover:bg-white/5
                cursor-pointer
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="text-white/60">
                <p className="text-lg mb-2">+ Add Images</p>
                <p className="text-sm">
                  Drag & drop images here or click to browse
                </p>
                <p className="text-xs mt-1 text-white/40">
                  {6 - totalImages} slot{6 - totalImages !== 1 ? "s" : ""} remaining
                </p>
              </div>
            </div>
          )}
        </div>

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

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* PREMIUM BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full mt-8 py-3 rounded-xl
            bg-gradient-to-r from-white to-zinc-300
            text-black font-semibold tracking-wide
            transition-all duration-300
            hover:scale-[1.05]
            hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isLoading ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
