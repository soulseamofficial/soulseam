"use client";
import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, Menu, X, Search, User, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SoulSeamEcommerce = () => {
  const { addToCart, cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [heroAnimationComplete, setHeroAnimationComplete] = useState(false);
  const [gsapLoaded, setGsapLoaded] = useState(false);

  // State for Quick View modal
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  // -- remove scrollPositionRef as it's no longer used for scroll-jumping --
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

  const fashionImages = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1576589971218-736b955fc688?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800&h=1200&fit=crop&q=90",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1200&fit=crop&q=90",
  ];

  const products = [
    {
      id: 1,
      name: "The Frost King Hoodie",
      price: 2490,
      originalPrice: 2990,
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1200&fit=crop",
    },
    {
      id: 2,
      name: "The Supercharged Hoodie",
      price: 2490,
      originalPrice: 2990,
      image:
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=800&h=1200&fit=crop",
    },
    {
      id: 3,
      name: "The Dragon Hoodie",
      price: 2490,
      originalPrice: 2990,
      image:
        "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&h=1200&fit=crop",
    },
    {
      id: 4,
      name: "The Armadillo Hoodie",
      price: 2490,
      originalPrice: 2990,
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&h=1200&fit=crop",
    },
  ];

  const bestSellers = [
    {
      id: 5,
      name: "Dragon's Wrath Tee",
      price: 1500,
      originalPrice: 2450,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=1200&fit=crop",
    },
    {
      id: 6,
      name: "Dark Knight Tee",
      price: 1950,
      originalPrice: 2450,
      image:
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&h=1200&fit=crop",
    },
    {
      id: 7,
      name: "The Octopus Tee",
      price: 1950,
      originalPrice: 2450,
      image:
        "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1200&fit=crop",
    },
    {
      id: 8,
      name: "Moonlit Bones Tee",
      price: 1950,
      originalPrice: 2450,
      image:
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&h=1200&fit=crop",
      hoverImage:
        "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&h=1200&fit=crop",
    },
  ];

  const router = useRouter();



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
      // Restore body's scroll ability on close
      document.body.style.overflow = "";
      return;
    }

    // Lock scroll when modal open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [quickViewProduct]);

  const handleAddToCart = (e) => {
    // Remove e.preventDefault() as we don't have a form!
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    addToCart(quickViewProduct, selectedSize, quantity, "Black");
    setAddedToCart(true);
  };

  const handleBuyNow = (e) => {
    // Remove e.preventDefault() as we don't have a form!
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
    setCurrentImageIndex((prev) => (prev === 3 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (!quickViewProduct) return;
    setCurrentImageIndex((prev) => (prev === 0 ? 3 : prev - 1));
  };

  useEffect(() => {
    // Don't run during SSR
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

    // Create 25 subtle sparkles
    for (let i = 0; i < 25; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "absolute pointer-events-none";

      // Random position around the logo
      const x = 40 + Math.random() * 60;
      const y = 40 + Math.random() * 20;

      // Random size (very subtle)
      const size = 1 + Math.random() * 3;

      // Random animation delay
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
    // Don't run during SSR and require GSAP loaded
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

    // Create sparkles after a delay
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
      // Only set smooth scroll when modal is NOT open
      document.documentElement.style.scrollBehavior = "smooth";
      return () => {
        if (!quickViewProduct) {
          document.documentElement.style.scrollBehavior = "auto";
        }
      };
    }
  }, [quickViewProduct]);

  const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleQuickViewClick = (e) => {
      e.stopPropagation();
      openQuickView(product);
    };

    return (
      <div
        className="group relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isHovered ? product.hoverImage : product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 ease-in-out transform group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center transition-all duration-500 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={handleQuickViewClick}
              className="mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-white text-black font-semibold text-xs sm:text-sm md:text-base rounded-full transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-black hover:text-white border-2 border-white hover:scale-105 z-20 touch-manipulation"
              type="button"
            >
              Quick View
            </button>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 text-black group-hover:text-gray-800 transition-colors duration-300 line-clamp-2">
            {product.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="text-lg sm:text-xl font-bold text-black">
              Rs. {product.price.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-gray-600 line-through">
              Rs. {product.originalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Quick View Modal as an in-tree (non-portal) component
  const QuickViewModal = () => {
    if (!quickViewProduct) return null;

    const productImages = [
      quickViewProduct.image,
      quickViewProduct.hoverImage,
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=800&h=1200&fit=crop",
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&h=1200&fit=crop",
    ];

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
                  src={productImages[currentImageIndex]}
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
                    ₹{quickViewProduct.price.toLocaleString()}
                  </span>
                  <span className="text-lg sm:text-xl text-white/60 line-through">
                    ₹{quickViewProduct.originalPrice.toLocaleString()}
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs sm:text-sm font-semibold">
                    Save ₹
                    {(
                      quickViewProduct.originalPrice - quickViewProduct.price
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
                    {["S", "M", "L", "XL"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 touch-manipulation ${
                          selectedSize === size
                            ? "bg-white text-black border-white transform scale-105"
                            : "bg-white/5 text-white border-white/20 hover:border-white/40"
                        }`}
                        type="button"
                      >
                        <span className="font-semibold text-sm sm:text-base">{size}</span>
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
                      className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 bg-green-600 text-white touch-manipulation"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>VIEW CART</span>
                    </Link>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 bg-white text-black hover:bg-gray-200 touch-manipulation"
                      type="button"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>ADD TO CART</span>
                    </button>
                  )}
                  <button
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

              <button className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors touch-manipulation" type="button" aria-label="User">
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
           className={`
             relative flex-shrink-0
             w-[80vw] h-[70vh]
             max-w-[320px] max-h-[520px]
             sm:w-[280px] sm:h-[420px]
             md:w-[320px] md:h-[480px]
             lg:w-[400px] lg:h-[600px]
             overflow-hidden group
           `}
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
          // Remove forced inline opacity style as it may prevent GSAP from animating/showing the block
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
            Where Threads Weave Souls
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
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[75vw] md:w-auto snap-center md:snap-none">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

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
            {bestSellers.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[75vw] md:w-auto snap-center md:snap-none">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-2 border-white">
                <span className="text-white text-2xl sm:text-3xl">🌱</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">
                1 ORDER = 1 PLANT PLANTED
              </h3>
              <p className="text-sm sm:text-base text-gray-400 px-4">
                Join us in our mission to show the planet some love
              </p>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-2 border-white">
                <span className="text-white text-2xl sm:text-3xl">📦</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">
                SUSTAINABLE PACKAGING
              </h3>
              <p className="text-sm sm:text-base text-gray-400 px-4">Zero Plastic</p>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300 sm:col-span-2 md:col-span-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-2 border-white">
                <span className="text-white text-2xl sm:text-3xl">🚚</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">
                FREE SHIPPING
              </h3>
              <p className="text-sm sm:text-base text-gray-400 px-4">On All Orders</p>
            </div>
          </div>
        </div>
      </section>

      <section id="story" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop"
                alt="Screen Printed T-Shirts"
                className="w-full h-auto rounded-xl sm:rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
                SCREEN PRINTED T-SHIRTS
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8">
                Stylish, sustainable, and crafted to make a statement. Each tee is printed with eco-friendly inks for a look that's as conscious as it is cool.
              </p>
              <button className="bg-white text-black px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 touch-manipulation" type="button">
                SHOP NOW
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center mt-12 sm:mt-16 md:mt-20">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white">
                100% COTTON T-SHIRTS
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-6 sm:mb-8">
                Soft, breathable, and effortlessly cool. Made for your lifestyle.
              </p>
              <button className="bg-white text-black px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 touch-manipulation" type="button">
                SHOP NOW
              </button>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop"
                alt="100% Cotton T-Shirts"
                className="w-full h-auto rounded-xl sm:rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
              />
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

      {/* <style jsx>{`
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
      `}</style> */}
    </div>
  );
};

export default SoulSeamEcommerce;