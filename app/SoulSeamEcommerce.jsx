"use client";
import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, Menu, X, Search, User, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "./CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TrackOrderModal from "./components/TrackOrderModal";
import Footer from "./components/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const Star = ({ className = "" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width={16} height={16}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.179c.969 0 1.371 1.24.588 1.81l-3.384 2.458a1 1 0 00-.363 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.385-2.457a1 1 0 00-1.176 0l-3.385 2.457c-.785.57-1.84-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.048 9.394c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.967z"></path>
  </svg>
);

// Search Product Card Component with Swiper
const SearchProductCard = ({ product, router, onClose }) => {
  const dragStartRef = useRef({ x: 0, y: 0, isDragging: false });
  const searchProductImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || "/coming-soon.jpg"];

  const handleCardClick = (e) => {
    if (!dragStartRef.current.isDragging) {
      router.push(`/product/${product._id}`);
      onClose();
    }
  };

  const handleMouseDown = (e) => {
    dragStartRef.current = {
      x: e.clientX || e.touches?.[0]?.clientX || 0,
      y: e.clientY || e.touches?.[0]?.clientY || 0,
      isDragging: false,
    };
  };

  const handleMouseMove = (e) => {
    if (dragStartRef.current.x === 0 && dragStartRef.current.y === 0) return;
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
    const deltaX = Math.abs(currentX - dragStartRef.current.x);
    const deltaY = Math.abs(currentY - dragStartRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > 10) {
      dragStartRef.current.isDragging = true;
    }
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      dragStartRef.current = { x: 0, y: 0, isDragging: false };
    }, 100);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      className="group relative overflow-hidden bg-black/60 border border-white/10 rounded-lg cursor-pointer hover:border-white/30 transition-all duration-300 hover:scale-105"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
        {searchProductImages.length > 1 ? (
          <Swiper
            modules={[Pagination]}
            slidesPerView={1}
            spaceBetween={0}
            allowTouchMove={true}
            simulateTouch={true}
            grabCursor={true}
            loop={true}
            speed={400}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !bg-white/30 !w-1.5 !h-1.5",
              bulletActiveClass: "!bg-white/80",
            }}
            className="w-full h-full"
            style={{
              "--swiper-pagination-bottom": "0.5rem",
            }}
            onTouchStart={(swiper, event) => {
              handleMouseDown(event);
            }}
            onTouchMove={(swiper, event) => {
              handleMouseMove(event);
            }}
            onTouchEnd={(swiper, event) => {
              handleMouseUp();
            }}
          >
            {searchProductImages.map((img, idx) => (
              <SwiperSlide key={img || idx}>
                <img
                  src={img || "/coming-soon.jpg"}
                  alt={`${product.name} - Image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading={idx === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <img
            src={product.image || "/coming-soon.jpg"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            Rs. {Number(product.price).toLocaleString()}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-white/50 line-through">
              Rs. {Number(product.originalPrice).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [isMounted, setIsMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTrackOrderModalOpen, setIsTrackOrderModalOpen] = useState(false);

  // Removed all quick view related state
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

  const fashionImages = Array(19).fill("/coming-soon.jpg");

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

  const latestProducts = products
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt || b._id?.toString()) -
        new Date(a.createdAt || a._id?.toString())
    )
    .slice(0, 8);

  const bestSellerProducts = products
    .filter((p) => p.totalStock > 0)
    .slice(0, 8);

  const router = useRouter();

  // Removed openQuickView/closeQuickView and all quick view modal/scroll lock logic

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

  const createSparkles = () => {
    if (!sparkleContainerRef.current) return;

    const container = sparkleContainerRef.current;
    container.innerHTML = "";

    // Detect mobile screen size
    const isMobile = window.innerWidth < 768;
    const sparkleCount = isMobile ? 30 : 25;
    const minSize = isMobile ? 2 : 1;
    const maxSize = isMobile ? 5 : 3;

    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "absolute pointer-events-none";
      const x = 40 + Math.random() * 60;
      const y = 40 + Math.random() * 20;
      const size = minSize + Math.random() * (maxSize - minSize);
      const delay = Math.random() * 2;
      sparkle.style.cssText = `
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, ${0.3 + Math.random() * 0.3});
        border-radius: 50%;
        box-shadow: 0 0 ${size * (isMobile ? 3 : 2)}px rgba(255, 255, 255, 0.5);
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
          scale: 1,
          y: 0,
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
  }, [gsapLoaded]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when search modal is open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSearchOpen]);

  // NEW ProductCard component: navigates to /product/_id, no modal, no quick view
  const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, isDragging: false });
    const cardRef = useRef(null);

    // Get all product images for swiper
    const productImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || "/coming-soon.jpg"];

    const handleCardClick = (e) => {
      // Only navigate if it wasn't a drag
      if (!dragStartRef.current.isDragging) {
        router.push(`/product/${product._id}`);
      }
    };

    const handleMouseDown = (e) => {
      dragStartRef.current = {
        x: e.clientX || e.touches?.[0]?.clientX || 0,
        y: e.clientY || e.touches?.[0]?.clientY || 0,
        isDragging: false,
      };
    };

    const handleMouseMove = (e) => {
      if (dragStartRef.current.x === 0 && dragStartRef.current.y === 0) return;
      
      const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
      const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
      const deltaX = Math.abs(currentX - dragStartRef.current.x);
      const deltaY = Math.abs(currentY - dragStartRef.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // If drag distance exceeds 10px threshold, mark as dragging
      if (distance > 10) {
        dragStartRef.current.isDragging = true;
      }
    };

    const handleMouseUp = () => {
      // Reset after a short delay to allow click handler to check isDragging
      setTimeout(() => {
        dragStartRef.current = { x: 0, y: 0, isDragging: false };
      }, 100);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick(e);
      }
    };

    return (
      <div
        ref={cardRef}
        className="group relative overflow-hidden bg-black rounded-lg border border-white/10 shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-2 cursor-pointer"
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseUp();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`View details for ${product.name}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
          {productImages.length > 1 ? (
            <Swiper
              modules={[Pagination]}
              slidesPerView={1}
              spaceBetween={0}
              allowTouchMove={true}
              simulateTouch={true}
              grabCursor={true}
              loop={true}
              speed={400}
              pagination={{
                clickable: true,
                bulletClass: "swiper-pagination-bullet !bg-white/30 !w-1.5 !h-1.5",
                bulletActiveClass: "!bg-white/80",
              }}
              className="w-full h-full"
              style={{
                "--swiper-pagination-bottom": "0.5rem",
              }}
              onTouchStart={(swiper, event) => {
                handleMouseDown(event);
              }}
              onTouchMove={(swiper, event) => {
                handleMouseMove(event);
              }}
              onTouchEnd={(swiper, event) => {
                handleMouseUp();
              }}
            >
              {productImages.map((img, idx) => (
                <SwiperSlide key={img || idx}>
                  <img
                    src={img || "/coming-soon.jpg"}
                    alt={`${product.name} - Image ${idx + 1}`}
                    className="w-full h-full object-cover transition-all duration-700 ease-in-out transform group-hover:scale-110"
                    loading={idx === 0 ? "eager" : "lazy"}
                    draggable={false}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img
              src={product.image || "/coming-soon.jpg"}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-700 ease-in-out transform group-hover:scale-110"
              loading="lazy"
              draggable={false}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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

  // QuickViewModal: DELETED

  return (
    <div className="min-h-screen bg-black text-white">
      {/* QuickViewModal removed */}

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
            <div className="flex items-center justify-center flex-shrink-0 h-full">
              <Link href="/" className="flex items-center justify-center h-full">
                <Image
                  src="/logo.jpg"
                  alt="SOUL SEAM Logo"
                  width={80}
                  height={80}
                  priority
                  className="max-h-[2.75rem] sm:max-h-[3.5rem] md:max-h-[4.5rem] lg:max-h-[4.75rem] w-auto h-auto object-contain"
                />
              </Link>
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
              <button
                onClick={() => setIsTrackOrderModalOpen(true)}
                className="text-xs xl:text-sm font-medium hover:text-gray-600 transition-colors duration-300 whitespace-nowrap"
              >
                TRACK YOUR ORDER
              </button>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors touch-manipulation" 
                type="button" 
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/auth/user/me", { credentials: "include" });
                    const data = await res.json();
                    router.push(data?.user ? "/profile" : "/login");
                  } catch {
                    router.push("/login");
                  }
                }}
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
                {isMounted && cartCount > 0 && (
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
                <button
                  onClick={() => {
                    setIsTrackOrderModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="text-sm font-medium hover:text-gray-600 transition-colors duration-300 py-2 text-left"
                >
                  TRACK YOUR ORDER
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      {/* Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderModalOpen}
        onClose={() => setIsTrackOrderModalOpen(false)}
      />

      <section id="home" className="relative w-full h-screen bg-black overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 flex items-center"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="flex gap-6 sm:gap-6 md:gap-8 lg:gap-12 pl-4 sm:pl-6 md:pl-8">
            {fashionImages.map((img, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 w-[85vw] h-[65vh] max-w-[320px] max-h-[480px] sm:w-[280px] sm:h-[420px] md:w-[320px] md:h-[480px] lg:w-[400px] lg:h-[600px] overflow-hidden group"
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
          className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-4"
        >
          <div
            ref={sparkleContainerRef}
            className="absolute inset-0 opacity-0"
            style={{
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          ></div>
          <div ref={logoRef} className="relative mb-8 sm:mb-8 lg:mb-12">
            <div className="relative w-[85vw] h-[85vw] max-w-[450px] max-h-[450px] sm:w-96 sm:h-96 md:w-[520px] md:h-[520px] lg:w-[620px] lg:h-[620px] xl:w-[720px] xl:h-[720px] 2xl:w-[800px] 2xl:h-[800px] mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-2 border-white/10"></div>
              <div className="absolute inset-1.5 sm:inset-2 md:inset-2.5 lg:inset-3 xl:inset-3.5 rounded-full bg-gradient-to-br from-black to-gray-900 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo2.jpg"
                  alt="SOUL SEAM Symbol"
                  className="w-[99%] h-[99%] object-contain"
                />
              </div>
              <div className="absolute inset-0 rounded-full blur-3xl bg-white/10 opacity-0 animate-pulse"></div>
            </div>
            <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-light tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] text-white text-center relative px-2">
              SOUL SEAM
              <div className="absolute -inset-2 sm:-inset-4 blur-xl bg-white/5 -z-10"></div>
            </h1>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-6 sm:mt-6 lg:mt-8 w-3/4 mx-auto"></div>
          </div>
          <p
            ref={taglineRef}
            className="text-xl sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/90 font-light tracking-[0.05em] mb-10 sm:mb-10 md:mb-12 lg:mb-16 text-center max-w-2xl mx-auto px-4 leading-relaxed"
          >
            Every Seam Connects Your Soul
          </p>
          {heroAnimationComplete && (
            <div className="absolute bottom-8 sm:bottom-8 md:bottom-12 lg:bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 sm:gap-6 animate-float w-full px-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-white/40 text-xs sm:text-xs tracking-[0.2em]">
                  SCROLL
                </span>
                <div className="w-[1px] h-14 sm:h-16 md:h-20 bg-gradient-to-b from-white/50 via-white/20 to-transparent"></div>
              </div>
              <Link
                href="/explore"
                className="group relative px-8 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-4 md:py-5 bg-white text-black text-sm sm:text-sm md:text-base font-medium tracking-[0.1em] sm:tracking-[0.15em] overflow-hidden rounded-full border border-white/20 transition-all duration-500 hover:bg-transparent hover:text-white inline-block touch-manipulation w-full sm:w-auto max-w-xs sm:max-w-none"
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
            )}
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
            )}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible scrollbar-hide px-1">

            <div className="group min-w-[75%] sm:min-w-[55%] md:min-w-0 relative rounded-2xl bg-gradient-to-b from-white/10 to-white/0 border border-white/15 p-6 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:border-white/40 hover:shadow-[0_20px_80px_rgba(255,255,255,0.15)]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-white/60 flex items-center justify-center bg-black transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                🌱
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-2">
                1 ORDER = 1 PLANT PLANTED
              </h3>
            </div>

            <div className="group min-w-[75%] sm:min-w-[55%] md:min-w-0 relative rounded-2xl bg-gradient-to-b from-white/10 to-white/0 border border-white/15 p-6 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:border-white/40 hover:shadow-[0_20px_80px_rgba(255,255,255,0.15)]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-white/60 flex items-center justify-center bg-black transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                📦
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-2">
                SUSTAINABLE PACKAGING
              </h3>
            </div>

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
          <div className="animate-reveal grid grid-cols-2 gap-6 sm:gap-12 items-center rounded-3xl p-5 sm:p-10 bg-gradient-to-br from-white/10 to-white/0 border border-white/20 shadow-[0_30px_120px_rgba(255,255,255,0.15)]">

            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="/coming-soon.jpg"
                alt="Screen Printed T-Shirts"
                className="w-full aspect-square object-cover scale-[1.08] transition-transform duration-[2000ms] ease-out sm:hover:scale-[1.18]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-3xl font-bold tracking-wide">
                SCREEN PRINTED T-SHIRTS
              </h2>
              <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                Stylish, sustainable, and crafted to make a statement. Each tee is
                printed with eco-friendly inks for a premium look.
              </p>
              <button className="group relative overflow-hidden px-6 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer">
                <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 ease-in-out group-hover:text-white">
                  SHOP NOW
                  <span className="transition-transform duration-300 ease-in-out group-hover:translate-x-2">→</span>
                </span>
                {/* Premium dark glass hover overlay */}
                <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                  {/* Dark gradient background (charcoal → black) */}
                  <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                  {/* Inner highlight (top) */}
                  <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                  {/* Outer glow */}
                  <span className="absolute inset-0 rounded-full" style={{
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                  }}></span>
                </span>
              </button>
            </div>
          </div>
          <div className="animate-reveal delay-200 grid grid-cols-2 gap-6 sm:gap-12 items-center rounded-3xl p-5 sm:p-10 bg-gradient-to-br from-white/10 to-white/0 border border-white/20 shadow-[0_30px_120px_rgba(255,255,255,0.15)]">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-3xl font-bold tracking-wide">
                100% COTTON T-SHIRTS
              </h2>
              <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                Soft, breathable, and effortlessly cool. Designed for everyday comfort
                with timeless style.
              </p>
              <button className="group relative overflow-hidden px-6 py-3 rounded-full bg-white text-black text-xs sm:text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer">
                <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 ease-in-out group-hover:text-white">
                  SHOP NOW
                  <span className="transition-transform duration-300 ease-in-out group-hover:translate-x-2">→</span>
                </span>
                {/* Premium dark glass hover overlay */}
                <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                  {/* Dark gradient background (charcoal → black) */}
                  <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-full"></span>
                  {/* Inner highlight (top) */}
                  <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-full"></span>
                  {/* Outer glow */}
                  <span className="absolute inset-0 rounded-full" style={{
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
                  }}></span>
                </span>
              </button>
            </div>
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
            {"Join the crew for exclusive drops, epic giveaways, and deals you won't want to miss."}
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

      <Footer />

      {/* Search Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSearchOpen(false);
              setSearchQuery("");
            }
          }}
        >
          <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
            {/* Search Input */}
            <div className="relative mb-8">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full px-6 py-4 pr-12 rounded-full bg-white/10 border border-white/20 text-white text-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Search Results */}
            {searchQuery.trim() && (
              <div className="max-h-[60vh] overflow-y-auto">
                {(() => {
                  const query = searchQuery.toLowerCase();
                  const filtered = products.filter((product) => {
                    const name = product.name?.toLowerCase() || "";
                    const description = product.description?.toLowerCase() || "";
                    const category = product.category?.toLowerCase() || "";
                    return name.includes(query) || description.includes(query) || category.includes(query);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <p className="text-white/60 text-lg">No products found</p>
                        <p className="text-white/40 text-sm mt-2">Try a different search term</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtered.slice(0, 6).map((product) => (
                        <SearchProductCard
                          key={product._id}
                          product={product}
                          router={router}
                          onClose={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Empty State */}
            {!searchQuery.trim() && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Start typing to search products</p>
              </div>
            )}
          </div>
        </div>
      )}

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
        @keyframes sparkleFloat {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
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