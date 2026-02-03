"use client";

export default function ExchangePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#111] to-black text-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wider mb-6 text-center policy-heading policy-animate-1">
          Exchange Policy
        </h1>
        
        <div className="policy-container policy-animate-2">
          <p className="text-white/80 leading-relaxed mb-8 text-center text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <section className="policy-section policy-animate-3">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Exchange Eligibility</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              At SOUL SEAM, we want you to be completely satisfied with your purchase. Items can be exchanged within 3 days of delivery, provided they are in their original condition with tags attached and unworn.
            </p>
          </section>
          
          <section className="policy-section policy-animate-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Conditions for Exchange</h2>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 text-base sm:text-lg">
              <li>Items must be unworn, unwashed, and in original condition</li>
              <li>Original tags and packaging must be intact</li>
              <li>Proof of purchase (order number or receipt) is required</li>
              <li>Exchanges are subject to product availability</li>
            </ul>
          </section>
          
          <section className="policy-section policy-animate-5">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading text-rose-400">Mandatory Video Proof Required</h2>
            <div className="bg-gradient-to-br from-rose-500/15 to-rose-500/5 border border-rose-500/30 rounded-xl p-6 mb-4 transition-all duration-500 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/20">
              <p className="text-white/90 font-semibold mb-4 leading-relaxed text-base sm:text-lg">
                <strong className="text-rose-400">IMPORTANT:</strong> Video proof is mandatory for all exchange requests. Exchange requests without a valid video will not be accepted or processed.
              </p>
              <p className="text-white/80 mb-4 leading-relaxed text-base sm:text-lg">
                You must upload a clear video showing the product condition at the time of requesting an exchange. This video helps us verify the product&apos;s state and process your request efficiently.
              </p>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white/90">Video Requirements:</h3>
              <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 text-base sm:text-lg">
                <li><strong>Duration:</strong> Between 10-60 seconds</li>
                <li><strong>File Size:</strong> Maximum 20 MB</li>
                <li><strong>Supported Formats:</strong> MP4, WEBM, or MOV only</li>
                <li><strong>Content:</strong> Video must clearly show the product condition, including any defects, size issues, or discrepancies</li>
              </ul>
              <p className="text-white/70 mt-4 leading-relaxed text-sm sm:text-base">
                Please ensure your video meets all these requirements before submitting your exchange request. Videos that do not meet these criteria will be rejected, and you will need to resubmit with a compliant video.
              </p>
            </div>
          </section>
          
          <section className="policy-section policy-animate-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Exchange Process</h2>
            <ol className="list-decimal list-inside text-white/80 space-y-2 ml-4 mb-4 text-base sm:text-lg">
              <li>Log in to your account and navigate to your order details</li>
              <li>Click on &quot;Request Exchange&quot; for the item you wish to exchange</li>
              <li>Select the exchange type (Size Change, Color Change, Defective Product, or Wrong Item Received)</li>
              <li>Provide a detailed reason for the exchange</li>
              <li><strong>Upload a mandatory video (10-60 seconds, max 20 MB, MP4/WEBM/MOV format) showing the product condition</strong></li>
              <li>Submit your exchange request</li>
              <li>Our team will review your request and the uploaded video</li>
              <li>Once approved, we will provide you with return instructions</li>
              <li>After we receive and verify the returned item, we will ship the exchange</li>
            </ol>
            <p className="text-white/70 mt-4 leading-relaxed text-sm sm:text-base italic">
              Note: Exchange requests submitted without a valid video meeting all requirements will be automatically rejected. Please ensure your video is uploaded and meets all specifications before submitting.
            </p>
          </section>
          
          <section className="policy-section policy-animate-7">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Non-Exchangeable Items</h2>
            <p className="text-white/80 leading-relaxed mb-4 text-base sm:text-lg">
              The following items cannot be exchanged:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4 text-base sm:text-lg">
              <li>Items that have been worn, washed, or damaged</li>
              <li>Items without original tags or packaging</li>
              <li>Sale or clearance items (unless defective)</li>
              <li>Personalized or customized items</li>
            </ul>
          </section>
          
          <section className="policy-section policy-animate-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Shipping Costs</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              Return shipping costs for exchanges are the responsibility of the customer, unless the item received was defective or incorrect. We will cover shipping costs for the replacement item.
            </p>
          </section>
          
          <section className="policy-section policy-animate-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 policy-heading">Contact Us</h2>
            <p className="text-white/80 leading-relaxed text-base sm:text-lg">
              For exchange requests or questions, please contact us at{" "}
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
