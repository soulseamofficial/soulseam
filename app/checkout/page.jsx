"use client";

import { useRef, useState, useEffect } from "react";
import { useCart } from "../CartContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* ------------------ CONSTANTS ------------------ */

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
  "Jammu and Kashmir","Ladakh"
];

/* ------------------ PROGRESS BAR ------------------ */

const ProgressBar = ({ step, setStep }) => {
  const router = useRouter();

  const progress = ["Cart", "Information", "Shipping", "Payment"];
  const orderDraftExists =
    typeof window !== "undefined" && !!localStorage.getItem("orderId");

  const canGoToShipping = orderDraftExists;
  const canGoToPayment = orderDraftExists && step >= 2;

  return (
    <nav className="mb-10">
      <ol className="flex items-center gap-4 text-xs">
        {progress.map((label, idx) => (
          <li key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (label === "Cart") router.push("/cart");
                if (label === "Information") setStep(1);
                if (label === "Shipping" && canGoToShipping) setStep(2);
                if (label === "Payment" && canGoToPayment) setStep(3);
              }}
              disabled={
                (label === "Shipping" && !canGoToShipping) ||
                (label === "Payment" && !canGoToPayment)
              }
              className={`uppercase font-bold tracking-widest ${
                idx <= step ? "text-white" : "text-white/30"
              }`}
            >
              {label}
            </button>
            {idx < progress.length - 1 && (
              <span className="mx-2 w-4 h-[2px] bg-white/30" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

/* ------------------ PRODUCT CARD ------------------ */

function CheckoutProductCard({ item }) {
  return (
    <div className="flex items-center mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="w-16 h-16 relative mr-4">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover rounded-lg"
        />
      </div>

      <div className="flex-1">
        <div className="font-bold">{item.name}</div>
        <div className="text-xs text-white/60">
          {item.color} / {item.size}
        </div>
        <div className="font-bold mt-1">
          ₹{(item.finalPrice ?? item.price).toLocaleString()}
        </div>
      </div>

      <div className="font-bold text-white/70">×{item.quantity}</div>
    </div>
  );
}

/* ------------------ MAIN PAGE ------------------ */

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apt: "",
    city: "",
    state: "",
    pin: "",
    phone: "",
    country: "India",
  });

  const [paymentMethod, setPaymentMethod] = useState("not_selected");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const paymentButtonRef = useRef(null);

  /* ------------------ DELIVERY CHECK ------------------ */

  const [deliveryCheck, setDeliveryCheck] = useState(null);
  const [deliveryCheckLoading, setDeliveryCheckLoading] = useState(false);
  const [deliveryCheckError, setDeliveryCheckError] = useState(null);

  useEffect(() => {
    if (step !== 2 || !mounted) return;
    if (!form.pin || form.pin.length !== 6) return;

    async function checkDelivery() {
      setDeliveryCheckLoading(true);
      try {
        const res = await fetch("/api/delivery/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: form,
            cart: cartItems,
          }),
        });

        const data = await res.json();
        setDeliveryCheck(data);
      } catch {
        setDeliveryCheckError("Delivery not available");
      } finally {
        setDeliveryCheckLoading(false);
      }
    }

    checkDelivery();
  }, [step, form.pin, mounted, cartItems]);

  /* ------------------ PRICES ------------------ */

  const itemsWithFinalPrice = mounted
    ? cartItems.map(i => ({
        ...i,
        finalPrice: i.finalPrice ?? i.price,
      }))
    : [];

  const subtotal = itemsWithFinalPrice.reduce(
    (sum, i) => sum + i.finalPrice * i.quantity,
    0
  );

  const shipping = 0;
  const total = subtotal + shipping;

  /* ------------------ SAVE ORDER DRAFT ------------------ */

  async function saveOrderDraft() {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: form,
        items: itemsWithFinalPrice,
        subtotal,
        shipping,
        total,
        payment: { status: "not_selected" },
      }),
    });

    const data = await res.json();
    localStorage.setItem("orderId", data.orderId);
  }

  /* ------------------ PAYMENT ------------------ */

  async function handlePayment() {
    if (
      !mounted ||
      paymentMethod !== "online" ||
      itemsWithFinalPrice.length === 0 ||
      razorpayLoading
    ) {
      alert("Select payment method");
      return;
    }

    setRazorpayLoading(true);

    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total }),
    });

    const data = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: "INR",
      name: "SOULSEAM",
      order_id: data.orderId,
      handler: async response => {
        const orderId = localStorage.getItem("orderId");

        await fetch("/api/orders/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            paymentStatus: "paid",
            orderStatus: "confirmed",
            razorpayPaymentId: response.razorpay_payment_id,
          }),
        });

        clearCart();
        localStorage.removeItem("orderId");
        alert("Payment successful");
        setStep(1);
      },
    };

    new window.Razorpay(options).open();
    setRazorpayLoading(false);
  }

  /* ------------------ HYDRATION SAFETY ------------------ */

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-bold">
        SOULSEAM
      </div>
    );
  }

  /* ------------------ RENDER ------------------ */

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto flex gap-10">
        <section className="flex-1">
          <h1 className="text-3xl font-extrabold mb-6">Checkout</h1>

          <ProgressBar step={step} setStep={setStep} />

          {step === 1 && (
            <button
              onClick={async () => {
                await saveOrderDraft();
                setStep(2);
              }}
              className="mt-6 px-8 py-3 bg-white text-black rounded-full font-bold"
            >
              Continue to Shipping
            </button>
          )}

          {step === 2 && (
            <button
              disabled={deliveryCheckLoading || !deliveryCheck?.serviceable}
              onClick={() => setStep(3)}
              className="mt-6 px-8 py-3 bg-white text-black rounded-full font-bold disabled:opacity-40"
            >
              Continue to Payment
            </button>
          )}

          {step === 3 && (
            <>
              <div className="flex gap-4 mb-6">
                <button onClick={() => setPaymentMethod("online")}>
                  Online
                </button>
                <button onClick={() => setPaymentMethod("cod")}>
                  COD
                </button>
              </div>

              <button
                ref={paymentButtonRef}
                onClick={handlePayment}
                disabled={paymentMethod !== "online"}
                className="px-8 py-4 bg-white text-black rounded-full font-bold"
              >
                Pay ₹{total.toLocaleString()}
              </button>
            </>
          )}
        </section>

        <aside className="w-[35%]">
          <h2 className="font-bold mb-4">Your Order</h2>
          {itemsWithFinalPrice.map(item => (
            <CheckoutProductCard key={item.id} item={item} />
          ))}
          <div className="mt-4 font-bold">
            Total: ₹{total.toLocaleString()}
          </div>
        </aside>
      </div>
    </div>
  );
}
