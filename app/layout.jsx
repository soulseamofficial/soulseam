import "./globals.css";
import { CartProvider } from "./CartContext";

export const metadata = {
  title: "SoulSeam Ecommerce",
  description: "Premium fashion with a positive impact.",
};

export default function RootLayout({ children }) {
  return (
<html lang="en" suppressHydrationWarning>
  <body suppressHydrationWarning>
    <CartProvider>
      {children}
    </CartProvider>
  </body>
</html>

  );
}