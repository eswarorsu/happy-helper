import React from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, CreditCard, Clock, Mail, AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";

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
            <RefreshCcw className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund & Cancellation Policy</h1>
          <p className="text-lg text-emerald-100">
            Transparent information about our refund and cancellation procedures.
          </p>
          <p className="text-sm text-emerald-200 mt-4">
            Last Updated: January 24, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl border border-white/50 space-y-8">

          {/* Introduction */}
          <section>
            <p className="text-slate-700 leading-relaxed">
              At INNOVESTOR, we strive to provide excellent service to all our users. This Refund and Cancellation Policy explains the terms under which refunds may be issued for subscription payments and other fees paid for our services. Please read this policy carefully before making any purchase.
            </p>
            <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <p className="text-sm text-slate-700">
                  <strong>Important:</strong> By purchasing a subscription or service from INNOVESTOR, you acknowledge that you have read, understood, and agreed to this Refund Policy.
                </p>
              </div>
            </div>
          </section>

          {/* Subscription Refunds */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">1. Subscription Refund Policy</h2>
            </div>

            <div className="ml-13 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  1.1 Non-Refundable Subscriptions
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-slate-700 font-medium mb-2">All subscription fees are <strong>NON-REFUNDABLE</strong> under the following conditions:</p>
                  <ul className="list-disc pl-6 space-y-1 text-slate-700">
                    <li>Once access to the premium features has been granted</li>
                    <li>After the initial 24-hour grace period (see exceptions below)</li>
                    <li>If you decide to discontinue use before the subscription period ends</li>
                    <li>If you violate our Terms and Conditions, resulting in account suspension</li>
                    <li>Partial refunds for unused portions of the subscription period</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  1.2 Exceptions - When Refunds May Be Issued
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-slate-700 mb-2">We may issue refunds in the following circumstances:</p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>
                      <strong>Duplicate Charges:</strong> If you were accidentally charged multiple times for the same subscription
                    </li>
                    <li>
                      <strong>Technical Errors:</strong> If a technical error on our platform prevented you from accessing paid features for an extended period (more than 48 hours)
                    </li>
                    <li>
                      <strong>24-Hour Grace Period:</strong> If you request a refund within 24 hours of purchase and have not actively used premium features
                    </li>
                    <li>
                      <strong>Service Unavailability:</strong> If our platform experienced significant downtime (more than 72 consecutive hours) due to issues on our end
                    </li>
                    <li>
                      <strong>Fraudulent Charges:</strong> If you can demonstrate that the charge was unauthorized
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">1.3 Prorated Refunds</h3>
                <p className="text-slate-700">We generally do not offer prorated refunds for cancelled subscriptions. However, exceptions may be made on a case-by-case basis at our sole discretion, particularly in cases of:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Medical emergencies or serious personal hardships (documentation required)</li>
                  <li>Demonstrable service failure on our part</li>
                  <li>Legal or regulatory requirements</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">2. Subscription Cancellation Policy</h2>
            </div>

            <div className="ml-13 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">2.1 How to Cancel</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-slate-700 mb-3">You can cancel your subscription at any time through:</p>
                  <ol className="list-decimal pl-6 space-y-2 text-slate-700">
                    <li>Logging into your INNOVESTOR account</li>
                    <li>Navigating to <strong>Account Settings → Subscription</strong></li>
                    <li>Clicking the <strong>"Cancel Subscription"</strong> button</li>
                    <li>Following the confirmation prompts</li>
                  </ol>
                  <p className="text-slate-700 mt-3">Alternatively, email us at <a href="mailto:billing@innovestor.com" className="text-primary hover:underline font-medium">billing@innovestor.com</a> with your account details and cancellation request.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">2.2 When Cancellation Takes Effect</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>
                    <strong>Immediate Effect:</strong> Your cancellation request is processed immediately, but you retain access to premium features until the end of your current billing period
                  </li>
                  <li>
                    <strong>No Automatic Renewal:</strong> Once cancelled, your subscription will not renew at the end of the current period
                  </li>
                  <li>
                    <strong>Access Expiration:</strong> Premium features will be disabled once the paid period expires
                  </li>
                  <li>
                    <strong>Data Retention:</strong> Your account data will be retained according to our Privacy Policy
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">2.3 Re-activation</h3>
                <p className="text-slate-700">You may re-activate your subscription at any time. A new billing cycle will begin upon reactivation, and standard subscription rates will apply.</p>
              </div>
            </div>
          </section>

          {/* Processing Timeline */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">3. Refund Processing Timeline</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">3.1 Review Process</h3>
                <p className="text-slate-700">Once we receive your refund request:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li><strong>Initial Review:</strong> 2-3 business days</li>
                  <li><strong>Decision Notification:</strong> You will be notified via email within 5 business days</li>
                  <li><strong>Additional Information:</strong> We may request supporting documentation to process your request</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">3.2 Approved Refunds</h3>
                <p className="text-slate-700">If your refund is approved:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Refund will be processed to the original payment method</li>
                  <li>Processing time: 5-10 business days</li>
                  <li>Bank/card processing may take an additional 3-7 business days</li>
                  <li>You will receive a confirmation email once the refund is initiated</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">3.3 Denied Refunds</h3>
                <p className="text-slate-700">If your refund request is denied, we will provide a clear explanation outlining the reasons. You have the right to appeal the decision by contacting our support team with additional information.</p>
              </div>
            </div>
          </section>

          {/* Payment Issues */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">4. Payment Errors and Disputes</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">4.1 Billing Errors</h3>
                <p className="text-slate-700">If you notice an incorrect charge or billing error, please contact us immediately at <a href="mailto:billing@innovestor.com" className="text-primary hover:underline font-medium">billing@innovestor.com</a> with:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Your account email address</li>
                  <li>Transaction ID or receipt</li>
                  <li>Description of the error</li>
                  <li>Expected vs. actual charge amount</li>
                </ul>
                <p className="text-slate-700 mt-2">We will investigate and resolve billing errors within 7 business days.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">4.2 Chargebacks</h3>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-slate-700">
                    <strong>Please contact us before initiating a chargeback.</strong> Chargebacks can result in immediate account suspension and may incur additional fees. We are committed to resolving disputes fairly and quickly through direct communication.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Special Circumstances */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">5. Special Circumstances</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">5.1 Free Trials</h3>
                <p className="text-slate-700">If you are on a free trial:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Cancel anytime during the trial period to avoid charges</li>
                  <li>If charged after trial ends, standard refund policy applies</li>
                  <li>Ensure you cancel at least 24 hours before trial expiration</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">5.2 Promotional Offers</h3>
                <p className="text-slate-700">Subscriptions purchased at promotional or discounted rates are subject to the same refund policy. Refunds, if issued, will be for the amount actually paid, not the regular price.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">5.3 Account Termination by INNOVESTOR</h3>
                <p className="text-slate-700">If we terminate your account due to violation of our Terms and Conditions, no refund will be issued for any remaining subscription period.</p>
              </div>
            </div>
          </section>

          {/* How to Request Refund */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">6. How to Request a Refund</h2>
            </div>

            <div className="ml-13">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <p className="text-slate-700 font-semibold mb-3">To request a refund, please email us at:</p>
                <p className="text-lg">
                  <a href="mailto:refunds@innovestor.com" className="text-primary hover:underline font-bold">refunds@innovestor.com</a>
                </p>
                <p className="text-slate-700 mt-4 mb-2">Include the following information:</p>
                <ol className="list-decimal pl-6 space-y-1 text-slate-700">
                  <li>Your full name and account email</li>
                  <li>Transaction ID or payment receipt</li>
                  <li>Date of purchase</li>
                  <li>Reason for refund request</li>
                  <li>Supporting documentation (if applicable)</li>
                </ol>
                <p className="text-sm text-slate-600 mt-4 italic">Our billing team will review your request and respond within 5 business days.</p>
              </div>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <RefreshCcw className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">7. Changes to This Policy</h2>
            </div>

            <div className="ml-13 text-slate-700">
              <p>We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be effective upon posting to this page with an updated "Last Updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.</p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t pt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Contact Us</h2>
            </div>

            <div className="ml-13 bg-slate-50 rounded-lg p-6 space-y-2">
              <p className="text-slate-700">
                For questions about refunds, cancellations, or billing, please contact us:
              </p>
              <div className="space-y-1 text-slate-700">
                <p><strong>Company:</strong> INNOVESTOR</p>
                <p><strong>Refunds Email:</strong> <a href="mailto:refunds@innovestor.com" className="text-primary hover:underline">refunds@innovestor.com</a></p>
                <p><strong>Billing Email:</strong> <a href="mailto:billing@innovestor.com" className="text-primary hover:underline">billing@innovestor.com</a></p>
                <p><strong>Support Email:</strong> <a href="mailto:support@innovestor.com" className="text-primary hover:underline">support@innovestor.com</a></p>
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
