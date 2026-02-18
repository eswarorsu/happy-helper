import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    User, Mail, Phone, Briefcase, GraduationCap, Linkedin,
    ArrowLeft, ShieldCheck, Globe, Building2, Target, Rocket, DollarSign, ThumbsUp, Pencil
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Profile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { id: profileId } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [trustScore, setTrustScore] = useState({ total: 0, positive: 0, percentage: 0 });
    const [isAdminViewport, setIsAdminViewport] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth");
                return;
            }

            // If we have a profile ID in the URL, check if current user is admin
            let targetUserId = profileId || session.user.id;

            if (profileId && profileId !== session.user.id) {
                const { data: currentUserProfile } = await supabase
                    .from("profiles")
                    .select("is_admin")
                    .eq("user_id", session.user.id)
                    .single();

                if (!currentUserProfile?.is_admin) {
                    toast({ title: "Access Denied", description: "You don't have permission to view this profile", variant: "destructive" });
                    navigate("/");
                    return;
                }
                setIsAdminViewport(true);
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq(profileId ? "id" : "user_id", targetUserId)
                .single();

            if (error) {
                toast({ title: "Error", description: "Could not load profile", variant: "destructive" });
                return;
            }

            setProfile(data);

            // Fetch Trust Score for Investors
            if (data.user_type === "investor") {
                const { data: ratingsData } = await supabase
                    .from("investor_ratings")
                    .select("rating")
                    .eq("investor_id", data.id);

                if (ratingsData && ratingsData.length > 0) {
                    const positiveCount = ratingsData.filter(r => r.rating === true).length;
                    const percentage = Math.round((positiveCount / ratingsData.length) * 100);
                    setTrustScore({
                        total: ratingsData.length,
                        positive: positiveCount,
                        percentage
                    });
                }
            }

            setLoading(false);
        };

        fetchProfile();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-border border-t-brand-charcoal rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Loading profile...</p>
            </div>
        </div>
    );

    if (!profile) return null;

    const isFounder = profile.user_type === "founder";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo size="sm" />
                        <div>
                            <h1 className="text-lg font-bold text-foreground tracking-tight">INNOVESTOR</h1>
                            <p className="text-xs text-muted-foreground font-medium">Profile</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => isAdminViewport ? navigate("/admin-innovestor") : navigate(isFounder ? "/founder-dashboard" : "/investor-dashboard")}
                        className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to {isAdminViewport ? "Admin Portal" : "Dashboard"}
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid md:grid-cols-3 gap-8">

                    {/* Left Column: Identity Card */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border border-slate-200 shadow-sm overflow-hidden rounded-3xl bg-white">
                            {/* Header Banner */}
                            <div className="h-24 bg-brand-yellow" />

                            <CardContent className="pt-0 pb-6 px-6 -mt-12 relative">
                                <Avatar className="w-20 h-20 border-4 border-white shadow-lg mx-auto">
                                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-bold bg-brand-yellow/20 text-brand-charcoal">
                                        {profile.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="text-center mt-4 space-y-2">
                                    <h1 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
                                        {profile.name}
                                        {/* Edit Button for Owner */}
                                        {!isAdminViewport && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/profile-setup?type=${profile.user_type}&mode=edit`)}
                                                className="h-6 w-6 p-0 rounded-full hover:bg-brand-yellow/20 text-slate-400 hover:text-brand-charcoal transition-colors"
                                                title="Edit Profile"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </h1>
                                    <p className="text-sm text-slate-500">{profile.current_job || "Member"}</p>

                                    <div className="flex justify-center gap-2 flex-wrap">
                                        {profile.is_approved && (
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                                                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="border-border text-muted-foreground">
                                            {isFounder ? <User className="w-3 h-3 mr-1" /> : <Briefcase className="w-3 h-3 mr-1" />}
                                            {isFounder ? "Founder" : "Investor"}
                                        </Badge>
                                    </div>

                                    {!isFounder && (
                                        <div className="pt-4 flex flex-col items-center">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${trustScore.percentage >= 70 ? 'bg-green-50 text-green-600' :
                                                trustScore.percentage >= 40 ? 'bg-amber-50 text-amber-600' :
                                                    'bg-secondary text-muted-foreground'
                                                }`}>
                                                <ThumbsUp size={12} />
                                                <span>Trust Score: {trustScore.total > 0 ? `${trustScore.percentage}%` : "New"}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {trustScore.total > 0 ? `${trustScore.positive}/${trustScore.total} positive ratings` : "No ratings yet"}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Social Links */}
                                <div className="mt-6 space-y-2">
                                    {profile.linkedin_profile && (
                                        <a
                                            href={profile.linkedin_profile}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full h-10 bg-[#0077b5]/10 text-[#0077b5] rounded-lg font-medium text-sm hover:bg-[#0077b5]/20 transition-colors"
                                        >
                                            <Linkedin className="w-4 h-4" /> LinkedIn
                                        </a>
                                    )}
                                    {profile.website_url && (
                                        <a
                                            href={profile.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full h-10 bg-brand-yellow/10 text-slate-700 rounded-lg font-medium text-sm hover:bg-brand-yellow/20 transition-colors"
                                        >
                                            <Globe className="w-4 h-4" /> Website
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Info Card */}
                        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-9 h-9 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-slate-400 font-medium">Email</p>
                                        <p className="text-slate-800 font-medium truncate">{profile.email}</p>
                                    </div>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-9 h-9 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Phone</p>
                                            <p className="text-slate-800 font-medium">{profile.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white">
                            <CardHeader className="border-b border-border/60">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-brand-charcoal" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-semibold text-foreground">Professional Profile</CardTitle>
                                        <p className="text-sm text-slate-500">Your professional journey and expertise</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Experience */}
                                {profile.experience && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                            <Briefcase className="w-4 h-4" /> Experience
                                        </div>
                                        <div className="p-4 bg-secondary rounded-xl border border-border/60">
                                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                                {profile.experience}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Education & Domain */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {profile.education && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                                <GraduationCap className="w-4 h-4" /> Education
                                            </div>
                                            <div className="p-4 bg-white rounded-xl border border-border">
                                                <p className="font-semibold text-foreground">{profile.education}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile.domain && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                                <Globe className="w-4 h-4" /> Domain
                                            </div>
                                            <div className="p-4 bg-white rounded-xl border border-border">
                                                <Badge variant="outline" className="border-border text-foreground bg-secondary">
                                                    {profile.domain}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Investment Details (Investors Only) */}
                                {!isFounder && (
                                    <div className="pt-4 border-t border-border/60 space-y-6">
                                        {profile.interested_domains && profile.interested_domains.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                                    <Target className="w-4 h-4" /> Interested Sectors
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.interested_domains.map((domain: string) => (
                                                        <Badge key={domain} variant="secondary" className="bg-brand-yellow/10 text-slate-700 hover:bg-brand-yellow/20 border-none px-3 py-1 font-semibold rounded-lg">
                                                            {domain}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {profile.investment_capital && (
                                            <div className="space-y-3 pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                                    <DollarSign className="w-4 h-4" /> Investment Capacity
                                                </div>
                                                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                                                    <p className="text-3xl font-black text-emerald-700">
                                                        ₹{profile.investment_capital.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-emerald-600 font-medium mt-1">Ready to deploy capital</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
