import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import PageLoader from "@/components/ui/PageLoader";

// Lazy-loaded pages
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const FounderDashboard = lazy(() => import("./pages/FounderDashboard"));
const InvestorDashboard = lazy(() => import("./pages/InvestorDashboard"));
const Payment = lazy(() => import("./pages/Payment"));
const SubmitIdea = lazy(() => import("./pages/SubmitIdea"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const Profile = lazy(() => import("./pages/Profile"));
const IdeaDetailPage = lazy(() => import("./pages/IdeaDetailPage"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Transactions = lazy(() => import("./pages/Transactions"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DealCenter = lazy(() => import("./pages/DealCenter"));
const DealCenterIndex = lazy(() => import("./pages/DealCenterIndex"));
const MobileMessages = lazy(() => import("./pages/MobileMessages"));
const MobileChat = lazy(() => import("./pages/MobileChat"));



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/idea/:id" element={<IdeaDetailPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected routes – require authentication */}
              <Route element={<PrivateRoute />}>
                <Route path="/profile-setup" element={<ProfileSetup />} />
                <Route path="/founder-dashboard" element={<FounderDashboard />} />
                <Route path="/investor-dashboard" element={<InvestorDashboard />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/submit-idea" element={<SubmitIdea />} />
                <Route path="/profile/:id?" element={<Profile />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/deal-center/:chatRequestId" element={<DealCenter />} />
                <Route path="/deal-center" element={<DealCenterIndex />} />
                <Route path="/mobile-messages" element={<MobileMessages />} />
                <Route path="/chat/:chatRequestId" element={<MobileChat />} />
              </Route>

              {/* Admin-only route */}
              <Route element={<AdminRoute />}>
                <Route path="/admin-innovestor" element={<AdminPortal />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
