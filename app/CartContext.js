"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // SSR-safe cart initialization from localStorage
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("soulseam_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage on cartItems change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "soulseam_cart",
        JSON.stringify(cartItems)
      );
    } catch {
      // silent fail
    }
  }, [cartItems]);

  // Cross-tab sync (use _id as primary identifier)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e) => {
      if (e.key === "soulseam_cart") {
        try {
          const items = e.newValue ? JSON.parse(e.newValue) : [];
          setCartItems(Array.isArray(items) ? items : []);
        } catch {
          setCartItems([]);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  /**
   * Add a product to the cart.
   * Enforces:
   *   - Required: product._id (from MongoDB)
   *   - Required: size MUST be supplied (not null/undefined/empty string)
   *   - Items are identified by _id + size
   */
  const addToCart = (product, size, quantity = 1, color = "Black") => {
    // Enforce product object and ._id presence
    if (
      !product ||
      typeof product !== "object" ||
      typeof product._id !== "string"
    ) {
      return;
    }

    // Require valid size selection (must be provided and non-empty string)
    if (!size || typeof size !== "string" || size.trim() === "") {
      // Optionally: Log or handle error/UI feedback here.
      return;
    }

    setCartItems((prevItems) => {
      const idx = prevItems.findIndex(
        (item) => item._id === product._id && item.size === size
      );

      if (idx !== -1) {
        // If already in cart, update quantity
        return prevItems.map((item, i) =>
          i === idx
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Add new cart item (store _id, not id)
      return [
        ...prevItems,
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          image:
            (Array.isArray(product.images) && product.images[0]) ||
            product.image ||
            "https://via.placeholder.com/150",
          size,
          quantity,
          color,
          category: product.category,
          originalPrice: product.originalPrice,
        },
      ];
    });
  };

  /**
   * Update quantity of an item by _id and size
   */
  const updateQuantity = (_id, size, change) => {
    if (!_id || !size) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === _id && item.size === size
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  /**
   * Remove item from cart (by _id and size)
   */
  const removeItem = (_id, size) => {
    if (!_id || !size) return;
    setCartItems((prev) =>
      prev.filter((item) => !(item._id === _id && item.size === size))
    );
  };

  const clearCart = () => setCartItems([]);

  // Cart count and subtotal
  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      (typeof item.price === "number" && typeof item.quantity === "number"
        ? item.price * item.quantity
        : 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        cartCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
