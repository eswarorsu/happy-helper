import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import FounderDashboard from "./pages/FounderDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import Payment from "./pages/Payment";
import SubmitIdea from "./pages/SubmitIdea";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import AdminPortal from "./pages/AdminPortal";
import Profile from "./pages/Profile";
import IdeaDetailPage from "./pages/IdeaDetailPage";
import Marketplace from "./pages/Marketplace";
import Transactions from "./pages/Transactions";
import DealCenter from "./pages/DealCenter";
import DealCenterIndex from "./pages/DealCenterIndex";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/idea/:id" element={<IdeaDetailPage />} />

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
          </Route>

          {/* Admin-only route */}
          <Route element={<AdminRoute />}>
            <Route path="/admin-innovestor" element={<AdminPortal />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
