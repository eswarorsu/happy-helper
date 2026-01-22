const TermsAndConditions = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-700">
      <h1 className="text-3xl font-semibold mb-6">Terms & Conditions</h1>

      <p className="mb-4">
        Innovest is a SaaS-based startup discovery and networking platform.
        We do not facilitate investments or handle funds.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        User Responsibilities
      </h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Provide accurate information</li>
        <li>Use the platform lawfully</li>
        <li>Do not misuse services</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Governing Law
      </h2>
      <p>These terms are governed by the laws of India.</p>

      <p className="mt-6">
        Email: support@innovestor.com <br />
        Address: Vizag, Andhra Pradesh, India – 530001
      </p>
    </div>
  );
};

export default TermsAndConditions;
