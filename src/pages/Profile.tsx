import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    User,
    Mail,
    Phone,
    Briefcase,
    GraduationCap,
    Linkedin,
    ArrowLeft,
    ShieldCheck,
    Globe,
    Building2,
    Calendar,
    Target
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
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
    );

    if (!profile) return null;

    const isFounder = profile.user_type === "founder";

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(isFounder ? "/founder-dashboard" : "/investor-dashboard")}
                        className="hover:bg-indigo-50 hover:text-indigo-700"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Identity */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                            <div className={`absolute top-0 w-full h-32 ${isFounder ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`} />

                            <div className="relative z-10 mt-12 mb-4">
                                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                                    <AvatarFallback className="text-3xl font-bold bg-slate-100 text-slate-400">
                                        {profile.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <h1 className="relative z-10 text-2xl font-black text-slate-900">{profile.name}</h1>

                            <div className="relative z-10 flex flex-col items-center gap-1 mb-6">
                                <p className="text-sm font-medium text-slate-500">{profile.current_job || "Member"}</p>
                                {profile.current_status && (
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0">
                                        {profile.current_status}
                                    </Badge>
                                )}
                            </div>

                            <div className="relative z-10 w-full space-y-3">
                                {profile.linkedin_profile && (
                                    <a href={profile.linkedin_profile} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-10 bg-[#0077b5]/10 text-[#0077b5] rounded-xl font-bold text-sm hover:bg-[#0077b5]/20 transition-colors">
                                        <Linkedin className="w-4 h-4" /> LinkedIn
                                    </a>
                                )}
                                {profile.website_url && (
                                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-10 bg-purple-50 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-100 transition-colors">
                                        <Globe className="w-4 h-4" /> Website
                                    </a>
                                )}
                                <div className="flex items-center justify-center gap-2 w-full h-10 bg-slate-50 text-slate-600 rounded-xl font-medium text-sm">
                                    {isFounder ? <User className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                    {isFounder ? "Founder" : "Investor"}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-lg shadow-slate-200 border border-slate-100 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact Info</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{profile.email}</span>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span>{profile.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Professional Profile</h2>
                                    <p className="text-sm text-slate-500">Your professional journey and expertise</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {profile.experience && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> Experience
                                        </h3>
                                        <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl">
                                            {profile.experience}
                                        </p>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                    {profile.education && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" /> Education
                                            </h3>
                                            <div className="p-4 rounded-2xl border border-slate-100">
                                                <p className="font-bold text-slate-900">{profile.education}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile.domain && (
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Globe className="w-4 h-4" /> Domain
                                            </h3>
                                            <div className="p-4 rounded-2xl border border-slate-100 flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                                    {profile.domain}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!isFounder && profile.investment_capital && (
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Target className="w-4 h-4" /> Investment Capacity
                                        </h3>
                                        <div className="text-2xl font-black text-slate-900">
                                            ${profile.investment_capital.toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
