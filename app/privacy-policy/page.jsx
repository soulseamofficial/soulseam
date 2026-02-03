"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111] to-black text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wider mb-6 text-center policy-heading policy-animate-1">
          Privacy Policy
        </h1>
        
        <div className="policy-container policy-animate-2">
          <p className="text-white/80 leading-relaxed mb-8 text-center text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <section className="policy-section policy-animate-3">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Introduction</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg mb-4">
              At SOUL SEAM, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>
          
          <section className="policy-section policy-animate-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Information We Collect</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 text-base sm:text-lg">
              <li>Name and contact information</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information</li>
              <li>Email address and phone number</li>
              <li>Order history and preferences</li>
            </ul>
          </section>
          
          <section className="policy-section policy-animate-5">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">How We Use Your Information</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 text-base sm:text-lg">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and our services</li>
              <li>Improve our website and customer experience</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>
          
          <section className="policy-section policy-animate-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Data Security</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>
          
          <section className="policy-section policy-animate-7">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Contact Us</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
