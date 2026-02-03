"use client";

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111] to-black text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wider mb-6 text-center policy-heading policy-animate-1">
          Shipping Policy
        </h1>
        
        <div className="policy-container policy-animate-2">
          <p className="text-white/80 leading-relaxed mb-8 text-center text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <section className="policy-section policy-animate-3">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Shipping Information</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              At SOUL SEAM, we strive to deliver your orders as quickly and safely as possible. This Shipping Policy outlines our shipping practices and delivery timelines.
            </p>
          </section>
          
          <section className="policy-section policy-animate-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Processing Time</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              Orders are typically processed within 1-3 business days after payment confirmation. During peak seasons or sales, processing may take up to 5 business days.
            </p>
          </section>
          
          <section className="policy-section policy-animate-5">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Shipping Methods & Delivery Times</h2>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 mb-4 text-base sm:text-lg">
              <li>Standard Shipping: 5-7 business days</li>
              <li>Express Shipping: 2-3 business days</li>
              <li>International Shipping: 10-15 business days (varies by location)</li>
            </ul>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              Delivery times are estimates and may vary based on your location and carrier performance.
            </p>
          </section>
          
          <section className="policy-section policy-animate-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Shipping Costs</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              Shipping costs are calculated at checkout based on your delivery address and selected shipping method. Free shipping may be available for orders above a certain value.
            </p>
          </section>
          
          <section className="policy-section policy-animate-7">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Order Tracking</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              Once your order ships, you will receive a tracking number via email. You can use this number to track your package on the carrier&apos;s website.
            </p>
          </section>
          
          <section className="policy-section policy-animate-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Contact Us</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              For shipping inquiries, please contact us at{" "}
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
