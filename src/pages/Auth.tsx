import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, Shield, Users, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { z } from "zod";
import { connectFirebase } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { authLimiter } from "@/lib/rateLimiter";



const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userType: z.enum(["founder", "investor"]),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "founder" as "founder" | "investor",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, 'Session:', session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        // 🔥 CONNECT FIREBASE (non-blocking)
        try {
          await connectFirebase();
        } catch (e) {
          console.error("Auto-connect Firebase failed:", e);
        }

        // Use the unified check function
        checkProfileAndRedirect(session.user.id);
      }
    });

    // Check current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        console.log("🔄 Existing session found, checking profile...");
        try {
          await connectFirebase();
        } catch (e) {
          console.error("Firebase connect failed:", e);
        }
        checkProfileAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const checkProfileAndRedirect = async (userId: string) => {
    console.log("🔍 Checking profile for user:", userId);

    // Check for returnUrl
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("next");
    if (returnUrl) {
      console.log("↪️ Redirecting to returnUrl:", returnUrl);
      navigate(returnUrl);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    console.log("📋 Profile query result:", { profile, error });

    // Check if there was a query error (not "no rows found")
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = "No rows found" - that's expected if no profile
      // Any other error means the query failed
      console.error("❌ Profile query error:", error);
      toast({
        title: "Error checking profile",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    if (profile) {
      // ✅ Profile exists - go to appropriate dashboard
      console.log("✅ Profile found, redirecting to dashboard");
      if ((profile as { is_admin?: boolean }).is_admin) {
        navigate("/admin-innovestor");
      } else {
        navigate(profile.user_type === "founder" ? "/founder-dashboard" : "/investor-dashboard");
      }
    } else {
      // ❌ No profile found (PGRST116 error or null data)
      console.log("⚠️ No profile found, redirecting to profile setup");
      const { data: { session } } = await supabase.auth.getSession();
      const userType = session?.user?.user_metadata?.user_type || 'founder';
      navigate(`/profile-setup?type=${userType}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side rate limit (belt-and-suspenders; real limit is on the backend)
    if (!authLimiter.allow()) {
      toast({
        title: "Too many attempts",
        description: authLimiter.retryMessage(),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      // ✅ SUPABASE LOGIN SUCCESS
      toast({
        title: "Welcome back!",
        description: "Login successful",
      });

      // 🔥 CONNECT FIREBASE (non-blocking)
      try {
        await connectFirebase();
      } catch (firebaseError: any) {
        console.error("Firebase connection failed:", firebaseError);
        // Only show warning if it's the specific restricted operation error
        if (firebaseError.code === 'auth/admin-restricted-operation') {
          toast({
            title: "Chat Unavailable",
            description: "Please enable 'Anonymous' sign-in in Firebase Console > Authentication.",
            variant: "destructive",
            duration: 10000
          });
        }
      }

    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side rate limit
    if (!authLimiter.allow()) {
      toast({
        title: "Too many attempts",
        description: authLimiter.retryMessage(),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const validated = registerSchema.parse(formData);

      if (!agreedToTerms) {
        toast({
          title: "Agreement required",
          description: "Please accept the Terms & Conditions and Privacy Policy to create an account.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            name: validated.name,
            phone: validated.phone,
            user_type: validated.userType,
          },
        },
      });

      if (error) throw error;

      if (data.session) {

        const userType = validated.userType;
        navigate(`/profile-setup?type=${userType}`);
        toast({
          title: "Account created!",
          description: "Please complete your profile to get started",
        });
      } else if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: "Please verify your email",
          description: "We've sent you a verification link. Check your inbox and click the link to activate your account.",
          duration: 8000
        });
        // Stay on registration page or show a confirmation message
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Left: Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12 relative">
        {/* Subtle background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-yellow/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-charcoal/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[440px] relative z-10">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Logo size="sm" />
              <span className="text-xl font-bold tracking-tight">INNOVESTOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-5">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              {mode === "login"
                ? "Sign in to continue to your dashboard"
                : "Join the community of founders & investors"}
            </p>
          </div>

          {/* Form Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-border/50 shadow-xl shadow-black/[0.03]">
            <CardContent className="p-5 sm:p-7">
              <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
                {mode === "register" && (
                  <>
                    {/* Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`text-foreground ${errors.name ? "border-destructive focus-visible:ring-red-200" : ""}`}
                      />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`text-foreground ${errors.phone ? "border-destructive focus-visible:ring-red-200" : ""}`}
                      />
                      {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                    </div>

                    {/* User Type — Pill Tab Toggle */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">I am a</Label>
                      <div className="flex rounded-full bg-secondary/70 p-1 border-2 border-slate-200">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, userType: "founder" }))}
                          className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${formData.userType === "founder"
                            ? "bg-brand-charcoal text-white shadow-md border-2 border-brand-charcoal"
                            : "text-slate-600 hover:text-foreground hover:bg-white/50"
                            }`}
                        >
                          🚀 Founder
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, userType: "investor" }))}
                          className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${formData.userType === "investor"
                            ? "bg-brand-charcoal text-white shadow-md border-2 border-brand-charcoal"
                            : "text-slate-600 hover:text-foreground hover:bg-white/50"
                            }`}
                        >
                          💰 Investor
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`text-foreground ${errors.email ? "border-destructive focus-visible:ring-red-200" : ""}`}
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`text-foreground ${errors.password ? "border-destructive focus-visible:ring-red-200" : ""} pr-10`}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                {/* Terms agreement + submit — register mode */}
                {mode === "register" && (
                  <>
                    <div className="flex items-start gap-2.5 pt-1">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border accent-brand-charcoal cursor-pointer shrink-0"
                      />
                      <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                        I have read and agree to the{" "}
                        <Link to="/terms-and-conditions" target="_blank" className="font-medium text-foreground underline underline-offset-2 hover:text-brand-yellow transition-colors">
                          Terms &amp; Conditions
                        </Link>
                        {" "}and{" "}
                        <Link to="/privacy-policy" target="_blank" className="font-medium text-foreground underline underline-offset-2 hover:text-brand-yellow transition-colors">
                          Privacy Policy
                        </Link>
                        , including the High Risk Investment Warning and SEBI disclaimer.
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-sm sm:text-base gradient-cta"
                      size="lg"
                      disabled={isLoading || !agreedToTerms}
                    >
                      {isLoading ? "Please wait..." : "Create Account"}
                    </Button>
                  </>
                )}

                {/* Submit — login mode */}
                {mode === "login" && (
                  <Button
                    type="submit"
                    className="w-full h-11 text-sm sm:text-base gradient-cta"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Please wait..." : "Sign In"}
                  </Button>
                )}
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted-foreground">
                    {mode === "login" ? "New here?" : "Already a member?"}
                  </span>
                </div>
              </div>

              {/* Switch mode */}
              <div className="text-center">
                {mode === "login" ? (
                  <Link
                    to="/auth?mode=register"
                    className="inline-flex items-center justify-center w-full h-10 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Create a free account
                  </Link>
                ) : (
                  <Link
                    to="/auth?mode=login"
                    className="inline-flex items-center justify-center w-full h-10 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    Sign in instead
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Right: Branded Panel (hidden on mobile) ─── */}
      <div className="hidden lg:flex w-[480px] xl:w-[540px] bg-brand-charcoal p-10 xl:p-14 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-yellow/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-yellow/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-white text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
            Where ideas meet <br />
            <span className="text-brand-yellow">investment.</span>
          </h2>
          <p className="text-white/70 mt-4 text-sm xl:text-base leading-relaxed max-w-sm">
            Join a curated community of founders and investors building the next generation of startups.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: TrendingUp, text: "Track investments & growth" },
            { icon: Shield, text: "Secure & transparent deals" },
            { icon: Users, text: "Connect with top founders" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-yellow/20 flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-4.5 h-4.5 text-brand-yellow" />
              </div>
              <span className="text-white/90 text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
          <p className="text-white/60 text-xs leading-relaxed italic">
            "INNOVESTOR transformed how we connect with investors. Our funding round closed 3x faster."
          </p>
          <p className="text-white/60 text-xs mt-2">— Early Founder</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
