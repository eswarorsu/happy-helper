import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import Logo from "@/components/ui/Logo";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    // When the user clicks the email link, Supabase appends an access token fragment.
    // The Supabase client intercepts this and logs them in temporarily for the recovery.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionVerified(true);
      } else {
        // Double-check with a listener if the session takes a moment to establish
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
          if (event === "PASSWORD_RECOVERY" || _session) {
            setSessionVerified(true);
          }
        });
        return () => subscription.unsubscribe();
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // Because the user has a temporary recovery session, we can simply update the user.
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      toast({
        title: "Password updated successfully!",
        description: "You have been logged in. Redirecting to your dashboard...",
      });

      // Clear the fragment from the URL cleanly
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect them back to auth (which will detect the new active session and auto-route them)
      navigate("/auth?mode=login");

    } catch (err: any) {
      toast({
        title: "Failed to update password",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-yellow/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-charcoal/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-5 sm:mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold tracking-tight mt-4 sm:mt-6">Reset Your Password</h1>
          <p className="text-muted-foreground text-center text-sm mt-2 max-w-[280px]">
            Please enter a strong new password below to secure your INNOVESTOR account.
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-md border-border/50 shadow-2xl shadow-brand-charcoal/5">
          <CardContent className="p-7">
            {!sessionVerified ? (
              <div className="py-5 sm:py-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-600 font-medium">Verifying secure reset link...</p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                {/* Visual Security Indicator */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                    Secure session established. You may now safely update your password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="pr-10 h-11 border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    className="h-11 border-slate-200 focus:border-brand-yellow focus:ring-brand-yellow/20 transition-all font-medium"
                  />
                  {error && <p className="text-xs text-destructive font-semibold tracking-tight mt-2 flex items-center gap-1">❌ {error}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-bold shadow-lg shadow-brand-charcoal/10 hover:shadow-brand-charcoal/20 transition-all duration-300 gradient-cta"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating securely..." : "Confirm & Login"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
