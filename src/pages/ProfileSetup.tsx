import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Rocket, User, Briefcase } from "lucide-react";
import { z } from "zod";

const founderSchema = z.object({
  name: z.string().min(2).max(100),
  dob: z.string().min(1, "Date of birth is required"),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  education: z.string().min(2, "Education is required"),
  experience: z.string().min(2, "Experience is required"),
  currentJob: z.string().min(2, "Current job is required"),
  linkedinProfile: z.string().url("Must be a valid URL").or(z.literal("")),
  domain: z.string().min(2, "Domain is required"),
});

const investorSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  education: z.string().min(2, "Education is required"),
  investmentCapital: z.string().min(1, "Investment capital is required"),
  interestedDomains: z.string().min(2, "Interested domains are required"),
});

const ProfileSetup = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") as "founder" | "investor";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    email: "",
    phone: "",
    education: "",
    experience: "",
    currentJob: "",
    linkedinProfile: "",
    domain: "",
    investmentCapital: "",
    interestedDomains: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth?mode=register");
        return;
      }
      setUserId(session.user.id);

      // Pre-fill with user metadata
      const metadata = session.user.user_metadata;
      setFormData((prev) => ({
        ...prev,
        name: metadata?.name || "",
        email: session.user.email || "",
        phone: metadata?.phone || "",
      }));
    };
    getUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    setErrors({});

    try {
      let validated;
      if (userType === "founder") {
        validated = founderSchema.parse(formData);
      } else {
        validated = investorSchema.parse(formData);
      }

      const profileData: any = {
        user_id: userId,
        user_type: userType,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        education: formData.education,
      };

      if (userType === "founder") {
        profileData.dob = formData.dob;
        profileData.experience = formData.experience;
        profileData.current_job = formData.currentJob;
        profileData.linkedin_profile = formData.linkedinProfile || null;
        profileData.domain = formData.domain;
      } else {
        profileData.investment_capital = parseFloat(formData.investmentCapital);
        profileData.interested_domains = formData.interestedDomains.split(",").map((d) => d.trim());
      }

      const { error } = await supabase.from("profiles").insert(profileData);

      if (error) throw error;

      toast({ title: "Profile created!", description: "Welcome to INNOVESTOR" });
      navigate(userType === "founder" ? "/founder-dashboard" : "/investor-dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create profile",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!userType || !["founder", "investor"].includes(userType)) {
    navigate("/auth?mode=register");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fc] to-[#e2e8f0] text-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Card className="glass border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                {userType === "founder" ? (
                  <Rocket className="w-7 h-7 text-primary-foreground" />
                ) : (
                  <Briefcase className="w-7 h-7 text-primary-foreground" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {userType === "founder" ? "Founder Profile" : "Investor Profile"}
            </CardTitle>
            <CardDescription>
              Complete your profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                {userType === "founder" && (
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className={errors.dob ? "border-destructive" : ""}
                    />
                    {errors.dob && <p className="text-sm text-destructive">{errors.dob}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    name="education"
                    placeholder="e.g., B.Tech in Computer Science"
                    value={formData.education}
                    onChange={handleInputChange}
                    className={errors.education ? "border-destructive" : ""}
                  />
                  {errors.education && <p className="text-sm text-destructive">{errors.education}</p>}
                </div>

                {userType === "founder" ? (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="experience">Experience</Label>
                      <Textarea
                        id="experience"
                        name="experience"
                        placeholder="Describe your work experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className={errors.experience ? "border-destructive" : ""}
                      />
                      {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentJob">Current Job</Label>
                      <Input
                        id="currentJob"
                        name="currentJob"
                        placeholder="e.g., Software Engineer at Google"
                        value={formData.currentJob}
                        onChange={handleInputChange}
                        className={errors.currentJob ? "border-destructive" : ""}
                      />
                      {errors.currentJob && <p className="text-sm text-destructive">{errors.currentJob}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedinProfile">LinkedIn Profile (Optional)</Label>
                      <Input
                        id="linkedinProfile"
                        name="linkedinProfile"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedinProfile}
                        onChange={handleInputChange}
                        className={errors.linkedinProfile ? "border-destructive" : ""}
                      />
                      {errors.linkedinProfile && <p className="text-sm text-destructive">{errors.linkedinProfile}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="domain">Domain of Sharing Ideas</Label>
                      <Input
                        id="domain"
                        name="domain"
                        placeholder="e.g., FinTech, HealthTech, EdTech"
                        value={formData.domain}
                        onChange={handleInputChange}
                        className={errors.domain ? "border-destructive" : ""}
                      />
                      {errors.domain && <p className="text-sm text-destructive">{errors.domain}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="investmentCapital">Investment Capital ($)</Label>
                      <Input
                        id="investmentCapital"
                        name="investmentCapital"
                        type="number"
                        placeholder="e.g., 100000"
                        value={formData.investmentCapital}
                        onChange={handleInputChange}
                        className={errors.investmentCapital ? "border-destructive" : ""}
                      />
                      {errors.investmentCapital && <p className="text-sm text-destructive">{errors.investmentCapital}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interestedDomains">Interested Domains</Label>
                      <Input
                        id="interestedDomains"
                        name="interestedDomains"
                        placeholder="FinTech, HealthTech, EdTech (comma separated)"
                        value={formData.interestedDomains}
                        onChange={handleInputChange}
                        className={errors.interestedDomains ? "border-destructive" : ""}
                      />
                      {errors.interestedDomains && <p className="text-sm text-destructive">{errors.interestedDomains}</p>}
                    </div>
                  </>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Creating Profile..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
