"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/app/CartContext";
import { createContext, useContext } from "react";

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


// Glassmorphism + luxury inspired classes
const glassCard = "backdrop-blur-md bg-gradient-to-br from-white/5 via-white/3 to-white/0 border border-white/10 rounded-3xl shadow-[0_6px_60px_0_rgba(29,29,36,0.35)]";
const hoverGlow = "hover:shadow-[0_0_32px_7px_rgba(255,255,255,0.13)] transition-shadow duration-400 ease-[cubic-bezier(.68,.01,.49,.97)]";
const focusRing = "focus:outline-none focus:ring-2 focus:ring-white/30";
const mainSpotGradient = "before:content-[''] before:absolute before:inset-0 before:bg-gradient-radial before:from-white/5 before:to-transparent before:z-10";
const shimmer = "animate-pulse bg-gradient-to-br from-[#191921] to-black/80";
const fadeAnim = "transition-all duration-500 ease-[cubic-bezier(.68,.01,.49,.97)]";
const pillBtn = "min-w-14 px-7 py-3 rounded-2xl text-lg font-semibold border border-white/25 bg-gradient-to-br from-white/5 via-black/40 to-black/15 text-white/90 transition-all duration-300 ease-in-out shadow-lg hover:scale-105 hover:shadow-[0_0_14px_3px_rgba(255,255,255,0.16)] focus:outline-none";
const pillBtnSelected = "border-white/70 bg-white/10 text-white shadow-[0_0_26px_2px_rgba(255,255,255,0.18)] scale-105";
const pillBtnDisabled = "opacity-30 bg-gradient-to-br from-black/20 via-black/30 to-black/10 border-white/10 text-white/50 cursor-not-allowed pointer-events-none";
const qtyBtn = "rounded-full flex items-center justify-center w-11 h-11 bg-black/70 text-white text-xl font-bold border border-white/20 hover:bg-white/5 hover:scale-[1.09] hover:shadow-[0_0_12px_1.7px_rgba(255,255,255,0.15)] transition-all duration-200 focus:outline-none disabled:opacity-30 disabled:pointer-events-none";
const badge = "inline-flex items-center px-3 py-1 border border-white/25 rounded-full font-semibold text-xs bg-gradient-to-r from-white/10 to-black/20 text-white/80";
const glassAccordion = "rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/8 via-white/2 to-white/0 backdrop-blur-md mb-2";

// --- Luxury Button --- //
function LuxuryActionButton({ children, onClick, disabled, ariaLabel, tabIndex, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      className={[
        "group w-full rounded-full px-8 py-4 mt-0 mb-0 select-none",
        "border border-[rgba(242,242,242,0.23)]",
        "bg-gradient-to-br from-[#26272B] via-[#131416] to-[#18191B]",
        "relative overflow-hidden",
        "uppercase font-extrabold tracking-[0.18em] text-[1.14rem] leading-none",
        "text-[#F2F2F2] flex items-center justify-center",
        "shadow-[0_0_32px_0_rgba(242,242,242,0.10),0_2px_20px_0_rgba(255,255,255,0.09)]",
        "transition-all duration-400 ease-[cubic-bezier(.60,.01,.37,1)]",
        "will-change-transform will-change-shadow will-change-bg",
        "backdrop-blur-sm border-[1.5px]",
        focusRing,
        disabled
          ? "opacity-45 cursor-not-allowed"
          : "hover:scale-[1.035] hover:shadow-[0_0_64px_4px_rgba(242,242,242,0.14),0_2px_28px_0_rgba(255,255,255,0.14)] hover:bg-gradient-to-br hover:from-[#35363c] hover:to-[#212226] active:scale-100"
      ].join(" ")}
      style={{
        letterSpacing: "0.16em",
        fontWeight: 770,
        borderWidth: "1.5px",
        borderColor: "rgba(242,242,242,0.23)",
        color: "#F2F2F2",
        boxShadow: disabled
          ? "0 2px 12px 0 rgba(242,242,242,0.02)"
          : "0 0 30px 0 rgba(242,242,242,0.09), 0 2px 24px 0 rgba(255,255,255,0.09)",
        background: "linear-gradient(111deg, #26272B 6%, #131416 120%)",
        // Glass/metal sheen overlay
        position: "relative",
        pointerEvents: disabled ? "none" : "auto",
        transition: "box-shadow 0.65s cubic-bezier(.68,0,.41,1), background 0.65s cubic-bezier(.68,0,.41,1), transform 0.39s cubic-bezier(.73,.01,.37,1), color 0.38s cubic-bezier(.64,0,.36,1)"
      }}
      {...props}
    >
      {/* Silver sheen overlay (top left sweep) */}
      <span
        className="pointer-events-none absolute left-0 top-0 w-full h-full rounded-full opacity-60"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(55deg, rgba(255,255,255,0.11) 8%, rgba(232,232,232,0.10) 28%,rgba(180,180,203,0.07) 44%, rgba(255,255,255,0.00) 77%)",
          mixBlendMode: "screen"
        }}
      />
      {/* faint glass reflection highlight: gentle oval sweep */}
      <span
        className="pointer-events-none absolute left-0 top-0 w-full h-full rounded-full opacity-20"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse at 50% 7%, rgba(242,242,255,0.42) 3%, rgba(242,242,242,0.05) 60%, rgba(180,180,203,0.01) 100%)"
        }}
      />
      {/* Button text */}
      <span className="relative z-10">{children}</span>
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
  const group = useAccordionGroup();
  const isInGroup = !!group && typeof accordionKey === "string";
  const [localOpen, setLocalOpen] = useState(!!defaultOpen);
  const open = isInGroup
    ? group.openKey === accordionKey
    : localOpen;

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

  return (
    <div className={glassAccordion}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left text-lg font-semibold tracking-wide text-white/90 hover:bg-white/5 transition-colors duration-200"
        aria-expanded={open}
        type="button"
        tabIndex={0}
      >
        <span>{title}</span>
        <svg width={22} height={22} className={"transition-transform duration-300 " + (open ? "rotate-90" : "rotate-0")} viewBox="0 0 22 22" fill="none"><path d="M7 8l4 4 4-4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div
        ref={contentRef}
        style={{
          maxHeight: open
            ? 9999
            : 0,
          transition: "max-height 340ms cubic-bezier(0.75,0,0.38,1)",
          overflow: "hidden",
        }}
        aria-hidden={!open}
      >
        <div className="px-6 pb-6 pt-2 text-white/75 text-base leading-relaxed">{children}</div>
      </div>
    </div>
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

  // Product data fetch
  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setProduct(null);
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
    setImgTransitioning(true);
    const t1 = setTimeout(() => setImgTransitioning(false), 400);
    return () => clearTimeout(t1);
  }, [mainImgIdx]);

  // Whenever selectedSize or product changes, reset quantity and reset add-to-cart state
  useEffect(() => {
    setQty(1);
    setIsAddedToCart(false);
  }, [selectedSize, product]);

  // Price and selection logic
  const originalPrice = useMemo(
    () => (product && product.price ? Math.round(product.price * 1.2) : null),
    [product]
  );

  const selectedSizeObj = product?.sizes?.find((s) => s.size === selectedSize);
  const maxQty = selectedSizeObj?.stock || 1;
  const isSizeValid = !!selectedSize && selectedSizeObj && selectedSizeObj.stock > 0;
  const canAddToCart = isSizeValid && maxQty > 0;
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

  // Back Button: Minimal mobile, richer on desktop
  function LuxuryBackButton({fixed}) {
    // Always visible, z-50, never pointer-events-none
    return (
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        className={[
          fixed ? "absolute" : "fixed",
          "z-50",
          isMobile
            ? "left-0 top-0 m-3 md:left-10 md:top-7"
            : "left-3 top-4 md:left-10 md:top-7",
          "flex items-center gap-2",
          "px-4 py-2 rounded-full font-medium text-base",
          "text-white/85 bg-gradient-to-br from-white/10 via-black/40 to-black/10",
          "border border-white/15",
          "shadow-[0_4px_32px_0_rgba(255,255,255,0.07)]",
          "backdrop-blur-md",
          "transition-all duration-200",
          "hover:bg-white/7 hover:shadow-[0_0_16px_3px_rgba(255,255,255,0.14)]",
          focusRing,
        ].join(" ")}
        style={{
          WebkitBackdropFilter: 'blur(15px)',
          backdropFilter: 'blur(15px)',
          boxShadow: "0 2px 24px 0 rgba(255,255,255,0.07), 0 0 0 3px rgba(255,255,255,0.10)"
        }}
      >
        <IconArrowLeft className="text-white/75 w-5 h-5 mr-0.5" />
        <span className="block pr-1 !text-base font-medium" style={{fontWeight: 500, letterSpacing: 0.01}}>Back</span>
      </button>
    );
  }

  // Skeleton Loader (Mobile-first image)
  if (loading) {
    return (
      <div className="relative w-full min-h-screen bg-gradient-to-b from-black via-[#18181c] to-[#151214]">
        {/* Top image loader */}
        <div className="relative w-full h-[75vh] md:hidden">
          <div className={"absolute inset-0 rounded-b-3xl " + shimmer}></div>
          <LuxuryBackButton fixed />
        </div>
        {/* Desktop: fallback desktop skeleton */}
        <div className="hidden md:flex items-center justify-center min-h-[60vh] w-full">
          <LuxuryBackButton />
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-black via-zinc-900 to-black text-center">
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
    <main className="relative w-full min-h-screen bg-gradient-to-b from-black via-[#18181c] to-[#151214]">
      {/* --- MOBILE PRODUCT IMAGE SECTION IN FLOW, 75vh, NOT FIXED, Back Btn overlays image --- */}
      <div className="md:hidden w-full relative" style={{ minHeight: "75vh" }}>
        <div className="w-full h-[75vh] relative rounded-b-3xl overflow-hidden">
          <img
            src={product.images[mainImgIdx] || "/placeholder.png"}
            alt={product.name}
            key={product.images[mainImgIdx] || "/placeholder.png"}
            className="absolute inset-0 w-full h-full object-cover rounded-b-3xl select-none transition-transform duration-700"
            style={{
              opacity: imgTransitioning ? 0.88 : 1,
              filter: "brightness(1.09) saturate(1.02)",
              transition: "opacity 610ms cubic-bezier(.68,.01,.49,.95), filter 500ms, transform 550ms"
            }}
            draggable={false}
          />
          {/* Subtle bottom fade for premium transition */}
          <div className="absolute bottom-0 left-0 right-0 h-32 z-10"
            style={{
              background: "linear-gradient(180deg,rgba(0,0,0,0.0) 40%,rgba(18,15,20,0.46) 90%,rgba(17,13,21,0.98) 100%)"
            }}
          />
          {/* Mobile Back Button (absolute, overlays image) */}
          <LuxuryBackButton fixed />
          {/* Thumbnails: indicator dots on mobile */}
          <div className="absolute bottom-8 left-1/2 z-20 flex gap-1 -translate-x-1/2">
            {product.images?.map((img, idx) => (
              <button
                key={img}
                onClick={() => setMainImgIdx(idx)}
                className={[
                  "w-2.5 h-2.5 rounded-full border transition-all duration-200",
                  idx === mainImgIdx
                    ? "bg-white/90 border-white/90 scale-110 shadow"
                    : "bg-white/20 border-white/20"
                ].join(' ')}
                style={{ cursor: "pointer" }}
                aria-label={`Show image ${idx + 1}`}
              />
            ))}
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
          "bg-gradient-to-b from-black/83 via-[#221f24]/88 to-[#19161a]/90",
          "rounded-t-3xl ",
          "backdrop-blur-[8px]",
          "shadow-[0_-4px_28px_0_rgba(20,17,24,0.16)]",
          "transition-all duration-700",
          glassCard,
        ].join(" ")}
        style={{
          minHeight: "100vh",
          boxShadow: "0 -5px 27px 0 rgba(40,30,54,0.22)",
          marginTop: "-24px"
        }}
      >
        <div className="w-full max-w-lg mx-auto">
          {/* Headline + Price */}
          <div className="text-center mb-4">
            <h1 className="font-extrabold text-[2.2rem] leading-tight text-white mb-3 tracking-tight mt-3 drop-shadow-[0_1px_16px_rgba(255,255,255,0.09)]" style={{fontFamily: "'Neue Haas Grotesk Display', 'Inter', 'system-ui', serif"}}>
              {product.name}
            </h1>
            <div className="flex flex-row items-center justify-center gap-3 mb-2">
              <span className="text-white text-2xl font-black">{formatPrice(product.price)}</span>
              {originalPrice > product.price && (
                <span className="text-white/35 line-through text-lg font-normal">{formatPrice(originalPrice)}</span>
              )}
            </div>
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
            <div className="flex flex-wrap gap-2 mb-1 justify-center">
              {product.sizes.map((sz) => {
                const isDisabled = !sz.stock;
                const isSelected = selectedSize === sz.size;
                return (
                  <button
                    key={sz.size}
                    className={[
                      pillBtn,
                      isSelected ? pillBtnSelected : "",
                      isDisabled ? pillBtnDisabled : ""
                    ].join(" ")}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      setSelectedSize(sz.size);
                      setSizeTouched(true);
                    }}
                    aria-pressed={isSelected}
                    style={{
                      boxShadow: isSelected
                          ? "0 0 0 3px rgba(255,255,255,0.22),0 0 22px 2px rgba(255,255,255,0.18)"
                          : undefined,
                      cursor: isDisabled ? "not-allowed" : "pointer"
                    }}
                  >
                    {sz.size}
                    {!sz.stock && <span className="ml-1 text-white/35 text-xs">(Sold Out)</span>}
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
              View <span className="underline hover:text-white/65 cursor-pointer">Size Guide</span>
            </div>
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
              {maxQty === 0
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
              {maxQty === 0
                ? "Out of Stock"
                : !isSizeValid
                ? "Select Size"
                : isAddedToCart
                ? "View Cart"
                : "Add to Cart"}
            </LuxuryActionButton>
            {/* Trust markers */}
            <div className="mt-4 flex flex-wrap gap-2 items-center justify-center text-white/75 text-[1rem]">
              <span className={badge + " bg-white/10"}><IconLock/> Secure Checkout</span>
            </div>
          </div>
          {/* Product Description - moved after CTAs and badges for mobile */}
          <div className="my-3 mx-0 mt-6">
            <AccordionGroup openKey={openAccordionKey} setOpenKey={setOpenAccordionKey}>
              <LuxuryAccordion title="Product Description" accordionKey="philosophy">
                <div className="text-white/70 text-[1rem] leading-loose font-light tracking-normal pt-0">
                  <p className="mb-3">
                    Cut from soft, high-density organic cotton jersey, this piece reflects a pursuit of clean lines and considered proportions—marrying comfort with refinement.
                  </p>
                  <p className="mb-3">
                    Effortlessly versatile and meant to elevate everyday essentials, it embodies a poised, yet understated confidence.
                  </p>
                  <p className="mt-2 text-white/45 text-base font-extralight leading-relaxed">
                    Feel the signature drape, precision-crafted fit, and subtle details exclusive to atelier-level garments.
                  </p>
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
                  <div>Model is 6’1” (186cm) and wears size L. Fits true to size — for a relaxed fit, size up.</div>
                  <div className="mt-2 text-white/60">A tailored shoulder, elevated neckline, and a slightly elongated hem.</div>
                </div>
              </LuxuryAccordion>
              <LuxuryAccordion title="Delivery & Returns" accordionKey="delivery">
                <div>
                  <strong className="block mb-1 text-white/85">Express delivery: Next business day.</strong>
                  90-day easy returns. <br />
                  Orders ship from our atelier in LA. Packaged in signature FSC-certified gift box. <br />
                  <span className="inline-block mt-1 text-white/55 text-sm">Questions? <a href="/contact" className="underline text-white/60 hover:text-white">Contact us</a></span>
                </div>
              </LuxuryAccordion>
            </AccordionGroup>
          </div>
        </div>
      </div>

      {/* DESKTOP-only Original Layout (unchanged, md:) */}
      <div className="hidden md:flex min-h-[calc(100vh-80px)] w-full md:py-12 md:flex-row md:items-stretch md:px-0">
        {/* BG luxury vizual */}
        <LuxuryBackButton />
        <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
          <div className="absolute left-28 top-20 w-2/5 h-[64vh] rounded-full bg-gradient-radial from-[#74759d2b] via-[#29293536] to-transparent blur-[88px]" />
          <div className="absolute right-10 bottom-0 w-1/5 h-[38vh] rounded-full bg-gradient-radial from-[#d8d8ee18] via-[#f4e8f813] to-transparent blur-[54px]" />
        </div>
        {/* PRODUCT IMAGE (LEFT) */}
        <section className="relative z-10 flex-1 flex justify-end items-stretch max-w-[56vw]">
          <div className={"relative h-full w-full flex flex-col justify-center items-center"} style={{minWidth: 0}}>
            <div className={
              [
                "relative aspect-[4/5] w-full max-w-[540px] rounded-3xl mb-6 " + glassCard,
                mainSpotGradient,
                fadeAnim,
                imgTransitioning ? "opacity-70 scale-98" : "opacity-100 scale-100"
              ].join(" ")
            }
              style={{
                boxShadow: imgTransitioning
                  ? "0 5px 36px 0 rgba(255,255,255,0.07)"
                  : "0 12px 72px 1px rgba(255,255,255,0.19)",
                transition: "box-shadow 530ms cubic-bezier(.65,.01,.54,.95), opacity 470ms, transform 530ms"
              }}
            >
              <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-white/0" />
              <img
                src={product.images[mainImgIdx] || "/placeholder.png"}
                alt={product.name}
                key={product.images[mainImgIdx] || "/placeholder.png"}
                className={
                  "object-cover w-full h-full select-none rounded-3xl shadow-[0_8px_42px_3px_rgba(0,0,0,0.51)] " +
                  "transition-transform duration-600 ease-in-out will-change-transform group"
                }
                style={{
                  opacity: imgTransitioning ? 0.88 : 1,
                  filter: "brightness(1.05) drop-shadow(0_0_32px_rgba(255,255,255,0.17))",
                  transform: imgTransitioning ? "scale(1.032)" : "scale(1.008)",
                  pointerEvents: "none",
                  borderRadius: "1.5rem",
                  transition: "opacity 610ms cubic-bezier(.68,.01,.49,.95), filter 500ms, transform 550ms"
                }}
                draggable={false}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "scale(1.045)";
                  e.currentTarget.style.transition = "transform 270ms cubic-bezier(.74,.01,.53,.97)";
                  e.currentTarget.style.filter = "brightness(1.09) saturate(1.05) drop-shadow(0_0_58px_rgba(255,255,255,0.15))";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = imgTransitioning ? "scale(1.032)" : "scale(1.008)";
                  e.currentTarget.style.transition = "transform 370ms cubic-bezier(.62,.01,.53,.97)";
                  e.currentTarget.style.filter = "brightness(1.05) drop-shadow(0_0_32px_rgba(255,255,255,0.17))";
                }}
              />
              <div className="absolute inset-0 pointer-events-none z-30"
                style={{
                  background: "radial-gradient(ellipse farthest-side at 60% 32%, rgba(255,255,255,0.10) 20%,rgba(0,0,0,0) 75%)"
                }}
              />
              <div className="absolute inset-0 rounded-3xl pointer-events-none z-20 border border-white/10"></div>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-4 mt-1 z-20">
              {product.images?.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => setMainImgIdx(idx)}
                  className={
                    [
                      "overflow-hidden", hoverGlow, focusRing,
                      "rounded-2xl w-16 h-16 flex items-center justify-center ring-0 border-2 transition-[box-shadow,scale]",
                      idx === mainImgIdx
                        ? "border-white/80 scale-110 shadow-[0_0_16px_4px_rgba(255,255,255,0.19)]"
                        : "border-white/10 scale-95"
                    ].join(" ")
                  }
                  style={{background: "rgba(24,24,28,0.18)"}}
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
          <div className={"w-full max-w-2xl mx-auto rounded-3xl px-6 py-8 mb-5 shadow-[0_6px_54px_0_rgba(25,27,32,0.32)] " + glassCard}>
            <div className="text-center mb-6">
              <h1 className="font-extrabold text-[2.7rem] leading-[1.1] md:text-[3.2rem] text-white mb-4 tracking-tight drop-shadow-[0_1px_36px_rgba(255,255,255,0.15)]" style={{fontFamily: "'Neue Haas Grotesk Display', 'Inter', 'system-ui', serif"}}>
                {product.name}
              </h1>
              <div className="flex flex-row items-center justify-center gap-3 mb-3">
                <span className="text-white text-2xl md:text-3xl font-black">{formatPrice(product.price)}</span>
                {originalPrice > product.price && (
                  <span className="text-white/35 line-through text-lg font-normal">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
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
            <div className="my-4 mx-0 max-w-2xl">
              <AccordionGroup openKey={openAccordionKey} setOpenKey={setOpenAccordionKey}>
                <LuxuryAccordion title="Product Description" accordionKey="philosophy">
                  <div className="text-white/65 text-base leading-loose font-light tracking-normal pt-0">
                    <p className="mb-3">
                      Cut from soft, high-density organic cotton jersey, this piece reflects a pursuit of clean lines and considered proportions—marrying comfort with refinement.
                    </p>
                    <p className="mb-3">
                      Effortlessly versatile and meant to elevate everyday essentials, it embodies a poised, yet understated confidence.
                    </p>
                    <p className="mt-2 text-white/45 text-base font-extralight leading-relaxed">
                      Feel the signature drape, precision-crafted fit, and subtle details exclusive to atelier-level garments.
                    </p>
                  </div>
                </LuxuryAccordion>
              </AccordionGroup>
            </div>
          </div>
          <div className="w-full max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6 w-full">
              <div>
                <div className="font-semibold text-white/80 text-lg mb-3 text-center">Select Size</div>
                <div className="flex flex-wrap gap-2 mb-1 justify-center">
                  {product.sizes.map((sz) => {
                    const isDisabled = !sz.stock;
                    const isSelected = selectedSize === sz.size;
                    return (
                      <button
                        key={sz.size}
                        className={[
                          pillBtn,
                          isSelected ? pillBtnSelected : "",
                          isDisabled ? pillBtnDisabled : ""
                        ].join(" ")}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedSize(sz.size);
                          setSizeTouched(true);
                        }}
                        aria-pressed={isSelected}
                        style={{
                          boxShadow: isSelected
                            ? "0 0 0 3px rgba(255,255,255,0.22),0 0 22px 2px rgba(255,255,255,0.18)"
                            : undefined,
                          cursor: isDisabled ? "not-allowed" : "pointer"
                        }}
                      >
                        {sz.size}
                        {!sz.stock && <span className="ml-1 text-white/35 text-xs">(Sold Out)</span>}
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
                  View <span className="underline hover:text-white/65 cursor-pointer">Size Guide</span>
                </div>
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
                  {maxQty === 0
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
                  {maxQty === 0
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
                  <span className={badge + " bg-white/10"}><IconLock/> Secure Checkout</span>
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
                    <div>Model is 6’1” (186cm) and wears size L. Fits true to size — for a relaxed fit, size up.</div>
                    <div className="mt-2 text-white/60">A tailored shoulder, elevated neckline, and a slightly elongated hem.</div>
                  </div>
                </LuxuryAccordion>
                <LuxuryAccordion title="Delivery & Returns" accordionKey="delivery">
                  <div>
                    <strong className="block mb-1 text-white/85">Express delivery: Next business day.</strong>
                    90-day easy returns. <br />
                    Orders ship from our atelier in LA. Packaged in signature FSC-certified gift box. <br />
                    <span className="inline-block mt-1 text-white/55 text-sm">Questions? <a href="/contact" className="underline text-white/60 hover:text-white">Contact us</a></span>
                  </div>
                </LuxuryAccordion>
              </AccordionGroup>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}