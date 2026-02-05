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
  // ✅ FIX: Lazy initializer (NO useEffect setState)
  const [cartItems, setCartItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("soulseam_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Order message state
  const [orderMessage, setOrderMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const stored = window.localStorage.getItem("soulseam_order_message");
      return stored ? JSON.parse(stored) : "";
    } catch {
      return "";
    }
  });

  // Save cart to localStorage when cartItems change
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

  // Save order message to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "soulseam_order_message",
        JSON.stringify(orderMessage)
      );
    } catch {
      // silent fail
    }
  }, [orderMessage]);

  // Sync cart between tabs/windows
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

  // Add product to cart
  const addToCart = (product, size = "M", quantity = 1, color = "Black") => {
    if (!product || typeof product !== "object") return;

    setCartItems((prevItems) => {
      const idx = prevItems.findIndex(
        (item) => item.id === product.id && item.size === size
      );

      if (idx !== -1) {
        return prevItems.map((item, i) =>
          i === idx
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevItems,
        {
          id: product.id,
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

  const updateQuantity = (id, size, change) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id, size) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === id && item.size === size))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setOrderMessage(""); // Clear message when cart is cleared
  };

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
        orderMessage,
        setOrderMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
