"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function Footer() {
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: true, margin: "-10% 0px" });

  const year = new Date().getFullYear();
  const BRAND = "SOUL SEAM";

  return (
    <motion.footer
      ref={footerRef}
      id="contact"
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 0.6, 0.36, 1] }}
      className="bg-black text-white py-8 sm:py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Glass Container Wrapper */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 0.6, 0.36, 1] }}
          className="footer-glass-container"
        >
          {/* Main Footer Content - Mobile: Horizontal Row, Desktop: 3 Columns */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3 md:gap-8 lg:gap-10 xl:gap-12 mb-6 sm:mb-7 md:mb-8">
            {/* COMPANY Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 0.6, 0.36, 1] }}
              className="flex flex-col w-full"
            >
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-3 md:mb-4 tracking-wider uppercase relative inline-block group cursor-default transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:brightness-110 hover:scale-[1.02]">
                COMPANY
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/60 group-hover:w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 md:space-y-2.5">
                {[
                  { label: "Home", href: "#home" },
                  { label: "Clothing", href: "#hoodies" },
                  { label: "Our Story", href: "#story" },
                  { label: "Contact", href: "#contact" },
                ].map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.href}
                      className="group relative text-[10px] sm:text-xs md:text-sm text-white/70 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] inline-block hover:translate-y-[-1px]"
                    >
                      <span className="relative z-10">{item.label}</span>
                      <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-white/80 group-hover:w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* OUR POLICY Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 0.6, 0.36, 1] }}
              className="flex flex-col w-full"
            >
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-3 md:mb-4 tracking-wider uppercase relative inline-block group cursor-default transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:brightness-110 hover:scale-[1.02]">
                OUR POLICY
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/60 group-hover:w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 md:space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "/privacy-policy" },
                  { label: "Shipping Policy", href: "/shipping-policy" },
                  { label: "Terms of Service", href: "/terms-of-service" },
                  { label: "Exchange Policy", href: "/exchange-policy" },
                ].map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="group relative text-[10px] sm:text-xs md:text-sm text-white/70 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] inline-block hover:translate-y-[-1px]"
                    >
                      <span className="relative z-10">{item.label}</span>
                      <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-white/80 group-hover:w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CONTACT Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 0.6, 0.36, 1] }}
              className="flex flex-col w-full"
            >
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-2 sm:mb-3 md:mb-4 tracking-wider uppercase relative inline-block group cursor-default transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:brightness-110 hover:scale-[1.02]">
                CONTACT
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/60 group-hover:w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
              </h3>
              <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                {/* Email */}
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-xs md:text-sm text-white/50 mb-0.5 sm:mb-1">
                    Email:
                  </span>
                  <a
                    href="mailto:soulseamhelp@gmail.com"
                    className="group relative text-[9px] sm:text-xs md:text-sm text-white/70 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] inline-block break-all hover:translate-y-[-1px] self-start leading-tight"
                  >
                    <span className="relative z-10">soulseamhelp@gmail.com</span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-white/80 group-hover:w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                  </a>
                </div>
                {/* Phone */}
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-xs md:text-sm text-white/50 mb-0.5 sm:mb-1">
                    Phone:
                  </span>
                  <a
                    href="tel:+91XXXXXXXXXX"
                    className="group relative text-[9px] sm:text-xs md:text-sm text-white/70 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] inline-block break-words hover:translate-y-[-1px] self-start leading-tight"
                  >
                    <span className="relative z-10">+91 XXX XXX XXXX</span>
                    <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-white/80 group-hover:w-full transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"></span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-4 sm:my-5 md:my-6"></div>

          {/* Copyright Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 0.6, 0.36, 1] }}
            className="flex items-center justify-center gap-2 sm:gap-3"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-white/15 hover:border-white/30">
              <span className="text-white text-xs sm:text-sm font-bold">N</span>
            </div>
            <p className="text-[10px] sm:text-xs text-white/50">
              © {BRAND} {year}. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
