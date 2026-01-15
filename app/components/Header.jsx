"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false); // close menu on route change
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="backdrop-blur-sm bg-black/90 border-b border-white/10 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
          <Link
  href="/"
  className="font-extrabold tracking-widest text-xl text-white hover:text-primary-400 transition
             relative z-[10000] pointer-events-auto"
  aria-label="SoulSeam Home"
>

              SOUL<span className="text-primary-400">SEAM</span>
            </Link>
          </div>
          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <NavLink href={href} active={pathname === href}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          {/* Hamburger */}
          <div className="md:hidden z-50">
            <button
              onClick={() => setMenuOpen((val) => !val)}
              aria-label={menuOpen ? "Close Menu" : "Open Menu"}
              className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
            >
              <span>
                {/* Icon */}
                {!menuOpen ? (
                  <svg width={28} height={28} fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                ) : (
                  <svg width={28} height={28} fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
            </button>
          </div>
          {/* Mobile Nav */}
          <div
            className={`fixed inset-0 bg-black/90 flex flex-col items-end pt-5 pr-5 transition-all duration-300 md:hidden ${
              menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          >
            <nav className="w-5/6 max-w-xs bg-black rounded-xl shadow-xl mt-10 p-6 border border-white/10">
              <ul className="flex flex-col gap-4">
                {navLinks.map(({ label, href }) => (
                  <li key={href}>
                    <NavLink
                      href={href}
                      active={pathname === href}
                      onClick={() => setMenuOpen(false)}
                      mobile
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, active, children, onClick, mobile }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`transition relative px-2 py-1 text-base ${
        active
          ? "text-white font-bold"
          : "text-white/80 hover:text-primary-400"
      } 
        ${!mobile ? "after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:rounded-lg after:bg-gradient-to-r after:from-primary-400 after:to-primary-600 after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform after:duration-300" : ""}
        ${active && !mobile ? "after:scale-x-100" : ""}
      `}
      style={{ transitionProperty: "color, background-color" }}
    >
      {children}
    </Link>
  );
}

