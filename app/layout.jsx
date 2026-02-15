import "./globals.css";
import { CartProvider } from "./CartContext";
import Script from "next/script";
import ToastContainer from "./components/Toast";

export const metadata = {
  title: "SoulSeam Official",
  description: "Premium fashion with a positive impact.",
  icons: {
    icon: "/logo3.jpg",
  },
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SoulSeam Official",
    "url": "https://www.soulseamofficial.com",
    "logo": "https://www.soulseamofficial.com/logo3.jpg",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        
        {/* Razorpay Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        <CartProvider>
          {children}
          <ToastContainer />
        </CartProvider>

      </body>
    </html>
  );
}
