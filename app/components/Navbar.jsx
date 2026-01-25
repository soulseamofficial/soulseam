"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" }, // Retain route
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar({ className = "" }) {
  const pathname = usePathname();

  return (
    <nav className={`flex items-center justify-between w-full ${className}`}>
      
      {/* 🔥 LOGO (GLOBAL HOME NAVIGATION) */}
      <Link href="/" className="flex items-center gap-2 cursor-pointer">
        <Image
          src="/logo2.jpg"
          alt="SoulSeam Logo"
          className="h-9 w-9 rounded-full"
          width={36}
          height={36}
          priority
        />
        <span className="text-xl font-semibold tracking-wide text-white">
          SoulSeam
        </span>
      </Link>

      {/* NAV LINKS */}
      <div className="flex items-center space-x-6">
        {navLinks.map(({ label, href }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

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
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
