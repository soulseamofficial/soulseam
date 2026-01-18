// src/ExploreCollection.js
"use client";

// other imports...

import React, { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";  
import { ArrowLeft } from "lucide-react";

import { 
  ChevronRight, Sparkles, Filter, X, ShoppingBag, Heart, Star, ArrowUpRight, 
  Play, Pause, Plus, Minus, Check, Share2, Truck, Shield, RotateCcw, 
  ChevronLeft, ChevronRight as RightIcon, XCircle, Package, Tag, Ruler,
  Info, CreditCard, Maximize2, Layers, CircleDot
} from 'lucide-react';
//import { Link } from 'react-router-dom';
import { useCart } from './CartContext'; // <-- This is the only change: use global context

// ----------- GLOBAL PRODUCT FALLBACK IMAGE UTILITY -------------
// Returns the primary product image if valid, otherwise '/coming-soon.jpg'
function getProductImage(product, fallbackIndex = 0) {
  // ALWAYS use the placeholder for any product image
  return "/coming-soon.jpg";
}
// ---------------------------------------------------------------

const ExploreCollection = () => {
  // === PROPER GLOBAL CART USING CONTEXT ===
  const { addToCart, cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);

  const videoRef = useRef(null);
  const heroRef = useRef(null);
  const productsRef = useRef(null);
  const containerRef = useRef(null);
  const modalRef = useRef(null);

  // Premium fashion products collection (ALL product images replaced by "/coming-soon.jpg")
  const categories = [
    { id: 'all', name: 'All Collections', count: 42 },
    { id: 'hoodies', name: 'Signature Hoodies', count: 12 },
    { id: 'tees', name: 'Artistic Tees', count: 15 },
    { id: 'pants', name: 'Premium Pants', count: 8 },
    { id: 'accessories', name: 'Accessories', count: 7 },
  ];

  const filters = [
    { id: 'size', name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { id: 'color', name: 'Color', options: ['Black', 'White', 'Gray', 'Navy', 'Olive', 'Burgundy'] },
    { id: 'price', name: 'Price Range', options: ['Under ₹1500', '₹1500 - ₹3000', '₹3000 - ₹5000', 'Over ₹5000'] },
    { id: 'material', name: 'Material', options: ['Organic Cotton', 'Premium Blend', 'Recycled Poly', 'Linen'] },
  ];

  const sizeChart = {
    'T-Shirts': {
      'XS': { chest: '34-36"', length: '27"', shoulder: '16"', sleeve: '8"' },
      'S': { chest: '36-38"', length: '28"', shoulder: '17"', sleeve: '8.5"' },
      'M': { chest: '38-40"', length: '29"', shoulder: '18"', sleeve: '9"' },
      'L': { chest: '40-42"', length: '30"', shoulder: '19"', sleeve: '9.5"' },
      'XL': { chest: '40-42"', length: '31"', shoulder: '20"', sleeve: '10"' },
      'XXL': { chest: '44-46"', length: '32"', shoulder: '21"', sleeve: '10.5"' }
    },
    'Hoodies': {
      'XS': { chest: '38-40"', length: '26"', shoulder: '17"', sleeve: '24"' },
      'S': { chest: '40-42"', length: '27"', shoulder: '18"', sleeve: '25"' },
      'M': { chest: '42-44"', length: '28"', shoulder: '19"', sleeve: '26"' },
      'L': { chest: '44-46"', length: '29"', shoulder: '20"', sleeve: '27"' },
      'XL': { chest: '46-48"', length: '30"', shoulder: '21"', sleeve: '28"' },
      'XXL': { chest: '48-50"', length: '31"', shoulder: '22"', sleeve: '29"' }
    },
    'Pants': {
      '28': { waist: '28"', hip: '38"', inseam: '32"', thigh: '22"' },
      '30': { waist: '30"', hip: '40"', inseam: '32"', thigh: '23"' },
      '32': { waist: '32"', hip: '42"', inseam: '32"', thigh: '24"' },
      '34': { waist: '34"', hip: '44"', inseam: '32"', thigh: '25"' }
    }
  };

  // ALL images replaced with "/coming-soon.jpg" for soft launch
  const products = [
    {
      id: 1,
      name: "The Frost King Hoodie",
      category: "hoodies",
      price: 0,
      originalPrice: 0,
      rating: 4.9,
      reviewCount: 128,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Gray'],
      material: 'Premium Blend',
      tags: ['best-seller', 'new'],
      description: 'Embrace the chill with our signature Frost King design. Crafted from premium blend fabric for ultimate comfort and warmth. Perfect for those chilly evenings and urban adventures.',
      detailedDescription: 'Our Frost King Hoodie features a unique frost-inspired pattern that shimmers in the light. Made with sustainable materials and eco-friendly dyes, this hoodie is as conscious as it is stylish. The interior features a soft fleece lining for extra warmth.',
      features: [
        'Premium blend fabric (80% Cotton, 20% Polyester)',
        'Eco-friendly water-based printing',
        'Kangaroo pocket with hidden zipper',
        'Adjustable drawstring hood',
        'Ribbed cuffs and hem for snug fit',
        'Made with sustainable materials'
      ],
      careInstructions: [
        'Machine wash cold with similar colors',
        'Use mild detergent',
        'Tumble dry low',
        'Do not bleach',
        'Iron on low heat if needed'
      ],
      images: [
        '/coming-soon.jpg',
        '/coming-soon.jpg',
        '/coming-soon.jpg',
        '/coming-soon.jpg'
      ],
      sizeChartType: 'Hoodies'
    },
    {
      id: 2,
      name: "Dragon's Wrath Tee",
      category: "tees",
      price: 0,
      originalPrice: 0,
      rating: 4.8,
      reviewCount: 94,
      sizes: ['S', 'M', 'L'],
      colors: ['Black', 'White'],
      material: 'Organic Cotton',
      tags: ['featured'],
      description: 'Unleash the fire within with our Dragon Wrath design. Bold, powerful, and made for the fearless.',
      detailedDescription: 'This graphic tee features a detailed dragon illustration printed with eco-friendly inks. The 100% organic cotton fabric ensures breathability and comfort throughout the day.',
      features: [
        '100% Organic Cotton',
        'Eco-friendly digital printing',
        'Reinforced neckline',
        'Tubular construction for better fit',
        'Pre-shrunk fabric',
        'OEKO-TEX certified'
      ],
      careInstructions: [
        'Wash inside out',
        'Cold water wash',
        'Hang dry',
        'Do not tumble dry',
        'Iron on medium heat'
      ],
      images: [
        '/coming-soon.jpg',
        '/coming-soon.jpg',
        '/coming-soon.jpg'
      ],
      sizeChartType: 'T-Shirts'
    },
    {
      id: 3,
      name: "Urban Explorer Pants",
      category: "pants",
      price: 0,
      originalPrice: 0,
      rating: 4.7,
      reviewCount: 65,
      sizes: ['28', '30', '32', '34'],
      colors: ['Navy', 'Olive'],
      material: 'Recycled Poly',
      tags: ['new'],
      description: 'Designed for urban exploration with comfort and durability in mind.',
      detailedDescription: 'These pants combine style with functionality, featuring multiple pockets and stretch fabric for maximum mobility.',
      features: [
        'Water-resistant finish',
        '4-way stretch fabric',
        'Multiple utility pockets',
        'Reinforced stitching',
        'Adjustable waist'
      ],
      careInstructions: [
        'Machine wash cold',
        'Line dry only',
        'Do not iron',
        'Use gentle cycle'
      ],
      images: [
        '/coming-soon.jpg',
        '/coming-soon.jpg'
      ],
      sizeChartType: 'Pants'
    },
    {
      id: 4,
      name: "Nightfall Hoodie",
      category: "hoodies",
      price: 0,
      originalPrice: 0,
      rating: 4.9,
      reviewCount: 112,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'Burgundy'],
      material: 'Premium Blend',
      tags: ['best-seller'],
      description: 'A sleek hoodie for those night-time adventures.',
      detailedDescription: 'Dark and mysterious, perfect for evening wear with hidden details that reveal themselves in low light.',
      features: [
        'Premium cotton blend',
        'Reflective detailing',
        'Zippered pockets',
        'Brushed interior',
        'Adjustable cuffs'
      ],
      careInstructions: [
        'Wash inside out',
        'Cold wash only',
        'Tumble dry low',
        'Do not bleach'
      ],
      images: [
        '/coming-soon.jpg',
        '/coming-soon.jpg'
      ],
      sizeChartType: 'Hoodies'
    }
  ];

  // Animation effects (your original)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(100, (scrollTop / docHeight) * 100);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // --- Quick View: SIMPLE BODY OVERFLOW SCROLL LOCK ONLY ---
  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);
  // ---------------------------------------------------------

  // Show cart notification
  useEffect(() => {
    if (showCartNotification) {
      const timer = setTimeout(() => {
        setShowCartNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCartNotification]);

  // Video controls
  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Filter products by category
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      default: return 0;
    }
  });

  // Toggle favorite
  const toggleFavorite = (productId, e) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // --- Simplified Quick View functions (per instructions) ---
  const openQuickView = (product, e) => {
    if (e) e.stopPropagation();
    setSelectedProduct(product);
    setSelectedSize('');
    setQuantity(1);
    setCurrentImageIndex(0);
    setAddedToCart(false);
    setIsModalOpen(true);
  };

  const closeQuickView = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };
  // ----------------------------------------------------------

  const nextImage = () => {
    if (selectedProduct) {
      const imgs = (selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0)
        ? selectedProduct.images
        : ["/coming-soon.jpg"];
      setCurrentImageIndex((prev) => 
        prev === imgs.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedProduct) {
      const imgs = (selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0)
        ? selectedProduct.images
        : ["/coming-soon.jpg"];
      setCurrentImageIndex((prev) => 
        prev === 0 ? imgs.length - 1 : prev - 1
      );
    }
  };

  // FIXED: Now uses global addToCart from CartContext
  const addToCartHandler = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    addToCart(
      selectedProduct, 
      selectedSize, 
      quantity,
      selectedProduct.colors?.[0] || 'Black'
    );
    
    setAddedToCart(true);
    setShowCartNotification(true);
    
    setTimeout(() => {
      setAddedToCart(false);
    }, 4000);
  };

  const buyNow = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    
    addToCart(
      selectedProduct, 
      selectedSize, 
      quantity,
      selectedProduct.colors?.[0] || 'Black'
    );
    
    window.location.href = '/cart';
  };

  // Quick View Modal Component (with correct fallback logic)
  const QuickViewModal = () => {
    if (!selectedProduct) {
      return null;
    }
    // Defensive for image array; use ["/coming-soon.jpg"] if missing/empty
    // Always show just array of "/coming-soon.jpg"
    const imagesArr = (
      selectedProduct.images &&
      Array.isArray(selectedProduct.images) &&
      selectedProduct.images.length > 0
    ) ? selectedProduct.images : ["/coming-soon.jpg"];

    const mainImage = imagesArr[currentImageIndex];

    // Handler that never outputs broken image for main
    const handleMainImageError = (e) => {
      if (e.target.src !== "/coming-soon.jpg") {
        e.target.src = "/coming-soon.jpg";
      }
    };

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={closeQuickView}
        />
        
        {/* Modal Content */}
        <div 
          ref={modalRef}
          className="relative w-full max-w-6xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden"
          style={{ maxHeight: '95vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={closeQuickView}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 transition-all duration-300 touch-manipulation"
            aria-label="Close modal"
          >
            <X size={20} className="sm:w-6 sm:h-6 text-white" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-y-auto" style={{ maxHeight: '95vh' }}>
            {/* Left Column - Images */}
            <div className="relative overflow-hidden bg-black flex flex-col">
              {/* Main Image */}
              <div className="relative h-[50vh] sm:h-[60%] overflow-hidden">
                <img
                  src={mainImage}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={handleMainImageError}
                />
                
                {/* Image Navigation */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 touch-manipulation"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} className="sm:w-6 sm:h-6 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 touch-manipulation"
                  aria-label="Next image"
                >
                  <RightIcon size={20} className="sm:w-6 sm:h-6 text-white" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full border border-white/20">
                  <span className="text-white text-xs sm:text-sm">
                    {(imagesArr && imagesArr.length > 0)
                      ? (currentImageIndex + 1) + " / " + imagesArr.length
                      : "1 / 1"}
                  </span>
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="h-auto sm:h-[40%] p-2 sm:p-4 border-t border-white/10">
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {(imagesArr && imagesArr.length > 0) ? (
                    imagesArr.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl overflow-hidden border-2 touch-manipulation ${
                          currentImageIndex === index 
                            ? 'border-white' 
                            : 'border-white/20'
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img
                          src={'/coming-soon.jpg'}
                          alt={`${selectedProduct.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (e.target.src !== "/coming-soon.jpg") {
                              e.target.src = "/coming-soon.jpg";
                            }
                          }}
                        />
                      </button>
                    ))
                  ) : (
                    // If no images, just show one placeholder thumb
                    <div className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl overflow-hidden border-2 border-white`}>
                      <img
                        src="/coming-soon.jpg"
                        alt={`${selectedProduct.name} placeholder`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto bg-black">
              <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                    {selectedProduct.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold bg-white/10 text-white rounded-full border border-white/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
                    {selectedProduct.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="sm:w-[18px] sm:h-[18px] fill-yellow-400 text-yellow-400" />
                      <span className="text-white/80 text-sm sm:text-base">{selectedProduct.rating}</span>
                      <span className="text-white/60 text-xs sm:text-sm">({selectedProduct.reviewCount} reviews)</span>
                    </div>
                    <span className="text-green-400 text-xs sm:text-sm">
                      <Check size={14} className="sm:w-4 sm:h-4 inline mr-1" />
                      In Stock
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    ₹{selectedProduct.price.toLocaleString()}
                  </span>
                  <span className="text-lg sm:text-xl text-white/60 line-through">
                    ₹{selectedProduct.originalPrice.toLocaleString()}
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs sm:text-sm font-semibold">
                    Save ₹{(selectedProduct.originalPrice - selectedProduct.price).toLocaleString()}
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Product Description
                  </h3>
                  <p className="text-white/70 text-sm sm:text-base">
                    {selectedProduct.detailedDescription}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Key Features
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {selectedProduct.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <Check size={16} className="sm:w-[18px] sm:h-[18px] text-green-400 mt-0.5 sm:mt-1 flex-shrink-0" />
                        <span className="text-white/70 text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Size Selection */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Select Size
                    </h3>
                    {selectedSize && (
                      <span className="text-xs sm:text-sm text-green-400">
                        Selected: {selectedSize}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
                    {selectedProduct.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 touch-manipulation ${
                          selectedSize === size
                            ? 'bg-white text-black border-white transform scale-105'
                            : 'bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/40'
                        }`}
                      >
                        <span className="font-semibold text-sm sm:text-base">{size}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <h4 className="text-white font-semibold text-sm sm:text-base">Quantity:</h4>
                  <div className="flex items-center gap-2 sm:gap-3 border border-white/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors touch-manipulation"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={18} className="sm:w-5 sm:h-5 text-white" />
                    </button>
                    <span className="text-white font-semibold min-w-[24px] sm:min-w-[30px] text-center text-sm sm:text-base">{quantity}</span>
                    <button
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors touch-manipulation"
                      aria-label="Increase quantity"
                    >
                      <Plus size={18} className="sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Added to Cart Success Message */}
                {addedToCart && (
                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400">
                      <Check size={20} />
                      <span className="font-medium">Added to cart successfully!</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
                  {addedToCart ? (
                    <Link
                      href="/cart"
                      className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-sm sm:text-base md:text-lg bg-white text-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 touch-manipulation"
                    >
                      <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
                      <span>VIEW CART</span>
                    </Link>
                  ) : (
                    <button
                      onClick={addToCartHandler}
                      className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-sm sm:text-base md:text-lg bg-white text-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 touch-manipulation"
                    >
                      <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
                      <span>ADD TO CART</span>
                    </button>
                  )}
                  <button
                    onClick={buyNow}
                    className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-sm sm:text-base md:text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all duration-300 transform hover:scale-105 touch-manipulation"
                  >
                    <CreditCard size={20} className="sm:w-6 sm:h-6" />
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

  // Product Card Component (uses getProductImage for all product images)
  const ProductCard = ({ product, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [cardImageIndex, setCardImageIndex] = useState(0);

    // ALWAYS use `/coming-soon.jpg` for any product/hover image
    const mainImageUrl = "/coming-soon.jpg";

    const handleCardImageError = (e) => {
      if (e.target.src !== window.location.origin + "/coming-soon.jpg") {
        e.target.src = "/coming-soon.jpg";
      }
    };

    return (
      <div
        className="product-card group relative overflow-hidden bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:border-white/30 cursor-pointer"
        onMouseEnter={() => {
          setIsHovered(true);
          setCardImageIndex(1);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setCardImageIndex(0);
        }}
        onClick={(e) => openQuickView(product, e)}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
        
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl sm:rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60 z-10"></div>
          
          {/* Main Image */}
          <img
            src={mainImageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            loading="lazy"
            onError={handleCardImageError}
          />
          
          {/* Quick View Button */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-center transition-all duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openQuickView(product, e);
              }}
              className="mb-4 sm:mb-6 md:mb-8 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-white text-black font-semibold text-xs sm:text-sm md:text-base rounded-full transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-black hover:text-white border-2 border-white hover:scale-105 z-20 touch-manipulation"
            >
              Quick View
            </button>
          </div>
          
          {/* Tags */}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            {product.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-xs font-semibold bg-black/80 backdrop-blur-sm text-white rounded-full border border-white/20"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id, e);
            }}
            className="absolute top-4 right-4 z-30 p-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 transition-all duration-300"
          >
            <Heart
              size={20}
              className={`transition-all duration-300 ${
                favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </button>
        </div>
        
        {/* Product Info */}
        <div className="p-4 sm:p-5 md:p-6 relative z-20">
          <div className="flex items-start justify-between mb-2 gap-2">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white group-hover:text-gray-300 transition-colors duration-300 line-clamp-2 flex-1">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star size={14} className="sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm text-white/80">{product.rating}</span>
              <span className="text-[10px] sm:text-xs text-white/60">({product.reviewCount})</span>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-white/60 mb-3 sm:mb-4 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">₹{product.price.toLocaleString()}</span>
              <span className="text-xs sm:text-sm text-white/60 line-through">₹{product.originalPrice.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openQuickView(product, e);
              }}
              className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group touch-manipulation flex-shrink-0"
              aria-label="Quick view"
            >
              <ShoppingBag size={18} className="sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white overflow-hidden">
      {/* Cart Notification */}
      {showCartNotification && (
        <div className="fixed top-20 sm:top-24 right-2 sm:right-4 z-[9999] animate-fadeIn max-w-[calc(100vw-1rem)]">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-600 text-white rounded-lg shadow-xl flex items-center gap-2 sm:gap-3">
            <Check size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-sm sm:text-base">Added to cart successfully!</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {/* Back to Home Button */}
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

        {/* Cart Button */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-20">
          <Link 
           href="/cart"
            className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/80 transition-all duration-300 relative touch-manipulation"
          >
            <ShoppingBag size={16} className="sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">CART</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
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
                onClick={() => productsRef.current?.scrollIntoView({ behavior: 'smooth' })}
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
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs opacity-80">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <section ref={productsRef} className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 sm:mb-12 md:mb-16 text-center">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/5 mb-4 sm:mb-6">
                <Sparkles size={16} className="sm:w-5 sm:h-5 text-yellow-400" />
                <span className="text-sm sm:text-base md:text-lg font-semibold">PREMIUM COLLECTION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 sm:mb-6 px-4">
                Curated Essentials
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-3xl mx-auto px-4">
                Each piece is meticulously crafted with sustainable materials and timeless design principles
              </p>
            </div>
            
            {/* Mobile: Horizontal Scroll | Tablet+: Grid */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto md:overflow-x-visible scrollbar-hide gap-4 md:gap-6 lg:gap-8 pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
              {sortedProducts.map((product, index) => (
                <div key={product.id} className="flex-shrink-0 w-[75vw] md:w-auto snap-center md:snap-none">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
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
                { value: 'S', label: 'Style' },
                { value: 'O', label: 'Originality' },
                { value: 'U', label: 'Unmatched' },
                { value: 'L', label: 'Luxury & Premium' },
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
      
      {/* Quick View Modal - only rendered once */}
      {isModalOpen && <QuickViewModal />}
      
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
      
      {/* Styles (your original) */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        button:focus {
          outline: none;
          ring: 2px solid rgba(255, 255, 255, 0.5);
        }
        
        button {
          position: relative;
          z-index: 30;
        }
        
        button {
          user-select: none;
          -webkit-user-select: none;
        }
        
        .product-card {
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        
        .quick-view-btn {
          position: relative;
          z-index: 40 !important;
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