import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Rocket, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { connectFirebase } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";



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
    setIsLoading(true);
    setErrors({});

    try {
      const validated = registerSchema.parse(formData);

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
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fc] to-[#e2e8f0] text-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="glass border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to your INNOVESTOR account"
                : "Join the INNOVESTOR community"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label>I am a</Label>
                    <RadioGroup
                      value={formData.userType}
                      onValueChange={(value: "founder" | "investor") =>
                        setFormData((prev) => ({ ...prev, userType: value }))
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <RadioGroupItem value="founder" id="founder" />
                        <Label htmlFor="founder" className="cursor-pointer flex-1 p-3 rounded-lg border hover:bg-muted transition-colors">
                          Founder
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 flex-1">
                        <RadioGroupItem value="investor" id="investor" />
                        <Label htmlFor="investor" className="cursor-pointer flex-1 p-3 rounded-lg border hover:bg-muted transition-colors">
                          Investor
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Link to="/auth?mode=register" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link to="/auth?mode=login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
