import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Linkedin, Calendar, Briefcase, User } from "lucide-react";

interface ProfileData {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string; // Optional if not in public profile, but useful if strictly controlled
    user_type: "investor" | "founder" | "admin";
    created_at?: string;
    linkedin_profile?: string;
    interested_domains?: string[]; // For Investors
    bio?: string; // General bio
}

interface ProfileViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: ProfileData | null;
    actionButton?: React.ReactNode;
}

export function ProfileViewModal({ isOpen, onClose, profile, actionButton }: ProfileViewModalProps) {
    if (!profile) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl text-slate-900">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold text-slate-900">Profile Details</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4 pt-4">
                    <Avatar className="w-24 h-24 border-4 border-border/60 shadow-lg">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-2xl bg-slate-800 text-white">
                            {profile.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
                        <Badge variant="secondary" className="capitalize px-3 py-1">
                            {profile.user_type}
                        </Badge>
                    </div>
                </div>

                <div className="space-y-4 py-4 px-2">

                    {/* Bio Section if available (Mocking generic bio if missing, or use specific fields) */}
                    <div className="bg-background p-3 rounded-lg text-sm text-slate-600 italic border border-border/60">
                        {profile.bio || "No bio available."}
                    </div>

                    <div className="space-y-3">
                        {profile.email && (
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-indigo-50 rounded-full text-slate-500">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{profile.email}</span>
                            </div>
                        )}

                        {profile.linkedin_profile && (
                            <div className="flex items-center gap-3 text-slate-700">
                                <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                    <Linkedin className="w-4 h-4" />
                                </div>
                                <a
                                    href={profile.linkedin_profile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:underline"
                                >
                                    LinkedIn Profile
                                </a>
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 bg-indigo-50 rounded-full text-slate-500">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-sm">
                                Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'}
                            </span>
                        </div>
                    </div>

                    {actionButton && (
                        <div className="pt-2">
                            {actionButton}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
