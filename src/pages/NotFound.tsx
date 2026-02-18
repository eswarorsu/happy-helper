import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-[#111827]">404</h1>
        <p className="mb-6 text-xl text-[#6B7280]">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white rounded-full font-semibold hover:from-[#4F46E5] hover:to-[#6366F1] transition-all shadow-sm">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
