"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" }, // Retain route, do not modify
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar({ className = "" }) {
  const pathname = usePathname();

  return (
    <nav className={`flex items-center space-x-6 ${className}`}>
      {navLinks.map(({ label, href }) => {
        const isActive =
          href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`relative transition-colors px-2 py-1
              text-white/90 hover:text-primary-400
              ${isActive ? "font-bold text-white" : ""}
              after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:rounded-full
              after:bg-gradient-to-r after:from-primary-400 after:to-primary-600
              after:transition-transform after:duration-300 after:scale-x-0 hover:after:scale-x-100
              after:origin-left
              ${isActive ? "after:scale-x-100" : ""}
            `}
            style={{
              transitionProperty: "color, background-color",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
