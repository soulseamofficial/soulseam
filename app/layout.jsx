import "./globals.css";
import { CartProvider } from "./CartContext";
import Script from "next/script";

export const metadata = {
  title: "SoulSeam Ecommerce",
  description: "Premium fashion with a positive impact.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        
        {/* Razorpay Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        <CartProvider>
          {children}
        </CartProvider>

      </body>
    </html>
  );
}
