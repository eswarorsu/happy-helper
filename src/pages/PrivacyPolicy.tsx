import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-700">
      <h1 className="text-3xl font-semibold mb-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">
        Last updated: January 2026
      </p>

      <p className="mb-4">
        Innovest (“we”, “our”, “us”) operates the Innovest platform (“Service”).
        This Privacy Policy explains how we collect, use, disclose, and protect
        your information when you use our website.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        1. Information We Collect
      </h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Personal details such as name, email address, and contact details</li>
        <li>Account information provided during registration</li>
        <li>Usage data such as pages visited and interactions</li>
        <li>Payment details processed securely by third-party gateways</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        Contact Us
      </h2>
      <p>
        Email: support@innovestor.com <br />
        Address: Vizag, Andhra Pradesh, India – 530001
      </p>
    </div>
  );
};

export default PrivacyPolicy;

