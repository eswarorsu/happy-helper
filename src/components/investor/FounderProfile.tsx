import { ExternalLink, Linkedin, Briefcase, GraduationCap, User } from "lucide-react";
import { FounderProfile as FounderProfileType } from "@/types/investor";

interface FounderProfileProps {
    founder: FounderProfileType;
}

/**
 * Founder profile display - name, role, background, links
 * Design: Structured, readable, no decorative elements
 */
export default function FounderProfile({ founder }: FounderProfileProps) {
    return (
        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm text-slate-900 transition-all hover:shadow-md">
            {/* Header: Name + Avatar */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    {founder.avatar_url ? (
                        <img
                            src={founder.avatar_url}
                            alt={founder.name}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <User className="w-6 h-6 text-slate-400" />
                    )}
                </div>
                <div className="min-w-0">
                    <h4 className="text-base font-semibold text-foreground">{founder.name}</h4>
                    {founder.current_job && (
                        <p className="text-sm text-slate-600">{founder.current_job}</p>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 text-sm">
                {founder.education && (
                    <div className="flex items-start gap-3">
                        <GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                                Education
                            </p>
                            <p className="text-slate-700">{founder.education}</p>
                        </div>
                    </div>
                )}

                {founder.experience && (
                    <div className="flex items-start gap-3">
                        <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                                Experience
                            </p>
                            <p className="text-slate-700">{founder.experience}</p>
                        </div>
                    </div>
                )}

                {founder.linkedin_profile && (
                    <a
                        href={founder.linkedin_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn Profile</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>

            {/* No profile data fallback */}
            {!founder.education && !founder.experience && !founder.linkedin_profile && (
                <p className="text-sm text-slate-400 italic">
                    No additional profile information available.
                </p>
            )}
        </div>
    );
}
