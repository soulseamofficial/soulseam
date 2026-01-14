"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function Footer() {
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: true, margin: "-10% 0px" });

  const year = new Date().getFullYear();
  const BRAND = "SoulSeam";

  return (
    <motion.footer
      ref={footerRef}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 0.6, 0.36, 1] }}
      className="bg-black text-white px-6 pt-12 pb-5"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between gap-8">
        {/* Brand Info */}
        <div className="md:w-1/3">
          <div className="text-2xl font-extrabold tracking-wide mb-1">{BRAND}</div>
          <div className="text-sm opacity-80">Wear the story. Live the change.</div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-6 md:flex-row md:w-2/3 md:justify-end md:items-start">
          <nav className="mb-4 md:mb-0">
            <ul className="space-y-2 md:space-y-0 md:space-x-8 flex flex-col md:flex-row md:items-center font-medium">
              <li>
                <Link
                  href="/"
                  className="hover:underline hover:text-cyan-400 transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="hover:underline hover:text-cyan-400 transition"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/blogs"
                  className="hover:underline hover:text-cyan-400 transition"
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:underline hover:text-cyan-400 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          {/* Socials */}
          <div>
            <div className="flex gap-4 md:gap-6">
              <a
                href="https://instagram.com/your_brand"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-cyan-400 transition"
              >
                <span className="sr-only">Instagram</span>
                {/* Placeholder for icon */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="3" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" />
                </svg>
              </a>
              <a
                href="https://youtube.com/your_brand"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="hover:text-cyan-400 transition"
              >
                <span className="sr-only">YouTube</span>
                {/* Placeholder for icon */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="2" y="5" width="20" height="14" rx="4" />
                  <polygon points="10,9 16,12 10,15" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://twitter.com/your_brand"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-cyan-400 transition"
              >
                <span className="sr-only">Twitter / X</span>
                {/* Placeholder for icon */}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4l16 16M20 4L4 20"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Divider */}
      <div className="my-6 border-t border-white/10" />
      {/* Copyright */}
      <div className="text-xs text-gray-400 text-center">
        © {year} {BRAND}. All rights reserved.
      </div>
    </motion.footer>
  );
}
