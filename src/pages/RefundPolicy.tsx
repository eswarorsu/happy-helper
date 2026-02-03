import React from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, AlertCircle, CheckCircle, XCircle, Clock, Info } from "lucide-react";

const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fc] to-[#e2e8f0]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <RefreshCcw className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">INNOVESTOR</span>
          </Link>
          <Link to="/" className="text-sm text-slate-600 hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl">💸</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">50% Refund Policy</h1>
          <p className="text-lg text-emerald-100">
            Transparent refund policy for founders
          </p>
          <p className="text-sm text-emerald-200 mt-4">
            Effective Date: 01-01-2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl border border-white/50 space-y-8">

          {/* Refund Eligibility */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">1. Refund Eligibility</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700 mb-3">Founders are eligible for a <strong>50% refund</strong> of the submission fee if:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>The startup is rejected during admin review</li>
                <li>Rejection occurs within 24 hours of submission</li>
              </ul>
            </div>
          </section>

          {/* Non-Refundable Cases */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">2. Non-Refundable Cases</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700 mb-3">No refund will be issued if:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>The startup is approved</li>
                <li>The founder violates platform rules</li>
                <li>False or misleading information is provided</li>
                <li>Refund is requested after approval</li>
              </ul>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">3. Refund Process</h2>
            </div>

            <div className="ml-13">
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Refunds are processed to the original payment method</li>
                <li>Processing time: 5–7 business days</li>
                <li>Payment gateway delays may apply</li>
              </ul>
            </div>
          </section>

          {/* Innovestor's Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">4. Innovestor's Rights</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700 mb-3">Innovestor reserves the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Reject refund requests that violate policy</li>
                <li>Modify refund terms with prior notice</li>
              </ul>
            </div>
          </section>

          {/* Important Notice */}
          <section className="border-t pt-8">
            <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">Important Notice:</p>
                  <p>
                    All refund decisions are final and made at the sole discretion of Innovestor.
                    Please ensure all information provided during submission is accurate and complete
                    to avoid rejection and potential loss of fees.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t pt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Contact Us</h2>
            </div>

            <div className="ml-13 bg-slate-50 rounded-lg p-6 space-y-2">
              <p className="text-slate-700">
                For refund inquiries or questions about this policy, please contact us:
              </p>
              <div className="space-y-1 text-slate-700">
                <p><strong>Company:</strong> INNOVESTOR</p>
                <p><strong>Email:</strong> <a href="mailto:refunds@innovestor.com" className="text-primary hover:underline">refunds@innovestor.com</a></p>
                <p><strong>Support:</strong> <a href="mailto:support@innovestor.com" className="text-primary hover:underline">support@innovestor.com</a></p>
                <p><strong>Address:</strong> Vizag, Andhra Pradesh, India – 530001</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-600">
            © 2026 INNOVESTOR. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <Link to="/privacy-policy" className="text-slate-600 hover:text-primary hover:underline">Privacy Policy</Link>
            <span className="text-slate-400">|</span>
            <Link to="/terms-and-conditions" className="text-slate-600 hover:text-primary hover:underline">Terms & Conditions</Link>
            <span className="text-slate-400">|</span>
            <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RefundPolicy;
