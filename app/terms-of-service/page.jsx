"use client";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111] to-black text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wider mb-6 text-center policy-heading policy-animate-1">
          Terms of Service
        </h1>
        
        <div className="policy-container policy-animate-2">
          <p className="text-white/80 leading-relaxed mb-8 text-center text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <section className="policy-section policy-animate-3">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Agreement to Terms</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              By accessing and using the SOUL SEAM website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.
            </p>
          </section>
          
          <section className="policy-section policy-animate-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Use License</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              Permission is granted to temporarily access the materials on SOUL SEAM&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
          </section>
          
          <section className="policy-section policy-animate-5">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Product Information</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions or other content on this site is accurate, complete, reliable, current, or error-free.
            </p>
          </section>
          
          <section className="policy-section policy-animate-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Pricing and Payment</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              All prices are listed in the currency specified on the website. We reserve the right to change prices at any time. Payment must be received before we process and ship your order.
            </p>
          </section>
          
          <section className="policy-section policy-animate-7">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Limitation of Liability</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              SOUL SEAM shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
          </section>
          
          <section className="policy-section policy-animate-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Contact Us</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a 
                href="mailto:soulseamhelp@gmail.com" 
                className="text-white hover:text-white/80 underline transition-colors duration-300"
              >
                soulseamhelp@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
