import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    try {
      const validated = loginSchema.parse({ email: formData.email, password: formData.password });
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });
      if (error) throw error;
      toast({ title: "Welcome back!", description: "Login successful" });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = registerSchema.parse(formData);
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: { name: validated.name, phone: validated.phone, user_type: validated.userType },
        },
      });
      if (error) throw error;
      if (data.user) navigate(`/profile-setup?type=${validated.userType}`);
      toast({ title: "Account created!", description: "Please complete your profile" });
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // UI remains exactly as you had it - just added the redirection logic above
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fc] to-[#e2e8f0] text-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <Card className="glass border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Rocket className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">{mode === "login" ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>{mode === "login" ? "Sign in to your account" : "Join the community"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-3">
                    <Label>I am a</Label>
                    <RadioGroup value={formData.userType} onValueChange={(v: "founder"|"investor") => setFormData(p => ({...p, userType:v}))} className="flex gap-4">
                      <div className="flex items-center space-x-2 flex-1"><RadioGroupItem value="founder" id="founder" /><Label htmlFor="founder">Founder</Label></div>
                      <div className="flex items-center space-x-2 flex-1"><RadioGroupItem value="investor" id="investor" /><Label htmlFor="investor">Investor</Label></div>
                    </RadioGroup>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link to={mode === "login" ? "/auth?mode=register" : "/auth?mode=login"} className="text-primary hover:underline font-medium">
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

