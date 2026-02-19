import React from "react";
import { Link } from "react-router-dom";
import { FileText, Scale, UserCheck, Ban, Shield, AlertTriangle, Mail, Gavel } from "lucide-react";

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#111827]">INNOVESTOR</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-yellow to-brand-charcoal text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Scale className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-lg text-white/80">
            Please read these terms carefully before using our services.
          </p>
          <p className="text-sm text-white/60 mt-4">
            Last Updated: February 19, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-xl border border-white/50 space-y-8">

          {/* Introduction */}
          <section>
            <p className="text-slate-700 leading-relaxed">
              Welcome to INNOVESTOR. These Terms and Conditions ("Terms") govern your access to and use of the INNOVESTOR platform (the "Service"), operated by INNOVESTOR ("we", "our", "us"). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you may not access the Service.
            </p>
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <p className="text-sm text-slate-700">
                <strong>Important Notice:</strong> INNOVESTOR is a SaaS-based startup discovery and networking platform. We <strong>DO NOT</strong> facilitate direct investments, handle funds, or act as a financial intermediary. All investment decisions and transactions occur independently between users.
              </p>
            </div>

            {/* SEBI Disclaimer */}
            <div className="mt-4 p-5 bg-orange-50 border-2 border-orange-400 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-orange-800 mb-1">Regulatory Disclaimer</p>
                  <p className="text-sm text-slate-700">
                    <strong>INNOVESTOR is NOT a SEBI-registered investment adviser, broker, dealer, portfolio manager, or research analyst</strong> under the Securities and Exchange Board of India (SEBI) Act, 1992, or any rules and regulations framed thereunder. Nothing on this platform constitutes investment advice, a solicitation, or a recommendation to buy, sell, or hold any security or financial instrument. Users should consult a SEBI-registered investment adviser or other qualified financial professional before making any investment decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* High Risk Warning */}
            <div className="mt-4 p-5 bg-red-50 border-2 border-red-500 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-red-800 mb-1">⚠️ HIGH RISK INVESTMENT WARNING</p>
                  <p className="text-sm text-slate-700">
                    Investing in early-stage startups is <strong>speculative and carries an extremely high level of risk</strong>. You may lose some or all of your invested capital. Past performance of any startup or founder profile on this platform is not indicative of future results. Key risks include, but are not limited to: business failure, lack of liquidity, dilution, regulatory changes, and fraud. You should not invest money that you cannot afford to lose. Diversification does not guarantee a profit or protect against loss. Please read all risk factors carefully and seek independent advice before investing.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
            </div>

            <div className="ml-13 space-y-3 text-slate-700">
              <p>By creating an account or using any part of our Service, you confirm that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You are at least 18 years of age</li>
                <li>You have the legal capacity to enter into binding contracts</li>
                <li>You will comply with all applicable laws and regulations</li>
                <li>All information you provide is accurate, current, and complete</li>
              </ul>
            </div>
          </section>

          {/* Service Description */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-yellow" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">2. Service Description</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">2.1 Platform Purpose</h3>
                <p className="text-slate-700">INNOVESTOR provides a digital platform that enables:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Founders to showcase their startups, business ideas, and projects</li>
                  <li>Investors to discover and connect with potential investment opportunities</li>
                  <li>Secure, encrypted communication between founders and investors</li>
                  <li>Profile management and networking capabilities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">2.2 Limitations of Service</h3>
                <p className="text-slate-700 mb-2">We explicitly DO NOT:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700">
                  <li>Process or handle investment funds or financial transactions</li>
                  <li>Provide investment advice, financial planning, or legal counsel</li>
                  <li>Guarantee the accuracy of user-submitted information</li>
                  <li>Endorse, verify, or validate any startup or investment opportunity</li>
                  <li>Act as a broker, dealer, or registered investment advisor</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-brand-yellow" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">3. User Accounts and Responsibilities</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">3.1 Account Creation</h3>
                <p className="text-slate-700">You must create an account to access certain features. You agree to:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your password and account credentials</li>
                  <li>Notify us immediately of any unauthorized access or security breach</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">3.2 Founder Responsibilities</h3>
                <p className="text-slate-700">If you are a founder, you agree to:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Provide truthful and accurate information about your startup</li>
                  <li>Not misrepresent your business, financials, or track record</li>
                  <li>Respect intellectual property rights and confidentiality</li>
                  <li>Conduct all business dealings ethically and legally</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">3.3 Investor Responsibilities</h3>
                <p className="text-slate-700">If you are an investor, you agree to:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                  <li>Conduct your own due diligence before making investment decisions</li>
                  <li>Understand that all investments carry risk</li>
                  <li>Not rely solely on information provided through the platform</li>
                  <li>Seek independent professional advice when necessary</li>
                  <li>Comply with all applicable securities laws and regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Conduct */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">4. Prohibited Conduct</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700 mb-2">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws, regulations, or third-party rights</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Distribute viruses, malware, or other harmful code</li>
                <li>Scrape, spider, or use automated tools to access the Service</li>
                <li>Interfere with or disrupt the Service's operation</li>
                <li>Impersonate any person or entity</li>
                <li>Use the Service to solicit for other business purposes</li>
                <li>Post or transmit spam, chain letters, or pyramid schemes</li>
              </ul>
            </div>
          </section>

          {/* Subscription and Payments */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">5. Subscription and Payments</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">5.1 Subscription Plans</h3>
                <p className="text-slate-700">Access to certain premium features requires a paid subscription. Pricing and features are subject to change with prior notice.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">5.2 Payment Terms</h3>
                <ul className="list-disc pl-6 space-y-1 text-slate-700">
                  <li>All fees are in Indian Rupees (INR) unless otherwise stated</li>
                  <li>Payments are processed securely through third-party payment gateways</li>
                  <li>We do not store your complete payment card information</li>
                  <li>Subscriptions automatically renew unless canceled</li>
                  <li>You are responsible for paying all applicable taxes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">5.3 Cancellation</h3>
                <p className="text-slate-700">You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period. No partial refunds are provided for unused time.</p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">6. Intellectual Property Rights</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">6.1 Our Rights</h3>
                <p className="text-slate-700">All content, features, and functionality of the Service (including logos, design, text, graphics, and software) are owned by INNOVESTOR and are protected by copyright, trademark, and other intellectual property laws.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">6.2 User Content</h3>
                <p className="text-slate-700">You retain ownership of content you submit. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for the purpose of operating and promoting the Service.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">6.3 Feedback</h3>
                <p className="text-slate-700">Any feedback, suggestions, or ideas you provide become our property, and we may use them without compensation or attribution.</p>
              </div>
            </div>
          </section>

          {/* Disclaimers */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">7. Disclaimers and Limitation of Liability</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">7.1 "As Is" Service</h3>
                <p className="text-slate-700">The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or secure.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">7.2 Investment Risk</h3>
                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
                  <p className="text-sm text-slate-700">
                    <strong className="text-red-700">WARNING:</strong> Investing in startups is highly risky and can result in total loss of capital. We do not guarantee returns, verify claims, or endorse any opportunity. You are solely responsible for your investment decisions.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">7.3 Limitation of Liability</h3>
                <p className="text-slate-700">To the maximum extent permitted by law, INNOVESTOR shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangibles, arising from your use of the Service.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">7.4 User Interactions</h3>
                <p className="text-slate-700">We are not responsible for the conduct of users or the content they post. Any disputes between users must be resolved directly between the parties involved.</p>
              </div>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">8. Indemnification</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700">You agree to indemnify and hold harmless INNOVESTOR, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700 mt-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Content you submit or share</li>
              </ul>
            </div>
          </section>

          {/* Termination */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Ban className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">9. Termination</h2>
            </div>

            <div className="ml-13 space-y-3 text-slate-700">
              <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Prolonged inactivity</li>
                <li>Any other reason at our sole discretion</li>
              </ul>
              <p className="mt-3">Upon termination, your right to use the Service will immediately cease. Provisions that by their nature should survive termination will remain in effect.</p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">10. Governing Law and Dispute Resolution</h2>
            </div>

            <div className="ml-13 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">10.1 Governing Law</h3>
                <p className="text-slate-700">These Terms are governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">10.2 Jurisdiction</h3>
                <p className="text-slate-700">You agree to submit to the exclusive jurisdiction of the courts located in Visakhapatnam, Andhra Pradesh, India for resolution of any disputes.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">10.3 Dispute Resolution</h3>
                <p className="text-slate-700">Before filing a lawsuit, you agree to first contact us at <a href="mailto:legal@innovestor.com" className="text-primary hover:underline">legal@innovestor.com</a> to attempt to resolve the dispute informally.</p>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-yellow" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">11. Changes to These Terms</h2>
            </div>

            <div className="ml-13 text-slate-700">
              <p>We reserve the right to modify these Terms at any time. We will notify you of significant changes by:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Posting the updated Terms on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification (for material changes)</li>
              </ul>
              <p className="mt-3">Your continued use of the Service after changes constitute acceptance of the new Terms.</p>
            </div>
          </section>

          {/* Miscellaneous */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">12. Miscellaneous</h2>
            </div>

            <div className="ml-13 space-y-2 text-slate-700">
              <p><strong>Severability:</strong> If any provision is found to be unenforceable, the remaining provisions will continue in full effect.</p>
              <p><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and INNOVESTOR.</p>
              <p><strong>No Waiver:</strong> Our failure to enforce any right or provision does not constitute a waiver of such right.</p>
              <p><strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent.</p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t pt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
            </div>

            <div className="ml-13 bg-background rounded-lg p-6 space-y-2">
              <p className="text-slate-700">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="space-y-1 text-slate-700">
                <p><strong>Company:</strong> INNOVESTOR</p>
                <p><strong>Email:</strong> <a href="mailto:legal@innovestor.com" className="text-primary hover:underline">legal@innovestor.com</a></p>
                <p><strong>Support:</strong> <a href="mailto:support@innovestor.com" className="text-primary hover:underline">support@innovestor.com</a></p>
                <p><strong>Address:</strong> Vizag, Andhra Pradesh, India – 530001</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-600">
            © 2026 INNOVESTOR. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <Link to="/privacy-policy" className="text-slate-600 hover:text-primary hover:underline">Privacy Policy</Link>
            <span className="text-slate-400">|</span>
            <Link to="/terms-and-conditions" className="text-primary hover:underline">Terms & Conditions</Link>
            <span className="text-slate-400">|</span>
            <Link to="/refund-policy" className="text-slate-600 hover:text-primary hover:underline">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsAndConditions;
