// ExploreCollection.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles, Filter, X, ShoppingBag, Star, ArrowUpRight } from "lucide-react";

// ----------- GLOBAL PRODUCT FALLBACK IMAGE UTILITY -------------
// Returns the primary product image if valid, otherwise '/coming-soon.jpg'
function getProductImage(product) {
  const img = Array.isArray(product?.images) && product.images.length > 0
    ? product.images[0]
    : "/coming-soon.jpg";
  if (!img || typeof img !== "string" || img.trim() === "") {
    return "/coming-soon.jpg";
  }
  return img;
}
// ---------------------------------------------------------------

const ExploreCollection = () => {
  // --- STATE ---

  // Page state
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [scrollProgress, setScrollProgress] = useState(0);

  // Product data
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Refs for smooth scroll sections
  const heroRef = useRef(null);
  const productsRef = useRef(null);
  const containerRef = useRef(null);

  // Categories config - for demo; use real values from backend in production
  const categories = [
    { id: "all", name: "All Collections", count: 42 },
    { id: "hoodies", name: "Signature Hoodies", count: 12 },
    { id: "tees", name: "Artistic Tees", count: 15 },
    { id: "pants", name: "Premium Pants", count: 8 },
    { id: "accessories", name: "Accessories", count: 7 },
  ];

  const filters = [
    { id: "size", name: "Size", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    { id: "color", name: "Color", options: ["Black", "White", "Gray", "Navy", "Olive", "Burgundy"] },
    { id: "price", name: "Price Range", options: ["Under ₹1500", "₹1500 - ₹3000", "₹3000 - ₹5000", "Over ₹5000"] },
    { id: "material", name: "Material", options: ["Organic Cotton", "Premium Blend", "Recycled Poly", "Linen"] },
  ];

  // --- FETCH PRODUCTS ---
  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductsLoading(true);

    fetch("/api/products")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to fetch products");
        const data = await r.json();
        if (!Array.isArray(data)) throw new Error("Bad products response");
        if (ignore) return;

        // Defensive, minimal remap
        const safeProducts = data.map((prod) => ({
          // avoid Math.random() during render; id must be stable
          id: String(prod?._id ?? prod?.id ?? ""),
          name: prod?.name ?? "Unnamed Product",
          category: prod?.category ?? "misc",
          price: typeof prod?.price === "number" ? prod.price : 0,
          originalPrice: typeof prod?.originalPrice === "number" ? prod.originalPrice : (typeof prod?.price === "number" ? prod.price : 0),
          rating: typeof prod?.rating === "number" ? prod.rating : 4.5,
          reviewCount: typeof prod?.reviewCount === "number" ? prod.reviewCount : 0,
          tags: Array.isArray(prod?.tags) ? prod.tags : [],
          description: prod?.description ?? "",
          images: Array.isArray(prod?.images) && prod.images.length > 0
            ? prod.images.filter((img) => !!img && typeof img === "string" && img.trim() !== "")
            : ["/coming-soon.jpg"],
        }));

        setProducts(safeProducts);
        setProductsLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setProducts([]);
        setProductsLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  // --- SCROLL PROGRESS BAR ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(100, (scrollTop / docHeight) * 100);
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- FILTERED & SORTED PRODUCTS ---
  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter((product) => product.category === activeCategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "rating": return b.rating - a.rating;
      default: return 0;
    }
  });

  // --- PRODUCT CARD ---
  const ProductCard = ({ product }) => {
    // Guard: fallback to 1-2 lines, line-clamp utility ensures truncation
    const description = product.description || "";

    return (
      <Link
        href={`/product/${product.id}`}
        className="product-card group relative overflow-hidden bg-black/60 border border-white/10 rounded-2xl shadow-xl transition-transform duration-200 hover:scale-[1.015] hover:border-white/20 cursor-pointer block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        tabIndex={0}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-black">
          <img
            src={getProductImage(product)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-opacity duration-300 bg-black"
            onError={e => { if (e.target.src !== "/coming-soon.jpg") e.target.src = "/coming-soon.jpg"; }}
          />
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              {product.tags.map((tag, idx) => (
                <span
                  key={`product-card-tag-${idx}-${String(tag)}`}
                  className="px-3 py-1 text-xs font-semibold bg-black/80 backdrop-blur-sm text-white rounded-full border border-white/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Product Info */}
        <div className="p-4 sm:p-5 md:p-6">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <Star size={14} className="sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-sm text-white/80">{product.rating}</span>
            <span className="text-[10px] sm:text-xs text-white/60">
              ({product.reviewCount})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/60 mb-3 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-lg sm:text-xl font-bold text-white">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-white/50 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 z-20">
          <Link
            href="/"
            className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 transition-all duration-300 touch-manipulation"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-1 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs sm:text-sm">BACK TO HOME</span>
          </Link>
        </div>

        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-20">
          <Link
            href="/cart"
            className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 transition-all duration-300 relative touch-manipulation"
          >
            <ShoppingBag size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">CART</span>
          </Link>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-6xl mx-auto">
            <div className="relative mb-6 sm:mb-8">
              <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light tracking-[0.1em] sm:tracking-[0.15em] mb-4 sm:mb-6 relative px-2">
                EXPLORE
                <span className="block mt-2 sm:mt-4 text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-[0.2em] sm:tracking-[0.3em]">
                  COLLECTION
                </span>
              </h1>
              <div className="relative w-48 sm:w-56 md:w-64 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
            </div>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto font-light tracking-wide px-4">
              Discover our curated selection of premium essentials, where craftsmanship meets conscious design
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              <button
                onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="group px-6 sm:px-8 md:px-12 py-3 sm:py-4 bg-white text-black rounded-full font-semibold text-sm sm:text-base md:text-lg flex items-center gap-2 sm:gap-3 hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 touch-manipulation w-full sm:w-auto max-w-xs sm:max-w-none"
              >
                <span>SHOP NOW</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/40 text-[10px] xs:text-xs tracking-[0.2em]">SCROLL</span>
            <div className="w-[1px] h-12 sm:h-14 md:h-16 bg-gradient-to-b from-white/50 via-white/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full bg-gradient-to-r from-white via-white/80 to-white transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 bg-black">
        {/* Categories Bar */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 touch-manipulation text-xs sm:text-sm"
                >
                  <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>FILTERS</span>
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1 md:pb-0">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-full transition-all duration-300 touch-manipulation whitespace-nowrap text-xs sm:text-sm ${
                      activeCategory === category.id
                        ? "bg-white text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs opacity-80">
                      ({category.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <section
          ref={productsRef}
          className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 sm:mb-12 md:mb-16 text-center">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/5 mb-4 sm:mb-6">
                <Sparkles size={16} className="sm:w-5 sm:h-5 text-yellow-400" />
                <span className="text-sm sm:text-base md:text-lg font-semibold">
                  PREMIUM COLLECTION
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6 px-4">
                Curated Essentials
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-3xl mx-auto px-4">
                Each piece is meticulously crafted with sustainable materials and timeless design principles
              </p>
            </div>

            {/* Mobile: Horizontal Scroll | Tablet+: Grid */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto md:overflow-x-visible scrollbar-hide gap-4 md:gap-6 lg:gap-8 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none" style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}>
              {productsLoading ? (
                // loading skeletons
                Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="flex-shrink-0 w-[75vw] md:w-auto snap-center md:snap-none">
                    <div className="animate-pulse h-full bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 md:p-6 min-h-[300px]" />
                  </div>
                ))
              ) : (
                sortedProducts.map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-[75vw] md:w-auto snap-center md:snap-none">
                    <ProductCard product={product} />
                  </div>
                ))
              )}
            </div>

            <div className="text-center mt-10 sm:mt-12 md:mt-16">
              <button className="group px-6 sm:px-8 md:px-12 py-3 sm:py-4 border-2 border-white/30 text-white rounded-full font-semibold text-sm sm:text-base md:text-lg flex items-center gap-2 sm:gap-3 mx-auto hover:bg-white/10 transition-all duration-300 touch-manipulation">
                <span>LOAD MORE</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-y border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {[
                { value: "S", label: "Style" },
                { value: "O", label: "Originality" },
                { value: "U", label: "Unmatched" },
                { value: "L", label: "Luxury & Premium" },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-2 sm:mb-3 md:mb-4 text-white">
                    {stat.value}
                  </div>
                  <div className="text-white/60 text-xs sm:text-sm tracking-wider px-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6 px-4">
                Join The Movement
              </h3>
              <p className="text-base sm:text-lg md:text-xl text-white/60 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto px-4">
                Be the first to access exclusive drops, early sales, and sustainable fashion insights
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto px-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-white/5 border border-white/20 text-white text-sm sm:text-base placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation"
                />
                <button className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black rounded-full font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all duration-300 touch-manipulation whitespace-nowrap">
                  SUBSCRIBE
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl">
          <div className="h-full overflow-y-auto">
            <div className="max-w-md mx-auto p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-semibold">FILTERS</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors duration-300 touch-manipulation"
                  aria-label="Close filters"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
              {filters.map((filter) => (
                <div key={filter.id} className="mb-6 sm:mb-8">
                  <h4 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">{filter.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {filter.options.map((option) => (
                      <button
                        key={option}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 text-xs sm:text-sm touch-manipulation"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="sticky bottom-0 pt-6 sm:pt-8 border-t border-white/10 bg-black/90 backdrop-blur-xl pb-4 sm:pb-6">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 sm:py-4 bg-white text-black rounded-full font-semibold text-sm sm:text-base md:text-lg touch-manipulation"
                >
                  APPLY FILTERS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .product-card {
          transition: transform 0.25s cubic-bezier(.4,.2,.1,1), border-color 0.25s cubic-bezier(.4,.2,.1,1);
          background: rgba(14, 14, 14, 1);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ExploreCollection;