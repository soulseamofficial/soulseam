
"use client";
import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, Menu, X, Search, User, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "./CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";


// Star icon SVG (to get color control easily)
const Star = ({ className = "" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width={16} height={16}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.179c.969 0 1.371 1.24.588 1.81l-3.384 2.458a1 1 0 00-.363 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.385-2.457a1 1 0 00-1.176 0l-3.385 2.457c-.785.57-1.84-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.048 9.394c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z"></path>
  </svg>
);

function toSizeArray(sizes) {
  if (!Array.isArray(sizes)) return [];
  return sizes.map((s) =>
  typeof s === "object"
  ? { size: s.size, stock: Number(s.stock) || 0 }
  : { size: s, stock: 99 }
  );
  }

  const SoulSeamEcommerce = () => {
  const { addToCart, cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [heroAnimationComplete, setHeroAnimationComplete] = useState(false);
  const [gsapLoaded, setGsapLoaded] = useState(false);

  // Modal + quick view
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  // Refs for hero animation
  const scrollContainerRef = useRef(null);
  const heroContentRef = useRef(null);
  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const sparkleContainerRef = useRef(null);

  const announcements = [
    "Free Shipping Pan-India",
    "One Purchase = One Plant Planted",
    "Future Proof Your Closet",
  ];

  // placeholder images
  const fashionImages = Array(19).fill("/coming-soon.jpg");

  // PRODUCTS
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchProducts() {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        let data = await res.json();
        if (!Array.isArray(data)) {
          setProducts([]);
          setLoadingProducts(false);
          return;
        }
        const normalized = data.map((p) => {
          const images = Array.isArray(p.images) ? p.images : [];
          return {
            ...p,
            _id: p._id,
            name: p.name || p.title || "Unnamed Product",
            price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
            originalPrice: typeof p.originalPrice === "number"
              ? p.originalPrice
              : Number(p.originalPrice) || Number(p.price) || 0,
            images,
            image: images?.[0] || "/coming-soon.jpg",
            hoverImage: images?.[1] || images?.[0] || "/coming-soon.jpg",
            sizes: Array.isArray(p.sizes) ? p.sizes : [],
            sizes: Array.isArray(p.sizes) ? p.sizes : [],
            category: (p.category || "").toLowerCase().trim(),
            totalStock:
              typeof p.totalStock === "number"
                ? p.totalStock
                : Array.isArray(p.sizes)
                ? p.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
                : 0,
          };
        });

        if (!ignore) {
          setProducts(normalized);
          setLoadingProducts(false);
        }
      } catch (e) {
        if (!ignore) {
          setProducts([]);
          setLoadingProducts(false);
        }
      }
    }

    fetchProducts();
    return () => {
      ignore = true;
    };
  }, []);

  // Latest Drop = Most recent 8 products
  const latestProducts = products
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || b._id?.toString()) -
        new Date(a.createdAt || a._id?.toString())
    )
    .slice(0, 8);

  // Best Sellers = 8 products with stock > 0
  const bestSellerProducts = products
    .filter((p) => p.totalStock > 0)
    .slice(0, 8);

  const router = useRouter();

  // --- Modal/Quickview ---
  const openQuickView = (product) => {
    setQuickViewProduct(product);
    setSelectedSize("");
    setQuantity(1);
    setCurrentImageIndex(0);
    setAddedToCart(false);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  // CLEAN body scroll lock handling for modal open/close
  useEffect(() => {
    if (!quickViewProduct) {
      document.body.style.overflow = "";
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [quickViewProduct]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    addToCart(quickViewProduct, selectedSize, quantity, "Black");
    setAddedToCart(true);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    addToCart(quickViewProduct, selectedSize, quantity, "Black");
    closeQuickView();
    router.push("/cart");
  };

  const nextImage = () => {
    if (!quickViewProduct) return;
    setCurrentImageIndex((prev) => {
      const imgs = Array.isArray(quickViewProduct.images)
        ? quickViewProduct.images
        : [];
      return prev === imgs.length - 1 ? 0 : prev + 1;
    });
  };

  const prevImage = () => {
    if (!quickViewProduct) return;
    setCurrentImageIndex((prev) => {
      const imgs = Array.isArray(quickViewProduct.images)
        ? quickViewProduct.images
        : [];
      return prev === 0 ? imgs.length - 1 : prev - 1;
    });
  };

  // GSAP Hero Animation Loads
  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    script.async = true;
    script.onload = () => setGsapLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Create sparkle particles
  const createSparkles = () => {
    if (!sparkleContainerRef.current) return;

    const container = sparkleContainerRef.current;
    container.innerHTML = "";

    // 25 sparkles
    for (let i = 0; i < 25; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "absolute pointer-events-none";
      const x = 40 + Math.random() * 60;
      const y = 40 + Math.random() * 20;
      const size = 1 + Math.random() * 3;
      const delay = Math.random() * 2;
      sparkle.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, ${0.3 + Math.random() * 0.3});
        border-radius: 50%;
        box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, 0.5);
        animation: sparkleFloat 3s ease-in-out ${delay}s infinite;
      `;
      container.appendChild(sparkle);
    }
  };

  useEffect(() => {
    if (
      !gsapLoaded ||
      typeof window === "undefined" ||
      typeof window.gsap === "undefined"
    ) {
      return;
    }

    const gsap = window.gsap;
    const container = scrollContainerRef.current;
    const heroContent = heroContentRef.current;
    const logo = logoRef.current;
    const tagline = taglineRef.current;
    if (!container || !heroContent || !logo || !tagline) return;

    setTimeout(createSparkles, 3000);

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => setHeroAnimationComplete(true),
    });

    tl.to(container, {
      x: "-100%",
      duration: 8,
      ease: "slow(0.7, 0.7, false)",
    })
      .to(
        container,
        {
          opacity: 0,
          scale: 0.9,
          duration: 1.5,
          ease: "power2.in",
          onComplete: () => {
            if (container) {
              container.style.display = "none";
            }
          },
        },
        "-=0.8"
      )
      .to(
        heroContent,
        {
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
        },
        "-=1"
      )
      .fromTo(
        logo,
        {
          opacity: 0,
          scale: 0.8,
          y: 40,
          filter: "blur(10px)",
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.8,
          ease: "power3.out",
          onStart: () => {
            if (sparkleContainerRef.current) {
              gsap.to(sparkleContainerRef.current, {
                opacity: 1,
                duration: 1,
                ease: "power2.out",
              });
            }
          },
        }
      )
      .fromTo(
        tagline,
        {
          opacity: 0,
          y: 30,
          letterSpacing: "-10px",
        },
        {
          opacity: 1,
          y: 0,
          letterSpacing: "0.05em",
          duration: 1.5,
          ease: "power2.out",
        },
        "-=1.2"
      );

    return () => {
      tl.kill();
    };
    // eslint-disable-next-line
  }, [gsapLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
  //   }, 3000);
  //   return () => clearInterval(interval);
  // }, [announcements.length]);

  useEffect(() => {
    if (typeof document !== "undefined" && !quickViewProduct) {
      document.documentElement.style.scrollBehavior = "smooth";
      return () => {
        if (!quickViewProduct) {
          document.documentElement.style.scrollBehavior = "auto";
        }
      };
    }
  }, [quickViewProduct]);

  // ---- REVISED PRODUCT CARD (BLACK BG) ----
  const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleQuickViewClick = (e) => {
      e.stopPropagation();
      openQuickView(product);
    };

    return (
      <div
        className="group relative overflow-hidden bg-black rounded-lg border border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-2"
        onClick={() => openQuickView(product)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isHovered ? product.hoverImage : product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 ease-in-out transform group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center transition-all duration-500 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={handleQuickViewClick}
              className="mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-white text-black font-semibold text-xs sm:text-sm md:text-base rounded-full transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-gradient-to-r hover:from-black hover:to-gray-800 hover:text-white border-2 border-white hover:scale-105 z-20 touch-manipulation"
              type="button"
            >
              Quick View
            </button>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-white group-hover:text-white transition-colors duration-300 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="text-lg sm:text-xl font-bold text-white">
              Rs. {Number(product.price).toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-white/50 line-through">
              Rs. {Number(product.originalPrice).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------- END PRODUCT CARD ---------------------------

  // Quick View Modal as an in-tree (non-portal) component
  const QuickViewModal = () => {
    if (!quickViewProduct) return null;

    // Use product-provided images if any, else fallback
    const productImages =
      Array.isArray(quickViewProduct.images) && quickViewProduct.images.length > 0
        ? quickViewProduct.images
        : ["/coming-soon.jpg", "/coming-soon.jpg", "/coming-soon.jpg", "/coming-soon.jpg"];

    // For sizes
    const sizesArray = Array.isArray(quickViewProduct.sizes)
      ? quickViewProduct.sizes
      : [];

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={closeQuickView}
        />
        <div
          className="relative w-full max-w-6xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden"
          style={{
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeQuickView}
            type="button"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 transition-all duration-300 touch-manipulation"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-y-auto" style={{maxHeight:"95vh"}}>
            <div className="relative overflow-hidden bg-black flex flex-col">
              <div className="relative h-[50vh] sm:h-[60%] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productImages[currentImageIndex] || "/coming-soon.jpg"}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 touch-manipulation"
                  tabIndex={0}
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 touch-manipulation"
                  tabIndex={0}
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
                  <span className="text-white text-xs sm:text-sm">
                    {currentImageIndex + 1} / {productImages.length}
                  </span>
                </div>
              </div>

              <div className="h-auto sm:h-[40%] p-2 sm:p-4 border-t border-white/10">
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl overflow-hidden border-2 touch-manipulation ${
                        currentImageIndex === index
                          ? "border-white"
                          : "border-white/20"
                      }`}
                      type="button"
                      tabIndex={0}
                      aria-label={`View image ${index + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${quickViewProduct.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Right Column - Info */}
            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto bg-black max-h-[95vh]">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    <span className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold bg-white/10 text-white rounded-full border border-white/20">
                      new
                    </span>
                    <span className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold bg-white/10 text-white rounded-full border border-white/20">
                      premium
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
                    {quickViewProduct.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63L2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <span className="text-white/80 text-sm sm:text-base">4.8</span>
                      <span className="text-white/60 text-xs sm:text-sm">(128 reviews)</span>
                    </div>
                    <span className="text-green-400 text-xs sm:text-sm">
                      ✓ In Stock
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    ₹{Number(quickViewProduct.price).toLocaleString()}
                  </span>
                  <span className="text-lg sm:text-xl text-white/60 line-through">
                    ₹{Number(quickViewProduct.originalPrice).toLocaleString()}
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs sm:text-sm font-semibold">
                    Save ₹
                    {(
                      Number(quickViewProduct.originalPrice) -
                      Number(quickViewProduct.price)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Product Description
                  </h3>
                  <p className="text-white/70 text-sm sm:text-base">
                    Premium quality {quickViewProduct.name.toLowerCase()} made with sustainable materials. Perfect for everyday wear with exceptional comfort and style.
                  </p>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Key Features
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {[
                      "Premium blend fabric (80% Cotton, 20% Polyester)",
                      "Eco-friendly water-based printing",
                      "Adjustable drawstring hood",
                      "Ribbed cuffs and hem for snug fit",
                      "Made with sustainable materials",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mt-0.5 sm:mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-white/70 text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Select Size
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                  {toSizeArray(quickViewProduct.sizes).map((s) => (
                  <button
                    key={s.size}
                    disabled={s.stock === 0}
                    onClick={() => setSelectedSize(s.size)}
                    className={`px-4 py-2 rounded-lg border
                      ${selectedSize === s.size
                        ? "bg-white text-black"
                        : "bg-white/10 text-white"}
                      ${s.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}
                    `}
                  >
                    {s.size}
                    {s.stock === 0 && (
                      <span className="block text-xs text-red-400">Out</span>
                    )}
                  </button>
                ))}
                    
                  
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <h4 className="text-white font-semibold text-sm sm:text-base">Quantity:</h4>
                  <div className="flex items-center gap-2 sm:gap-3 border border-white/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="p-1 hover:bg-white/10 rounded-full touch-manipulation"
                      type="button"
                      aria-label="Decrease quantity"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-white font-semibold min-w-[24px] sm:min-w-[30px] text-center text-sm sm:text-base">{quantity}</span>
                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="p-1 hover:bg-white/10 rounded-full touch-manipulation"
                      type="button"
                      aria-label="Increase quantity"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                {addedToCart ? (
                  <Link
                    href="/cart"
                    className="w-full py-3 rounded-full bg-green-600 text-white text-center font-semibold"
                  >
                    VIEW CART
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 rounded-full bg-white text-black font-semibold"
                  >
                    ADD TO CART
                  </button>
                )}              <button
                    onClick={handleBuyNow}
                    className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-sm sm:text-base md:text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all duration-300 touch-manipulation"
                    type="button"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>BUY NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <QuickViewModal />

      <div className="bg-black text-white py-2 overflow-hidden relative z-50">
        <div className="relative h-6">
          {announcements.map((announcement, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                index === announcementIndex
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-full"
              }`}
            >
              <p className="text-sm font-medium">{announcement}</p>
            </div>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black shadow-lg" : "bg-black/90 backdrop-blur-sm"
          
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="SOUL SEAM Logo"
                className="h-12 w-auto sm:h-16 md:h-20"
              />
            </div>
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <a
                href="#home"
                className="text-xs xl:text-sm font-medium hover:text-gray-600 transition-colors duration-300 whitespace-nowrap"
              >
                HOME
              </a>
              <a
                href="#tshirts"
                className="text-xs xl:text-sm font-medium hover:text-gray-600 transition-colors duration-300 whitespace-nowrap"
              >
                T-SHIRTS
              </a>
              <a
                href="#hoodies"
                className="text-xs xl:text-sm font-medium hover:text-gray-600 transition-colors duration-300 whitespace-nowrap"
              >
                HOODIES
              </a>
              <a
                href="#story"
                className="text-xs xl:text-sm font-medium hover:text-gray-600 transition-colors duration-300 whitespace-nowrap"
              >
                OUR STORY
              </a>
              <Link href="/blogs">
                <button className="text-xs xl:text-sm font-medium hover:text-gray-600 transition-colors duration-300 whitespace-nowrap">
                  BLOGS
                </button>
              </Link>

              <a
                href="#contact"
                className="text-xs xl:text-sm font-medium hover:text-gray-600 transition-colors duration-300 whitespace-nowrap"
              >
                CONTACT
              </a>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              <button className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors touch-manipulation" type="button" aria-label="Search">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => router.push("/login")}
                className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors"
                type="button"
                aria-label="User Login"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <Link
                href="/cart"
                className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors relative touch-manipulation"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                className="lg:hidden p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors touch-manipulation"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                type="button"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden pb-4 pt-2 border-t border-white/10">
              <nav className="flex flex-col space-y-3">
                <a
                  href="#home"
                  className="text-sm font-medium hover:text-gray-600 transition-colors duration-300 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </a>
                <a
                  href="#tshirts"
                  className="text-sm font-medium hover:text-gray-600 transition-colors duration-300 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  T-SHIRTS
                </a>
                <a
                  href="#hoodies"
                  className="text-sm font-medium hover:text-gray-600 transition-colors duration-300 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOODIES
                </a>
                <a
                  href="#story"
                  className="text-sm font-medium hover:text-gray-600 transition-colors duration-300 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  OUR STORY
                </a>
                <Link href="/blogs" className="text-sm font-medium hover:text-gray-600 transition-colors duration-300 py-2" onClick={() => setIsMenuOpen(false)}>
                  BLOGS
                </Link>
                <a
                  href="#contact"
                  className="text-sm font-medium hover:text-gray-600 transition-colors duration-300 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CONTACT
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      <section id="home" className="relative w-full h-screen bg-black overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 flex items-center"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-12 pl-4 sm:pl-6 md:pl-8">
            {fashionImages.map((img, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-[200px] h-[300px] xs:w-[240px] xs:h-[360px] sm:w-[280px] sm:h-[420px] md:w-[320px] md:h-[480px] lg:w-[400px] lg:h-[600px] overflow-hidden group"
                style={{
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="absolute inset-0 border border-white/20 rounded-[24px] overflow-hidden z-10 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-white/5 rounded-[24px]"></div>
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-white/5 via-white/0 to-white/5 rounded-[25px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </div>
                <div className="absolute inset-4 rounded-[16px] overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Fashion ${index + 1}`}
                      loading="eager"
                      className="w-full h-full object-cover transition-all duration-700 ease-out transform group-hover:scale-105"
                      style={{
                        filter:
                          "contrast(1.1) brightness(0.95) saturate(0.85)",
                        WebkitBackfaceVisibility: "hidden",
                        backfaceVisibility: "hidden",
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 group-hover:opacity-60 transition-opacity duration-700"
                      style={{
                        transform: "translateZ(10px)",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                <div
                  className="absolute inset-0 rounded-[24px] pointer-events-none"
                  style={{
                    boxShadow:
                      "inset 0 0 60px rgba(255, 255, 255, 0.03), inset 0 0 120px rgba(255, 255, 255, 0.01)",
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
        <div
          ref={heroContentRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-4"
        >
          <div
            ref={sparkleContainerRef}
            className="absolute inset-0 opacity-0"
            style={{
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          ></div>
          <div ref={logoRef} className="relative mb-6 sm:mb-8 lg:mb-12 px-4">
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mx-auto mb-8 sm:mb-12 md:mb-16 lg:mb-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-2 border-white/10"></div>
              <div className="absolute inset-4 sm:inset-6 md:inset-8 lg:inset-10 rounded-full bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4 sm:p-6 md:p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="logo2.jpg"
                  alt="SOUL SEAM Symbol"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute inset-0 rounded-full blur-3xl bg-white/10 opacity-0 animate-pulse"></div>
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-light tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] text-white text-center relative px-2">
              SOUL SEAM
              <div className="absolute -inset-2 sm:-inset-4 blur-xl bg-white/5 -z-10"></div>
            </h1>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4 sm:mt-6 lg:mt-8 w-3/4 mx-auto"></div>
          </div>
          <p
            ref={taglineRef}
            className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/90 font-light tracking-[0.05em] mb-8 sm:mb-10 md:mb-12 lg:mb-16 text-center max-w-2xl mx-auto px-4 leading-relaxed"
          >
            Every Seam Connects Your Soul
          </p>
          {/* Scroll indicator + Explore Collection button (only after intro animation) */}
          {heroAnimationComplete && (
            <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 lg:bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 sm:gap-6 animate-float w-full px-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-white/40 text-[10px] xs:text-xs tracking-[0.2em]">
                  SCROLL
                </span>
                <div className="w-[1px] h-12 sm:h-16 md:h-20 bg-gradient-to-b from-white/50 via-white/20 to-transparent"></div>
              </div>
              <Link
                href="/explore"
                className="group relative px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 md:py-5 bg-white text-black text-xs sm:text-sm md:text-base font-medium tracking-[0.1em] sm:tracking-[0.15em] overflow-hidden rounded-full border border-white/20 transition-all duration-500 hover:bg-transparent hover:text-white inline-block touch-manipulation w-full sm:w-auto max-w-xs sm:max-w-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                  <span className="whitespace-nowrap">EXPLORE COLLECTION</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-2 transition-transform duration-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </div>
          )}
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        ></div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.85) 100%)",
            mixBlendMode: "multiply",
          }}
        ></div>
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)",
            mixBlendMode: "overlay",
          }}
        ></div>
      </section>

      {/* Latest Drop (Dynamic) */}
      <section id="hoodies" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 md:mb-12 gap-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Latest Drop</h2>
            <Link
              href="/explore"
              className="bg-black text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 touch-manipulation whitespace-nowrap"
            >
              Explore Collection
            </Link>
          </div>
          {/* Mobile: Horizontal Scroll | Tablet+: Grid */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto md:overflow-x-visible scrollbar-hide gap-4 md:gap-6 lg:gap-8 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            {loadingProducts ? (
              <div className="text-white/60">Loading...</div>
            ) : latestProducts.length === 0 ? (
              <div className="text-white/60">No products found</div>
            ) : (
              latestProducts.map(product => (
                <div key={product._id} className="flex-shrink-0 w-[75vw] md:w-auto">
                  <ProductCard product={product} />
                </div>
              ))
            )
            }
          </div>
        </div>
      </section>

      {/* Best Sellers (Dynamic) */}
      <section id="tshirts" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 md:mb-12 gap-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Best Sellers</h2>
            <button className="bg-black text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 touch-manipulation whitespace-nowrap" type="button">
              Shop Now
            </button>
          </div>
          {/* Mobile: Horizontal Scroll | Tablet+: Grid */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto md:overflow-x-visible scrollbar-hide gap-4 md:gap-6 lg:gap-8 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            {loadingProducts ? (
              <div className="text-white/60">Loading...</div>
            ) : bestSellerProducts.length === 0 ? (
              <div className="text-white/60">No products found</div>
            ) : (
              bestSellerProducts.map(product => (
                <div key={product._id} className="flex-shrink-0 w-[75vw] md:w-auto">
                  <ProductCard product={product} />
                </div>
              ))
            )
            }
          </div>
        </div>
      </section>

      {/* ----- REMAINDER UI IS UNAFFECTED ----- */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible scrollbar-hide px-1">

            {/* CARD 1 */}
            <div className="group min-w-[75%] sm:min-w-[55%] md:min-w-0 relative rounded-2xl bg-gradient-to-b from-white/10 to-white/0 border border-white/15 p-6 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:border-white/40 hover:shadow-[0_20px_80px_rgba(255,255,255,0.15)]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-white/60 flex items-center justify-center bg-black transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                🌱
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-2">
                1 ORDER = 1 PLANT PLANTED
              </h3>
            </div>

            {/* CARD 2 */}
            <div className="group min-w-[75%] sm:min-w-[55%] md:min-w-0 relative rounded-2xl bg-gradient-to-b from-white/10 to-white/0 border border-white/15 p-6 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:border-white/40 hover:shadow-[0_20px_80px_rgba(255,255,255,0.15)]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-white/60 flex items-center justify-center bg-black transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                📦
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-2">
                SUSTAINABLE PACKAGING
              </h3>
            </div>

            {/* CARD 3 */}
            <div className="group min-w-[75%] sm:min-w-[55%] md:min-w-0 relative rounded-2xl bg-gradient-to-b from-white/10 to-white/0 border border-white/15 p-6 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:border-white/40 hover:shadow-[0_20px_80px_rgba(255,255,255,0.15)]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-white/60 flex items-center justify-center bg-black transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                🚚
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-2">
                FREE SHIPPING
              </h3>
            </div>
          </div>
        </div>
      </section>

      <section
        id="story"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-black text-white"
      >
        <div className="max-w-6xl mx-auto space-y-20">
          {/* ========= CARD 1 ========= */}
          <div className="animate-reveal grid grid-cols-2 gap-6 sm:gap-12 items-center rounded-3xl p-5 sm:p-10 bg-gradient-to-br from-white/10 to-white/0 border border-white/20 shadow-[0_30px_120px_rgba(255,255,255,0.15)]">

            {/* IMAGE */}
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="/coming-soon.jpg"
                alt="Screen Printed T-Shirts"
                className="w-full aspect-square object-cover scale-[1.08] transition-transform duration-[2000ms] ease-out sm:hover:scale-[1.18]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </div>
            {/* TEXT */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-3xl font-bold tracking-wide">
                SCREEN PRINTED T-SHIRTS
              </h2>
              <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                Stylish, sustainable, and crafted to make a statement. Each tee is
                printed with eco-friendly inks for a premium look.
              </p>
              <button className="group relative overflow-hidden px-6 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-semibold">
                <span className="relative z-10 flex items-center gap-2">
                  SHOP NOW
                  <span className="transition-transform duration-500 group-hover:translate-x-2">→</span>
                </span>
                <span className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                <span className="absolute inset-0 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  SHOP NOW →
                </span>
              </button>
            </div>
          </div>
          {/* ========= CARD 2 ========= */}
          <div className="animate-reveal delay-200 grid grid-cols-2 gap-6 sm:gap-12 items-center rounded-3xl p-5 sm:p-10 bg-gradient-to-br from-white/10 to-white/0 border border-white/20 shadow-[0_30px_120px_rgba(255,255,255,0.15)]">
            {/* TEXT */}
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-3xl font-bold tracking-wide">
                100% COTTON T-SHIRTS
              </h2>
              <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                Soft, breathable, and effortlessly cool. Designed for everyday comfort
                with timeless style.
              </p>
              <button className="group relative overflow-hidden px-6 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-semibold">
                <span className="relative z-10 flex items-center gap-2">
                  SHOP NOW
                  <span className="transition-transform duration-500 group-hover:translate-x-2">→</span>
                </span>
                <span className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                <span className="absolute inset-0 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  SHOP NOW →
                </span>
              </button>
            </div>
            {/* IMAGE */}
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="/coming-soon.jpg"
                alt="100% Cotton T-Shirts"
                className="w-full aspect-square object-cover scale-[1.08] transition-transform duration-[2000ms] ease-out sm:hover:scale-[1.18]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Newsletter</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-white/80 px-4">
            Join the crew for exclusive drops, epic giveaways, and deals you won't want to miss.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto px-4">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-full text-black text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white touch-manipulation"
            />
            <button className="bg-white text-black px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 touch-manipulation whitespace-nowrap" type="button">
              Join
            </button>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-gray-900 text-white py-12 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-10 md:mb-12">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">COMPANY</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a
                    href="#home"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#hoodies"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Clothing
                  </a>
                </li>
                <li>
                  <a
                    href="#story"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Our Story
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">OUR POLICY</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Shipping Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm sm:text-base text-white/70 hover:text-white transition-colors duration-300"
                  >
                    Return Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">CONTACT</h3>
              <p className="text-sm sm:text-base text-white/70 mb-3 sm:mb-4 break-words">Email: hello@soulseam.com</p>
              <p className="text-sm sm:text-base text-white/70 break-words">Phone: +91 XXX XXX XXXX</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 sm:pt-8 text-center">
            <p className="text-xs sm:text-sm text-white/50">
              © SOUL SEAM 2026. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        h1,
        p,
        button {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `}</style>
    </div>
  );
};

export default SoulSeamEcommerce;