import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    User, Mail, Phone, Briefcase, GraduationCap, Linkedin,
    ArrowLeft, ShieldCheck, Globe, Building2, Target, Rocket
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Profile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/auth");
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", session.user.id)
                .single();

            if (error) {
                toast({ title: "Error", description: "Could not load profile", variant: "destructive" });
                return;
            }

            setProfile(data);
            setLoading(false);
        };

        fetchProfile();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Loading profile...</p>
            </div>
        </div>
    );

    if (!profile) return null;

    const isFounder = profile.user_type === "founder";

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">INNOVESTOR</h1>
                            <p className="text-xs text-slate-500 font-medium">Profile</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(isFounder ? "/founder-dashboard" : "/investor-dashboard")}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid md:grid-cols-3 gap-8">

                    {/* Left Column: Identity Card */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border border-slate-200 shadow-sm overflow-hidden">
                            {/* Header Banner */}
                            <div className="h-24 bg-slate-900" />

                            <CardContent className="pt-0 pb-6 px-6 -mt-12 relative">
                                <Avatar className="w-20 h-20 border-4 border-white shadow-lg mx-auto">
                                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-bold bg-slate-100 text-slate-600">
                                        {profile.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="text-center mt-4 space-y-2">
                                    <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
                                    <p className="text-sm text-slate-500">{profile.current_job || "Member"}</p>

                                    <div className="flex justify-center gap-2 flex-wrap">
                                        {profile.is_approved && (
                                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                                                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                                            {isFounder ? <User className="w-3 h-3 mr-1" /> : <Briefcase className="w-3 h-3 mr-1" />}
                                            {isFounder ? "Founder" : "Investor"}
                                        </Badge>
                                    </div>
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
                                            className="flex items-center justify-center gap-2 w-full h-10 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                                        >
                                            <Globe className="w-4 h-4" /> Website
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Info Card */}
                        <Card className="border border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-slate-400 font-medium">Email</p>
                                        <p className="text-slate-800 font-medium truncate">{profile.email}</p>
                                    </div>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
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
                        <Card className="border border-slate-200 shadow-sm">
                            <CardHeader className="border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-semibold text-slate-900">Professional Profile</CardTitle>
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
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
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
                                            <div className="p-4 bg-white rounded-xl border border-slate-200">
                                                <p className="font-semibold text-slate-900">{profile.education}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile.domain && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                                <Globe className="w-4 h-4" /> Domain
                                            </div>
                                            <div className="p-4 bg-white rounded-xl border border-slate-200">
                                                <Badge variant="outline" className="border-slate-200 text-slate-700 bg-slate-50">
                                                    {profile.domain}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Investment Capacity (Investors Only) */}
                                {!isFounder && profile.investment_capital && (
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                            <Target className="w-4 h-4" /> Investment Capacity
                                        </div>
                                        <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <p className="text-3xl font-bold text-emerald-700">
                                                ${profile.investment_capital.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-emerald-600 mt-1">Available for investment</p>
                                        </div>
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
