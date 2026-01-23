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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        checkProfileAndRedirect(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkProfileAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileAndRedirect = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profile) {
      if (profile.is_admin) {
        navigate("/admin-innovestor");
      } else {
        navigate(profile.user_type === "founder" ? "/founder-dashboard" : "/investor-dashboard");
      }
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
      const validated = loginSchema.parse({
        email: formData.email,
        password: formData.password,
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) throw error;

      toast({ title: "Welcome back!", description: "Login successful" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Login failed",
          description: error.message || "Please check your credentials",
          variant: "destructive",
        });
      }
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
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: validated.name,
            phone: validated.phone,
            user_type: validated.userType,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        navigate(`/profile-setup?type=${validated.userType}`);
      }

      toast({ title: "Account created!", description: "Please complete your profile" });
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <Card className="glass border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4"><div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"><Rocket className="w-7 h-7 text-primary-foreground" /></div></div>
            <CardTitle className="text-2xl">{mode === "login" ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>{mode === "login" ? "Sign in to your account" : "Join the INNOVESTOR community"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+1..." value={formData.phone} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-3">
                    <Label>User Type</Label>
                    <RadioGroup value={formData.userType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, userType: value }))} className="flex gap-4">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="founder" id="founder" /><Label htmlFor="founder">Founder</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="investor" id="investor" /><Label htmlFor="investor">Investor</Label></div>
                    </RadioGroup>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>{isLoading ? "Processing..." : mode === "login" ? "Sign In" : "Sign Up"}</Button>
            </form>
            <div className="mt-6 text-center text-sm">
                <Link to={mode === "login" ? "/auth?mode=register" : "/auth?mode=login"} className="text-indigo-600 hover:underline">
                    {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Auth;
