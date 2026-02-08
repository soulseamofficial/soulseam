"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Customer info
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Products
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // Shipping address
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Payment & order details
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [orderStatus, setOrderStatus] = useState("CREATED");
  const [discount, setDiscount] = useState(0);
  const [orderMessage, setOrderMessage] = useState("");

  // Calculate totals
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalAmount = subtotal - discount;

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/admin/products", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    }
    fetchProducts();
  }, []);

  // Add item to order
  function addItem(product) {
    const existingItem = selectedItems.find(
      (item) => item.productId === product._id && item.size === ""
    );

    if (existingItem) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.productId === product._id && item.size === ""
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: product._id,
          name: product.title,
          image: product.images?.[0] || "",
          size: "",
          color: "",
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  }

  // Update item
  function updateItem(index, field, value) {
    setSelectedItems(
      selectedItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  // Remove item
  function removeItem(index) {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  }

  // Get available sizes for a product
  function getAvailableSizes(product) {
    if (!product.sizes || !Array.isArray(product.sizes)) return [];
    return product.sizes.filter((s) => s.stock > 0).map((s) => s.size);
  }

  // Handle submit
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!customerEmail && !customerPhone) {
      setError("Customer email or phone is required");
      setLoading(false);
      return;
    }

    if (selectedItems.length === 0) {
      setError("Please add at least one item to the order");
      setLoading(false);
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      setError("Please fill in all required shipping address fields");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerEmail,
          customerPhone,
          items: selectedItems,
          shippingAddress,
          paymentMethod,
          paymentStatus,
          orderStatus,
          subtotal,
          discount,
          totalAmount,
          orderMessage: orderMessage || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create order");
        setLoading(false);
        return;
      }

      setSuccess("Order created successfully!");
      setTimeout(() => {
        router.push("/admin/orders");
      }, 1500);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="p-10 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-zinc-200 bg-clip-text text-transparent">
            Create Order
          </h1>
          <button
            onClick={() => router.push("/admin/orders")}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition"
          >
            ← Back to Orders
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="bg-black/40 border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Customer Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Customer Email *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              * At least one of email or phone is required. User must be registered first.
            </p>
          </div>

          {/* Products Selection */}
          <div className="bg-black/40 border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Add Products</h2>
            
            {/* Product Selector */}
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-2">
                Select Product
              </label>
              <select
                onChange={(e) => {
                  const product = products.find((p) => p._id === e.target.value);
                  if (product) addItem(product);
                  e.target.value = "";
                }}
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
              >
                <option value="">Choose a product...</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.title} - ₹{product.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/70">Order Items:</h3>
                {selectedItems.map((item, index) => {
                  const product = products.find((p) => p._id === item.productId);
                  const availableSizes = product ? getAvailableSizes(product) : [];

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-black/60 border border-white/10 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-white/60">₹{item.price} each</p>
                      </div>

                      {availableSizes.length > 0 && (
                        <select
                          value={item.size}
                          onChange={(e) => updateItem(index, "size", e.target.value)}
                          className="px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white text-sm"
                        >
                          <option value="">Select Size</option>
                          {availableSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem(index, "quantity", Math.max(1, item.quantity - 1))}
                          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 rounded bg-black/40 border border-white/15 text-white text-center"
                        />
                        <button
                          type="button"
                          onClick={() => updateItem(index, "quantity", item.quantity + 1)}
                          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20"
                        >
                          +
                        </button>
                      </div>

                      <p className="font-bold">₹{item.price * item.quantity}</p>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="bg-black/40 border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={shippingAddress.fullName}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={shippingAddress.addressLine1}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={shippingAddress.addressLine2}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, state: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.pincode}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, pincode: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, country: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Payment & Order Details */}
          <div className="bg-black/40 border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Payment & Order Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="COD">COD</option>
                  <option value="ONLINE">ONLINE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Order Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="CREATED">CREATED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-white/70 mb-2">
                Order Message (Optional)
              </label>
              <textarea
                value={orderMessage}
                onChange={(e) => setOrderMessage(e.target.value)}
                rows={3}
                maxLength={250}
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                placeholder="Customer message or special instructions..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-black/40 border border-white/15 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Discount:</span>
                <span className="font-semibold text-red-400">-₹{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                <span>Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/15 hover:border-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Order..." : "Create Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
