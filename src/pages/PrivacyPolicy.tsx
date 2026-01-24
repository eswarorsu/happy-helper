import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Database, Users, Mail, FileText, AlertCircle } from "lucide-react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fc] to-[#e2e8f0]">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">INNOVESTOR</span>
          </Link>
          <Link to="/" className="text-sm text-slate-600 hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-blue-100">
            Your privacy is critically important to us. We're committed to protecting your personal information.
          </p>
          <p className="text-sm text-blue-200 mt-4">
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
              INNOVESTOR ("we", "our", "us") operates the INNOVESTOR platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">1. Information We Collect</h2>
            </div>

            <div className="space-y-4 ml-13">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">1.1 Personal Information</h3>
                <p className="text-slate-700 mb-2">We may collect personally identifiable information that you voluntarily provide to us when you:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700">
                  <li>Register for an account (name, email address, phone number)</li>
                  <li>Create a founder or investor profile (company details, investment preferences, business plans)</li>
                  <li>Subscribe to our services or make payments (billing information)</li>
                  <li>Communicate with us via contact forms or support channels</li>
                  <li>Participate in surveys, contests, or promotional activities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">1.2 Automatically Collected Information</h3>
                <p className="text-slate-700 mb-2">When you access our Service, we may automatically collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-slate-700">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, clickstream data)</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Location data (based on IP address)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">1.3 Third-Party Information</h3>
                <p className="text-slate-700">We may receive information about you from third-party sources such as social media platforms (if you choose to link your account), payment processors, and business verification services.</p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">2. How We Use Your Information</h2>
            </div>

            <div className="ml-13 space-y-2">
              <p className="text-slate-700 mb-2">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>To provide and maintain our Service:</strong> Creating and managing your account, processing transactions, and delivering requested features</li>
                <li><strong>To facilitate connections:</strong> Matching founders with relevant investors based on preferences and criteria</li>
                <li><strong>To improve our Service:</strong> Analyzing usage patterns, conducting research, and developing new features</li>
                <li><strong>To communicate with you:</strong> Sending notifications, updates, newsletters, and responding to inquiries</li>
                <li><strong>To ensure security:</strong> Detecting and preventing fraud, unauthorized access, and other illegal activities</li>
                <li><strong>To comply with legal obligations:</strong> Meeting regulatory requirements and responding to legal requests</li>
                <li><strong>To personalize your experience:</strong> Customizing content and recommendations based on your activity</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">3. How We Share Your Information</h2>
            </div>

            <div className="ml-13 space-y-3">
              <p className="text-slate-700">We may share your information in the following circumstances:</p>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">3.1 With Other Users</h3>
                <p className="text-slate-700">Certain profile information (such as your name, company details, and pitch) may be visible to other users (founders or investors) to facilitate connections.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">3.2 Service Providers</h3>
                <p className="text-slate-700">We may share information with third-party vendors who perform services on our behalf (payment processing, email delivery, analytics, hosting).</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">3.3 Business Transfers</h3>
                <p className="text-slate-700">In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">3.4 Legal Requirements</h3>
                <p className="text-slate-700">We may disclose your information if required by law, court order, or governmental request, or to protect our rights and safety.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">3.5 With Your Consent</h3>
                <p className="text-slate-700">We may share your information for any other purpose with your explicit consent.</p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">4. Data Security</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700 mb-3">We implement industry-standard security measures to protect your personal information, including:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700">
                <li>Encryption of data in transit and at rest (SSL/TLS)</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and employee training</li>
                <li>Secure cloud infrastructure with Supabase</li>
              </ul>
              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-slate-700">
                    <strong>Important:</strong> While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">5. Your Privacy Rights</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700 mb-2">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                <li><strong>Objection:</strong> Object to processing of your information for certain purposes</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
              </ul>
              <p className="text-slate-700 mt-3">To exercise these rights, please contact us at <a href="mailto:privacy@innovestor.com" className="text-primary hover:underline font-medium">privacy@innovestor.com</a>.</p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">6. Cookies and Tracking Technologies</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700 mb-2">We use cookies and similar technologies to enhance your experience. You can manage cookie preferences through your browser settings. Types of cookies we use:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-700">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Performance Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Marketing Cookies:</strong> Track your activity to deliver personalized advertisements</li>
              </ul>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">7. Data Retention</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700">We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.</p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">8. Children's Privacy</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700">Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
            </div>
          </section>

          {/* International Transfers */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">9. International Data Transfers</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700">Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.</p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">10. Changes to This Privacy Policy</h2>
            </div>

            <div className="ml-13">
              <p className="text-slate-700">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>
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
                If you have any questions or concerns about this Privacy Policy, please contact us:
              </p>
              <div className="space-y-1 text-slate-700">
                <p><strong>Company:</strong> INNOVESTOR</p>
                <p><strong>Email:</strong> <a href="mailto:privacy@innovestor.com" className="text-primary hover:underline">privacy@innovestor.com</a></p>
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
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
            <span className="text-slate-400">|</span>
            <Link to="/terms-and-conditions" className="text-slate-600 hover:text-primary hover:underline">Terms & Conditions</Link>
            <span className="text-slate-400">|</span>
            <Link to="/refund-policy" className="text-slate-600 hover:text-primary hover:underline">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
