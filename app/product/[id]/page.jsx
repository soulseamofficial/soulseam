"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/app/CartContext";
import { createContext, useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import ReviewSection from "@/app/components/ReviewSection";
import SocialProof from "@/app/components/SocialProof";

// ICONS
function IconCheck() {
  return (
    <svg width={22} height={22} fill="none" stroke="currentColor" className="inline-block mr-1" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 13l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg width={20} height={20} fill="none" stroke="currentColor" className="inline-block mr-1" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M3 17V5a2 2 0 012-2h9v14H5a2 2 0 01-2-2z" />
      <path d="M16 17a2 2 0 104 0" />
      <path d="M16 3h3a2 2 0 012 2v5h-5V3z" />
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg width={20} height={20} fill="none" stroke="currentColor" className="inline-block mr-1" strokeWidth={1.7} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
function IconStar({ filled }) {
  return filled ? (
    <svg width={20} height={20} fill="#fff" className="inline-block mx-[1px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.22)]" viewBox="0 0 24 24">
      <path d="M12 18.25l6.16 3.73-1.64-7.04L21.92 9.5l-7.19-.61L12 2.5l-2.73 6.39-7.19.61 5.4 5.44L5.84 22z"/>
    </svg>
  ) : (
    <svg width={20} height={20} fill="none" stroke="#fff" className="inline-block mx-[1px] opacity-60" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 18.25l6.16 3.73-1.64-7.04L21.92 9.5l-7.19-.61L12 2.5l-2.73 6.39-7.19.61 5.4 5.44L5.84 22z"/>
    </svg>
  );
}
// Left Arrow Icon for Back button
function IconArrowLeft({className=""}) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 5l-7 6 7 6" />
    </svg>
  );
}

function formatPrice(price) {
  if (price == null) return "₹0";
  return "₹" + Number(price).toLocaleString("en-IN");
}

// Helper function to format product description
// Handles both plain text (with line breaks) and HTML content
function formatDescription(description) {
  if (!description) return null;
  
  // Check if description contains HTML tags
  const hasHTML = /<[a-z][\s\S]*>/i.test(description);
  
  if (hasHTML) {
    // Contains HTML - render as-is (admin-controlled content)
    return description;
  } else {
    // Plain text - convert newlines to <br> and escape HTML for security
    return description
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>");
  }
}


// Glassmorphism + luxury inspired classes - MATCHING CHECKOUT PAGE HOVER EFFECTS
const glassCard = "relative overflow-hidden bg-gradient-to-b from-white/8 via-black/25 to-black backdrop-blur-2xl border border-white/12 rounded-3xl shadow-[0_18px_70px_rgba(255,255,255,0.14)] transition-all duration-600 ease-out will-change-transform premium-summary-hover";
const glassCardInner = "absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.92)_55%)]";
const hoverGlow = "hover:-translate-y-2.5 hover:shadow-[0_32px_100px_rgba(255,255,255,0.19)] hover:border-white/25 transition-all duration-600 ease-out will-change-transform";
const focusRing = "focus:outline-none focus:border-white/30";
const shimmer = "animate-pulse bg-gradient-to-br from-[#191921] to-black/80";
const fadeAnim = "transition-all duration-600 ease-out";
const pillBtn = "min-w-14 px-7 py-3 rounded-2xl text-lg font-semibold border border-white/15 bg-black/40 text-white/90 transition-all duration-500 ease-out shadow-[0_10px_45px_rgba(255,255,255,0.12)] hover:bg-black/50 hover:border-white/30 focus:outline-none focus:bg-black/75 focus:border-white/40 focus:ring-2 focus:ring-white/20";
const pillBtnSelected = "border-white/30 bg-black/60 text-white shadow-[0_15px_60px_rgba(255,255,255,0.18)] scale-[1.02] ring-2 ring-white/20";
const pillBtnDisabled = "opacity-30 bg-black/20 border-white/10 text-white/50 cursor-not-allowed pointer-events-none";
const qtyBtn = "rounded-full flex items-center justify-center w-11 h-11 bg-black/40 text-white text-xl font-bold border border-white/15 transition-all duration-500 ease-out hover:bg-black/50 hover:border-white/30 focus:outline-none focus:bg-black/75 focus:border-white/40 focus:ring-2 focus:ring-white/20 disabled:opacity-30 disabled:pointer-events-none";
const badge = "inline-flex items-center px-3 py-1 border border-white/15 rounded-full font-semibold text-xs bg-black/40 text-white/90 backdrop-blur-sm";
const glassAccordion = "relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-white/8 via-black/25 to-black backdrop-blur-xl mb-2 shadow-[0_10px_45px_rgba(255,255,255,0.12)] transition-all duration-600 ease-out";
const glassAccordionInner = "absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_rgba(0,0,0,0.9)_55%)]";

// --- Luxury Button --- // (Matching Checkout Page Button Style with Shine Effect)
function LuxuryActionButton({ children, onClick, disabled, ariaLabel, tabIndex, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
        className={[
          "group w-full rounded-xl px-8 py-3 mt-0 mb-0 select-none",
          "border border-white/20",
          "bg-white/10 backdrop-blur-sm",
          "relative overflow-hidden",
          "uppercase font-semibold tracking-wide text-base leading-none",
          "text-white flex items-center justify-center",
          "shadow-[0_10px_45px_rgba(255,255,255,0.12)]",
          "transition-all duration-300 ease-in-out",
          "will-change-transform",
          focusRing,
          disabled
            ? "opacity-45 cursor-not-allowed"
            : "hover:bg-white/15 hover:border-white/30 hover:scale-[1.02] hover:shadow-[0_15px_60px_rgba(255,255,255,0.16)] hover:-translate-y-[2px] active:scale-100 active:translate-y-0"
        ].join(" ")}
        style={{
          letterSpacing: "0.05em",
          fontWeight: 600,
          borderWidth: "1px",
          color: "#ffffff",
          boxShadow: disabled
            ? "0_10px_45px_rgba(255,255,255,0.06)"
            : "0_10px_45px_rgba(255,255,255,0.12)",
          position: "relative",
          pointerEvents: disabled ? "none" : "auto",
          transition: "all 0.3s ease-in-out"
        }}
      {...props}
    >
      {/* Button text */}
      <span className="relative z-10 transition-all duration-300 ease-in-out">{children}</span>
      {/* Premium dark glass hover overlay - matching checkout button shine */}
      <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
        {/* Dark gradient background (charcoal → black) */}
        <span className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] rounded-xl"></span>
        {/* Inner highlight (top) */}
        <span className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-xl"></span>
        {/* Outer glow */}
        <span className="absolute inset-0 rounded-xl" style={{
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)'
        }}></span>
      </span>
    </button>
  );
}

// ---- Accordion Group Context for Only-One-Open UX ---- //
const AccordionGroupContext = createContext();

function AccordionGroup({ openKey, setOpenKey, children }) {
  return (
    <AccordionGroupContext.Provider value={{ openKey, setOpenKey }}>
      {children}
    </AccordionGroupContext.Provider>
  );
}

function useAccordionGroup() {
  return useContext(AccordionGroupContext);
}

function LuxuryAccordion({ title, children, defaultOpen, accordionKey }) {
  const contentRef = useRef(null);
  const innerContentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const group = useAccordionGroup();
  const isInGroup = !!group && typeof accordionKey === "string";
  const [localOpen, setLocalOpen] = useState(!!defaultOpen);
  const open = isInGroup
    ? group.openKey === accordionKey
    : localOpen;

  // Measure content height when it becomes visible
  useEffect(() => {
    if (open && innerContentRef.current) {
      // Measure after a brief delay to ensure content is rendered
      const measureHeight = () => {
        if (innerContentRef.current) {
          setContentHeight(innerContentRef.current.scrollHeight);
        }
      };
      // Use requestAnimationFrame for accurate measurement
      requestAnimationFrame(() => {
        requestAnimationFrame(measureHeight);
      });
    }
  }, [open, children]);

  // Measure on mount if defaultOpen
  useEffect(() => {
    if (defaultOpen && innerContentRef.current) {
      const timer = setTimeout(() => {
        if (innerContentRef.current) {
          setContentHeight(innerContentRef.current.scrollHeight);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [defaultOpen]);

  // Re-measure on window resize
  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      if (innerContentRef.current) {
        setContentHeight(innerContentRef.current.scrollHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (isInGroup) {
      if (open) {
        group.setOpenKey(null);
      } else {
        group.setOpenKey(accordionKey);
      }
    } else {
      setLocalOpen((v) => !v);
    }
  }, [isInGroup, open, group, accordionKey]);

  useEffect(() => {
    if (isInGroup && defaultOpen && !group.openKey) {
      group.setOpenKey(accordionKey);
    }
    // eslint-disable-next-line
  }, []);

  // Luxury easing curve - smooth, premium feel (Apple-like)
  const luxuryEasing = "cubic-bezier(0.4, 0.0, 0.2, 1)"; // Material Design's standard easing
  const animationDuration = "300ms"; // 300ms for luxury feel

  return (
    <div className={glassAccordion + " group"}>
      {/* Inner glow overlay */}
      <div className={glassAccordionInner}></div>
      <button
        onClick={handleToggle}
        className="relative z-10 w-full flex items-center justify-between px-6 py-5 text-left text-lg font-semibold tracking-wide text-white/90 rounded-2xl transition-all duration-300 ease-in-out hover:bg-white/5 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:scale-[1.01] active:scale-[0.99]"
        aria-expanded={open}
        type="button"
        tabIndex={0}
        style={{
          transition: `all ${animationDuration} ${luxuryEasing}`,
        }}
      >
        <span className="transition-all duration-300 ease-in-out">{title}</span>
        <svg 
          width={22} 
          height={22} 
          className="transition-transform duration-300 ease-in-out flex-shrink-0" 
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: `transform ${animationDuration} ${luxuryEasing}`,
          }}
          viewBox="0 0 22 22" 
          fill="none"
        >
          <path 
            d="M7 8l4 4 4-4" 
            stroke="#fff" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: open ? (contentHeight > 0 ? `${contentHeight}px` : "2000px") : "0px",
          transition: `max-height ${animationDuration} ${luxuryEasing}`,
          overflow: "hidden",
          willChange: "max-height",
        }}
        aria-hidden={!open}
      >
        <div 
          ref={innerContentRef}
          className="relative z-10 px-6 pb-6 pt-2 text-white/75 text-base leading-relaxed"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-8px)",
            transition: `opacity ${animationDuration} ${luxuryEasing}, transform ${animationDuration} ${luxuryEasing}`,
            willChange: "opacity, transform",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Back Button: Matching Coupons Page Style - Moved outside component to avoid render-time creation
function LuxuryBackButton({ fixed, isMobile }) {
  const router = useRouter();
  
  const handleBack = () => {
    // Check if there's history to go back to
    // Use document.referrer as a more reliable check for navigation history
    if (typeof window !== 'undefined' && (window.history.length > 1 || document.referrer)) {
      router.back();
    } else {
      // If no history, redirect to /products
      router.push('/products');
    }
  };

  // Always visible, z-50, never pointer-events-none
  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Back"
      className={[
        fixed ? "absolute" : "fixed",
        "z-50",
        isMobile
          ? "left-0 top-0 m-3 md:left-10 md:top-7"
          : "left-3 top-4 md:left-10 md:top-7",
        "flex items-center gap-2",
        "px-4 py-2 rounded-xl font-medium text-base",
        "text-white/90 bg-black/40 backdrop-blur-sm",
        "border border-white/15",
        "shadow-[0_10px_45px_rgba(255,255,255,0.12)]",
        "transition-all duration-300",
        "hover:bg-black/50 hover:border-white/25 hover:scale-[1.02] hover:shadow-[0_15px_60px_rgba(255,255,255,0.16)]",
        "cursor-pointer",
        focusRing,
      ].join(" ")}
      style={{ pointerEvents: 'auto' }}
    >
      <IconArrowLeft className="text-white/75 w-5 h-5 mr-0.5" />
      <span className="block pr-1 !text-base font-medium" style={{fontWeight: 500, letterSpacing: 0.01}}>Back</span>
    </button>
  );
}

// Main PDP
export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [mainImgIdx, setMainImgIdx] = useState(0);
  const [imgTransitioning, setImgTransitioning] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeTouched, setSizeTouched] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  const { addToCart, clearCart } = useCart();

  // Accordion group for product description
  const [openAccordionKey, setOpenAccordionKey] = useState(null);

  // Size guide modal state
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // SCROLL REFS FOR MOBILE FLOW
  const detailsRef = useRef(null);

  // Helper: is window "mobile"? (tailwind md = 768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Determine which size guide image to show based on product name
  const getSizeGuideImage = useMemo(() => {
    if (!product?.name) return "/images/sizechart1.jpeg";
    const name = product.name.toLowerCase();
    // Check for AmorFly Infinite Bloom - Royal Blue
    if (name.includes("amorfly") || name.includes("infinite bloom")) {
      return "/images/sizechart2.jpeg";
    }
    // Check for SOUL – Dual Rose Emblem Tee
    if (name.includes("soul") && name.includes("dual rose")) {
      return "/images/sizechart1.jpeg";
    }
    // Default to sizechart1
    return "/images/sizechart1.jpeg";
  }, [product?.name]);

  // Prevent body scroll when size guide modal is open and handle Escape key
  useEffect(() => {
    if (isSizeGuideOpen) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          setIsSizeGuideOpen(false);
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSizeGuideOpen]);

  // Product data fetch
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setLoading(true);
      setNotFound(false);
      setProduct(null);
    }, 0);
    if (!id) return;
    fetch("/api/products")
      .then((r) => r.json())
      .then((products) => {
        const found = products.find((p) => String(p._id) === String(id));
        if (found) setProduct(found);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  // Animation: image fade/scale in on thumbnail switch
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setImgTransitioning(true);
    }, 0);
    const t1 = setTimeout(() => setImgTransitioning(false), 400);
    return () => {
      clearTimeout(timer);
      clearTimeout(t1);
    };
  }, [mainImgIdx]);

  // Filter available sizes (stock > 0)
  const availableSizes = useMemo(() => {
    if (!product?.sizes) return [];
    return product.sizes.filter((sz) => sz.stock > 0);
  }, [product]);

  // Check if any sizes are available
  const hasAvailableSizes = availableSizes.length > 0;

  // Prevent manual selection of out-of-stock sizes
  useEffect(() => {
    if (!product?.sizes || !selectedSize) return;
    const selectedSizeObj = product.sizes.find((s) => s.size === selectedSize);
    if (selectedSizeObj && selectedSizeObj.stock <= 0) {
      setSelectedSize(null);
      setSizeTouched(false);
    }
  }, [product, selectedSize]);

  // Whenever selectedSize or product changes, reset quantity and reset add-to-cart state
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setQty(1);
      setIsAddedToCart(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedSize, product]);

  // Price and selection logic - use compareAtPrice from product
  const compareAtPrice = product?.compareAtPrice || null;
  
  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    if (compareAtPrice && compareAtPrice > product?.price) {
      return Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100);
    }
    return null;
  }, [compareAtPrice, product?.price]);

  const selectedSizeObj = product?.sizes?.find((s) => s.size === selectedSize);
  const maxQty = selectedSizeObj?.stock || 1;
  const isSizeValid = !!selectedSize && selectedSizeObj && selectedSizeObj.stock > 0;
  const canAddToCart = isSizeValid && maxQty > 0 && hasAvailableSizes;
  const canBuyNow = canAddToCart;

  // Core Cart Logic
  function handleAddToCart(e) {
    e?.preventDefault && e.preventDefault();
    setSizeTouched(true);
    if (!canAddToCart) return;
    addToCart(product, selectedSize, qty);
    setIsAddedToCart(true);
  }

  function handleBuyNow(e) {
    e?.preventDefault && e.preventDefault();
    setSizeTouched(true);
    if (!canBuyNow) return;
    if (typeof clearCart === 'function') {
      clearCart();
    } else if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("soulseam_cart");
    }
    addToCart(product, selectedSize, qty);
    router.push("/cart");
  }

  function handleViewCart(e) {
    e?.preventDefault && e.preventDefault();
    router.push("/cart");
  }

  // Skeleton Loader (Mobile-first image)
  if (loading) {
    return (
      <div className="relative w-full min-h-screen bg-black">
        {/* Top image loader */}
        <div className="relative w-full h-[75vh] md:hidden">
          <div className={"absolute inset-0 rounded-b-3xl " + shimmer}></div>
          <LuxuryBackButton fixed isMobile={isMobile} />
        </div>
        {/* Desktop: fallback desktop skeleton */}
        <div className="hidden md:flex items-center justify-center min-h-[60vh] w-full">
          <LuxuryBackButton isMobile={isMobile} />
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20 w-full max-w-6xl px-3">
            <div className={"aspect-[4/5] w-full max-w-lg rounded-3xl mb-4 " + shimmer}></div>
            <div className="w-full max-w-xl space-y-8">
              <div className={"h-14 w-1/2 rounded-2xl " + shimmer}></div>
              <div className={"h-8 w-1/3 rounded-xl " + shimmer}></div>
              <div className={"h-6 w-2/3 rounded-lg " + shimmer}></div>
              <div className={"h-28 w-full rounded-2xl " + shimmer}></div>
              <div className={"h-14 w-full rounded-full " + shimmer}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 404 Not found
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-black text-center">
        <LuxuryBackButton />
        <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_30px_rgba(255,255,255,0.18)] mb-5">Product not found</h1>
        <p className="text-white/40 text-lg max-w-lg">
          Sorry, we couldn&apos;t find that product. Please browse other styles from our premium catalogue.
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black">
        <LuxuryBackButton />
        <div className="text-white/50">Loading product...</div>
      </div>
    );
  }

  // --- PREMIUM PRODUCT PAGE ---
  const avgRating = product.rating || 4.8;
  // Keep this deterministic (no Math.random() during render)
  const numReviews =
    product.reviews ||
    (68 + ((String(product?._id || product?.id || "0").length * 7) % 20));

  // --- MOBILE-IMAGE-FIRST, LUXURY SCROLL-TO-DETAILS LAYOUT ---
  return (
    // eslint-disable-next-line
    <main className="relative w-full min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      {/* --- MOBILE PRODUCT IMAGE SECTION IN FLOW, 75vh, NOT FIXED, Back Btn overlays image --- */}
      <div className="md:hidden w-full relative group/image-container" style={{ minHeight: "75vh" }}>
        <div className="w-full h-[75vh] relative rounded-b-3xl overflow-hidden bg-black">
          {/* Mobile Back Button (absolute, overlays image) */}
          <LuxuryBackButton fixed isMobile={isMobile} />
          {/* Swiper for mobile image sliding */}
          <Swiper
            modules={[Pagination]}
            slidesPerView={1}
            spaceBetween={0}
            allowTouchMove={true}
            simulateTouch={true}
            grabCursor={true}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !bg-white/20 !border-white/20 !w-2.5 !h-2.5",
              bulletActiveClass: "!bg-white/90 !border-white/90 !scale-110",
            }}
            onSlideChange={(swiper) => {
              setMainImgIdx(swiper.activeIndex);
            }}
            initialSlide={mainImgIdx}
            className="w-full h-full rounded-b-3xl"
            style={{
              "--swiper-pagination-bottom": "2rem",
            }}
          >
            {product.images?.map((img, idx) => (
              <SwiperSlide key={img || idx}>
                <img
                  src={img || "/placeholder.png"}
                  alt={`${product.name} - Image ${idx + 1}`}
                  className="w-full h-full object-cover rounded-b-3xl select-none"
                  draggable={false}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </SwiperSlide>
            ))}
          </Swiper>
          {/* SocialProof Overlay - Mobile */}
          <div className="absolute bottom-6 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
            <SocialProof />
          </div>
        </div>
      </div>

      {/* --- MOBILE DETAILS SECTION --- */}
      <div
        ref={detailsRef}
        className={[
          "md:hidden",
          "relative z-40",
          "w-full",
          "pt-7 pb-16 px-3",
          "bg-gradient-to-b from-white/8 via-black/25 to-black",
          "backdrop-blur-2xl",
          "rounded-t-3xl",
          "border border-white/12",
          "shadow-[0_18px_70px_rgba(255,255,255,0.14)]",
          "transition-all duration-600 ease-out",
          "premium-summary-hover",
        ].join(" ")}
        style={{
          minHeight: "100vh",
          marginTop: "-24px"
        }}
      >
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.14)_0%,_rgba(0,0,0,0.92)_55%)] rounded-t-3xl"></div>
        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Headline + Price */}
          <div className="text-center mb-4">
            <h1 className="font-extrabold text-[2.2rem] leading-tight text-white mb-3 tracking-tight mt-3 drop-shadow-[0_1px_16px_rgba(255,255,255,0.09)]" style={{fontFamily: "'Neue Haas Grotesk Display', 'Inter', 'system-ui', serif"}}>
              {product.name}
            </h1>
            <div className="flex flex-row items-center justify-center gap-3 mb-2">
              <span className="text-white text-2xl font-black">{formatPrice(product.price)}</span>
              {compareAtPrice && compareAtPrice > product.price && (
                <span className="text-white/35 line-through text-lg font-normal">{formatPrice(compareAtPrice)}</span>
              )}
            </div>
            {discountPercentage && (
              <div className="flex items-center justify-center mb-2">
                <span className="text-emerald-400 font-bold text-sm">
                  {discountPercentage}% OFF
                </span>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className={badge}>
                {product.totalStock > 0 ? <><IconCheck/> In Stock</> : "Sold Out"}
              </span>
            </div>
            {/* Rating */}
            <div className="flex items-center gap-1 justify-center mb-5">
              {[1,2,3,4,5].map(star => (
                <IconStar key={star} filled={avgRating >= star - 0.3}/>
              ))}
              <span className="text-white/80 font-semibold text-base ml-2">{avgRating.toFixed(1)}</span>
              <span className="text-white/50 text-xs ml-2">{numReviews} reviews</span>
            </div>
          </div>
          {/* Size selector */}
          <div className="my-4">
            <div className="font-semibold text-white/80 text-lg mb-3 text-center">Select Size</div>
            {hasAvailableSizes ? (
              <>
                <div className="flex flex-wrap gap-2 mb-1 justify-center">
                  {availableSizes.map((sz) => {
                    const isSelected = selectedSize === sz.size;
                    return (
                      <button
                        key={sz.size}
                        className={[
                          pillBtn,
                          isSelected ? pillBtnSelected : ""
                        ].join(" ")}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz.size);
                          setSizeTouched(true);
                        }}
                        aria-pressed={isSelected}
                        style={{
                          cursor: "pointer"
                        }}
                      >
                        {sz.size}
                      </button>
                    );
                  })}
                </div>
                {!isSizeValid && sizeTouched && (
                  <div className="mt-1 text-xs text-red-400 font-medium text-center">
                    Please select a valid size before continuing.
                  </div>
                )}
                <div className="mt-1 text-xs text-white/35 text-center">
                  View <span 
                    className="underline hover:text-white/65 cursor-pointer"
                    onClick={() => setIsSizeGuideOpen(true)}
                  >Size Guide</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-red-400 font-semibold text-lg mb-2">Out of Stock</div>
                <div className="text-white/50 text-sm">This product is currently unavailable in all sizes.</div>
              </div>
            )}
          </div>
          {/* Quantity Selector */}
          <div className="flex items-center gap-4 justify-center mt-4 mb-4">
            <span className="font-medium text-white/85 text-lg">Quantity</span>
            <button
              type="button"
              className={qtyBtn}
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              style={{ cursor: qty <= 1 ? "not-allowed" : "pointer" }}
            >
              –
            </button>
            <span className="font-bold text-xl text-center select-none text-white/90 min-w-[32px]">{qty}</span>
            <button
              type="button"
              className={qtyBtn}
              disabled={!isSizeValid || qty >= maxQty}
              onClick={() => setQty((q) => Math.min(q + 1, maxQty))}
              aria-label="Increase quantity"
              style={{ cursor: !isSizeValid || qty >= maxQty ? "not-allowed" : "pointer" }}
            >
              +
            </button>
            {maxQty > 1 &&
              <span className="ml-2 text-xs text-white/40 font-medium">(max {maxQty})</span>
            }
          </div>
          {/* CTA Buttons: Buy Now & View Cart (twin premium) */}
          <div className="flex flex-col gap-3 mt-4 mb-4">
            <LuxuryActionButton
              onClick={handleBuyNow}
              disabled={!canBuyNow}
              ariaLabel="Buy Now"
              tabIndex={0}
            >
              {!hasAvailableSizes
                ? "Out of Stock"
                : maxQty === 0
                ? "Sold Out"
                : !isSizeValid
                ? "Select Size First"
                : "Buy Now"}
            </LuxuryActionButton>
            <LuxuryActionButton
              onClick={isAddedToCart ? handleViewCart : handleAddToCart}
              disabled={!canAddToCart}
              ariaLabel={isAddedToCart ? "View Cart" : "Add to Cart"}
              tabIndex={0}
            >
              {!hasAvailableSizes
                ? "Out of Stock"
                : maxQty === 0
                ? "Out of Stock"
                : !isSizeValid
                ? "Select Size"
                : isAddedToCart
                ? "View Cart"
                : "Add to Cart"}
            </LuxuryActionButton>
            {/* Trust markers */}
            <div className="mt-4 flex flex-wrap gap-2 items-center justify-center text-white/75 text-[1rem]">
              <span className={badge}><IconLock/> Secure Checkout</span>
            </div>
          </div>
          {/* Product Description - moved after CTAs and badges for mobile */}
          <div className="my-3 mx-0 mt-6">
            <AccordionGroup openKey={openAccordionKey} setOpenKey={setOpenAccordionKey}>
              <LuxuryAccordion title="Product Description" accordionKey="philosophy">
                <div className="text-white/70 text-[1rem] leading-loose font-light tracking-normal pt-0">
                  {product.description ? (
                    <div 
                      className="product-description"
                      dangerouslySetInnerHTML={{ __html: formatDescription(product.description) }}
                    />
                  ) : (
                    <p className="text-white/45 text-base font-extralight leading-relaxed">
                      No description available
                    </p>
                  )}
                </div>
              </LuxuryAccordion>
            </AccordionGroup>
          </div>
          {/* Key Highlights, Fabric, Fit, Delivery */}
          <div className="flex flex-col gap-2 min-w-[260px] mt-6 mb-2">
            <AccordionGroup openKey={openAccordionKey} setOpenKey={setOpenAccordionKey}>
              <LuxuryAccordion title="Key Highlights" defaultOpen accordionKey="highlights">
                <ul className="list-none pl-0 text-white/85 text-base">
                  <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                    <span className="inline-block mr-2 text-lg text-white/80"><IconCheck/></span>
                    Hand-embroidered infinity symbol detailing
                  </li>
                  <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                    <span className="inline-block mr-2 text-lg text-white/80"><IconCheck /></span>
                    100% GOTS-certified organic cotton
                  </li>
                  <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                    <span className="inline-block mr-2 text-lg text-white/80"><IconCheck /></span>
                    Naturally breathable and soft touch
                  </li>
                  <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                    <span className="inline-block mr-2 text-lg text-white/80"><IconCheck /></span>
                    Timeless modern silhouette fit
                  </li>
                </ul>
              </LuxuryAccordion>
              <LuxuryAccordion title="Fabric & Care" accordionKey="fabric">
                <div>
                  <div className="mb-1">Fabric: 100% long-staple organic cotton, pre-shrunk</div>
                  <div className="mb-0.5">Weight: 260gsm | Handfeel: Dense, powdery-soft</div>
                  <div className="mt-2">
                    <span className="text-white/90 font-medium mr-1">Care:</span>
                    Machine wash cold, dry flat. No tumble dry. Steam press only on reverse.
                  </div>
                </div>
              </LuxuryAccordion>
              <LuxuryAccordion title="Fit Guide" accordionKey="fit">
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSizeGuideOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-300 text-sm font-medium"
                  >
                    View Size Guide →
                  </button>
                </div>
              </LuxuryAccordion>
              <LuxuryAccordion title="Delivery & Returns" accordionKey="delivery">
                <div>
                  <span className="font-semibold text-amber-300/90">3-day exchange only. No returns.</span>
                </div>
              </LuxuryAccordion>
            </AccordionGroup>
          </div>
        </div>
      </div>

      {/* DESKTOP-only Original Layout (unchanged, md:) */}
      <div className="hidden md:flex min-h-[calc(100vh-80px)] w-full md:py-12 md:flex-row md:items-stretch md:px-0">
        {/* BG luxury vizual - REMOVED LIGHT GRADIENTS */}
        <LuxuryBackButton />
        {/* PRODUCT IMAGE (LEFT) */}
        <section className="relative z-10 flex-1 flex justify-end items-stretch max-w-[56vw]">
          <div className={"relative h-full w-full flex flex-col justify-center items-center"} style={{minWidth: 0}}>
            <div className={
              [
                "group relative aspect-[4/5] w-full max-w-[540px] rounded-3xl mb-6 " + glassCard,
                hoverGlow,
                imgTransitioning ? "opacity-70 scale-98" : "opacity-100 scale-100"
              ].join(" ")
            }
            >
              {/* Inner glow overlay */}
              <div className={glassCardInner}></div>
              <img
                src={product.images[mainImgIdx] || "/placeholder.png"}
                alt={product.name}
                key={product.images[mainImgIdx] || "/placeholder.png"}
                className={
                  "relative z-10 object-cover w-full h-full select-none rounded-3xl " +
                  "transition-all duration-600 ease-out will-change-transform border border-white/15 " +
                  "group-hover:scale-105 group-hover:brightness-110 group-hover:shadow-[0_6px_24px_rgba(255,255,255,0.18)]"
                }
                style={{
                  opacity: imgTransitioning ? 0.88 : 1,
                  filter: "brightness(1.05)",
                  transform: "scale(1)",
                  pointerEvents: "none",
                  borderRadius: "1.5rem",
                  transition: "transform .62s cubic-bezier(.42,0,.28,1), box-shadow .59s cubic-bezier(.42,0,.28,1)"
                }}
                draggable={false}
              />
              {/* Subtle light sweep reflection on hover */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              {/* SocialProof Overlay - Desktop */}
              <div className="absolute bottom-8 left-0 right-0 z-30 px-6 flex justify-center pointer-events-none">
                <SocialProof />
              </div>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-4 mt-1 z-20">
              {product.images?.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => setMainImgIdx(idx)}
                  className={
                    [
                      "overflow-hidden group", focusRing,
                      "rounded-2xl w-16 h-16 flex items-center justify-center ring-0 border-2 transition-all duration-600 ease-out",
                      "bg-black/40 backdrop-blur-sm will-change-transform",
                      idx === mainImgIdx
                        ? "border-white/30 scale-110 shadow-[0_0_20px_rgba(255,255,255,0.18)] ring-2 ring-white/20"
                        : "border-white/15 scale-95 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_6px_24px_rgba(255,255,255,0.15)] hover:scale-100"
                    ].join(" ")
                  }
                  aria-label={`Show product image ${idx + 1}`}
                >
                  <img
                    src={img || "/placeholder.png"}
                    alt={`Thumbnail ${idx + 1}`}
                    className="object-cover w-full h-full select-none rounded-xl transition-all duration-350"
                    style={{
                      opacity: idx === mainImgIdx ? 1 : 0.77,
                      filter: idx === mainImgIdx
                        ? "drop-shadow(0_0_24px_rgba(255,255,255,0.10))"
                        : "grayscale(36%)",
                      pointerEvents: "none",
                    }}
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCT INFO (RIGHT) */}
        <section className="relative flex-[1.15] flex flex-col px-4 md:px-12 pt-7 md:pt-12 justify-between z-10 min-w-[340px]">
          <div className={"group w-full max-w-2xl mx-auto rounded-3xl px-6 py-8 mb-5 " + glassCard}>
            {/* Inner glow overlay */}
            <div className={glassCardInner}></div>
            <div className="relative z-10 text-center mb-6">
              <h1 className="font-extrabold text-[2.7rem] leading-[1.1] md:text-[3.2rem] text-white mb-4 tracking-tight drop-shadow-[0_1px_36px_rgba(255,255,255,0.15)]" style={{fontFamily: "'Neue Haas Grotesk Display', 'Inter', 'system-ui', serif"}}>
                {product.name}
              </h1>
              <div className="flex flex-row items-center justify-center gap-3 mb-3">
                <span className="text-white text-2xl md:text-3xl font-black">{formatPrice(product.price)}</span>
                {compareAtPrice && compareAtPrice > product.price && (
                  <span className="text-white/35 line-through text-lg font-normal">
                    {formatPrice(compareAtPrice)}
                  </span>
                )}
              </div>
              {discountPercentage && (
                <div className="flex items-center justify-center mb-3">
                  <span className="text-emerald-400 font-bold text-base">
                    {discountPercentage}% OFF
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className={badge}>
                  {product.totalStock > 0 ? <><IconCheck/> In Stock</> : "Sold Out"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-white text-lg font-medium flex items-center">
                  {[1,2,3,4,5].map(star => (
                    <IconStar key={star} filled={avgRating >= star - 0.3}/>
                  ))}
                  <span className="text-white/80 font-semibold text-base ml-2">{avgRating.toFixed(1)}</span>
                </span>
                <span className="text-white/40 text-sm ml-3">{numReviews} reviews</span>
              </div>
            </div>
            <div className="relative z-10 my-4 mx-0 max-w-2xl">
              <AccordionGroup openKey={openAccordionKey} setOpenKey={setOpenAccordionKey}>
                <LuxuryAccordion title="Product Description" accordionKey="philosophy">
                  <div className="text-white/65 text-base leading-loose font-light tracking-normal pt-0">
                    {product.description ? (
                      <div 
                        className="product-description"
                        dangerouslySetInnerHTML={{ __html: formatDescription(product.description) }}
                      />
                    ) : (
                      <p className="text-white/45 text-base font-extralight leading-relaxed">
                        No description available
                      </p>
                    )}
                  </div>
                </LuxuryAccordion>
              </AccordionGroup>
            </div>
          </div>
          <div className="w-full max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6 w-full">
              <div>
                <div className="font-semibold text-white/80 text-lg mb-3 text-center">Select Size</div>
                {hasAvailableSizes ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-1 justify-center">
                      {availableSizes.map((sz) => {
                        const isSelected = selectedSize === sz.size;
                        return (
                          <button
                            key={sz.size}
                            className={[
                              pillBtn,
                              isSelected ? pillBtnSelected : ""
                            ].join(" ")}
                            type="button"
                            onClick={() => {
                              setSelectedSize(sz.size);
                              setSizeTouched(true);
                            }}
                            aria-pressed={isSelected}
                            style={{
                              cursor: "pointer"
                            }}
                          >
                            {sz.size}
                          </button>
                        );
                      })}
                    </div>
                    {!isSizeValid && sizeTouched && (
                      <div className="mt-1 text-xs text-red-400 font-medium">
                        Please select a valid size before continuing.
                      </div>
                    )}
                    <div className="mt-1 text-xs text-white/35 text-center">
                      View <span 
                        className="underline hover:text-white/65 cursor-pointer"
                        onClick={() => setIsSizeGuideOpen(true)}
                      >Size Guide</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-red-400 font-semibold text-lg mb-2">Out of Stock</div>
                    <div className="text-white/50 text-sm">This product is currently unavailable in all sizes.</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 justify-center">
                <span className="font-medium text-white/85 text-lg">Quantity</span>
                <button
                  type="button"
                  className={qtyBtn}
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  style={{ cursor: qty <= 1 ? "not-allowed" : "pointer" }}
                >
                  –
                </button>
                <span className="font-bold text-xl text-center select-none text-white/90 min-w-[32px]">{qty}</span>
                <button
                  type="button"
                  className={qtyBtn}
                  disabled={!isSizeValid || qty >= maxQty}
                  onClick={() => setQty((q) => Math.min(q + 1, maxQty))}
                  aria-label="Increase quantity"
                  style={{ cursor: !isSizeValid || qty >= maxQty ? "not-allowed" : "pointer" }}
                >
                  +
                </button>
                {maxQty > 1 &&
                  <span className="ml-2 text-xs text-white/40 font-medium">(max {maxQty})</span>
                }
              </div>
              {/* Twin luxury action buttons */}
              <div className="flex flex-col gap-3 mt-2">
                <LuxuryActionButton
                  onClick={handleBuyNow}
                  disabled={!canBuyNow}
                  ariaLabel="Buy Now"
                  tabIndex={0}
                >
                  {!hasAvailableSizes
                    ? "Out of Stock"
                    : maxQty === 0
                    ? "Sold Out"
                    : !isSizeValid
                    ? "Select Size First"
                    : "Buy Now"}
                </LuxuryActionButton>
                <LuxuryActionButton
                  onClick={isAddedToCart ? handleViewCart : handleAddToCart}
                  disabled={!canAddToCart}
                  ariaLabel={isAddedToCart ? "View Cart" : "Add to Cart"}
                  tabIndex={0}
                >
                  {!hasAvailableSizes
                    ? "Out of Stock"
                    : maxQty === 0
                    ? "Out of Stock"
                    : !isSizeValid
                    ? "Select Size"
                    : isAddedToCart
                    ? "View Cart"
                    : "Add to Cart"}
                </LuxuryActionButton>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex flex-wrap gap-3 items-center justify-center text-white/75 text-[1rem]">
                  <span className={badge}><IconLock/> Secure Checkout</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[260px]">
              <AccordionGroup openKey={openAccordionKey} setOpenKey={setOpenAccordionKey}>
                <LuxuryAccordion title="Key Highlights" defaultOpen accordionKey="highlights">
                  <ul className="list-none pl-0 text-white/85 text-base">
                    <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                      <span className="inline-block mr-2 text-lg text-white/80"><IconCheck/></span>
                      Hand-finished Italian seams
                    </li>
                    <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                      <span className="inline-block mr-2 text-lg text-white/80"><IconCheck /></span>
                      100% GOTS-certified organic cotton
                    </li>
                    <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                      <span className="inline-block mr-2 text-lg text-white/80"><IconCheck /></span>
                      Naturally breathable and soft touch
                    </li>
                    <li className="mb-1 pb-1 border-b border-white/10 flex items-center">
                      <span className="inline-block mr-2 text-lg text-white/80"><IconCheck /></span>
                      Timeless modern silhouette fit
                    </li>
                  </ul>
                </LuxuryAccordion>
                <LuxuryAccordion title="Fabric & Care" accordionKey="fabric">
                  <div>
                    <div className="mb-1">Fabric: 100% long-staple organic cotton, pre-shrunk</div>
                    <div className="mb-0.5">Weight: 260gsm | Handfeel: Dense, powdery-soft</div>
                    <div className="mt-2">
                      <span className="text-white/90 font-medium mr-1">Care:</span>
                      Machine wash cold, dry flat. No tumble dry. Steam press only on reverse.
                    </div>
                  </div>
                </LuxuryAccordion>
                <LuxuryAccordion title="Fit Guide" accordionKey="fit">
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSizeGuideOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-white/90 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all duration-300 text-sm font-medium"
                    >
                      View Size Guide →
                    </button>
                  </div>
                </LuxuryAccordion>
                <LuxuryAccordion title="Delivery & Returns" accordionKey="delivery">
                  <div>
                    <strong className="block mb-1 text-white/85">Express delivery: Next business day.</strong>
                    <span className="font-semibold text-amber-300/90">3-day exchange only. No returns.</span>
                  </div>
                </LuxuryAccordion>
              </AccordionGroup>
            </div>
          </div>
        </section>
      </div>

      {/* Customer Reviews Section */}
      <ReviewSection productId={id} />

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[95vh] w-full bg-black/90 rounded-3xl border border-white/20 shadow-[0_20px_80px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Size Guide</h2>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="p-2 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 hover:border-white/40 transition-all duration-300"
                aria-label="Close size guide"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Image container */}
            <div className="relative w-full flex-1 overflow-auto">
              <img
                src={getSizeGuideImage}
                alt="Size Guide"
                className="w-full h-auto object-contain"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for checkout-style hover effects */}
      <style jsx global>{`
        /* Premium summary hover effect - matching checkout page */
        .premium-summary-hover {
          position: relative;
          will-change: transform, box-shadow, border-color;
          transition: box-shadow .44s cubic-bezier(.4,0,.2,1), transform .43s cubic-bezier(.4,0,.2,1), border-color .44s cubic-bezier(.4,0,.2,1);
        }
        .premium-summary-hover:hover {
          border-color: #fff !important;
          box-shadow: 0 18px 72px 0 rgba(255,255,255,0.18),0 0 0 2.4px rgba(255,255,255,0.11);
          transform: translateY(-4px) scale(1.018);
        }
        .premium-summary-hover:after {
          content: '';
          pointer-events: none;
          position: absolute; left: 0; top: 0; width: 100%; height: 100%;
          border-radius: 1.35rem;
          z-index: 2;
          box-shadow: 0 0 0 2.5px rgba(255,255,255,0.13);
          opacity: 0;
          transition: opacity .62s cubic-bezier(.4,0,.2,1);
        }
        .premium-summary-hover:hover:after {
          opacity: 1;
        }
        /* Group hover effect for cards */
        .group:after {
          content: "";
          border-radius: 16px;
          pointer-events: none;
          position: absolute;
          z-index: 2;
          left: 0; top: 0; width: 100%; height: 100%;
          box-shadow: 0 0 0 2.5px rgba(255,255,255,0.10);
          opacity: 0;
          transition: opacity .62s cubic-bezier(.4,0,.2,1);
        }
        .group:hover:after {
          opacity: 1;
        }
        /* Swiper customizations */
        .swiper {
          width: 100%;
          height: 100%;
        }
        .swiper-slide {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .swiper-pagination {
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }
        .swiper-pagination-bullet {
          width: 0.375rem;
          height: 0.375rem;
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.3);
          opacity: 1;
          margin: 0 0.25rem;
          transition: all 0.2s ease;
        }
        .swiper-pagination-bullet-active {
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(255, 255, 255, 0.8);
          transform: scale(1.1);
        }
        /* Ensure no layout shift */
        .swiper-wrapper {
          display: flex;
          align-items: stretch;
        }
        .swiper-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      `}</style>
    </main>
  );
}