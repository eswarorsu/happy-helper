import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import {
    IdeaWithFounder,
    getStageFromStatus,
    isTrendingDomain,
    formatCurrency,
} from "@/types/investor";

interface IdeaCardProps {
    idea: IdeaWithFounder;
}

/**
 * Minimal idea card for list view
 * Design: No background colors, focus on clarity and structure
 */
export default function IdeaCard({ idea }: IdeaCardProps) {
    const navigate = useNavigate();
    const stage = getStageFromStatus(idea.status);
    const isTrending = isTrendingDomain(idea.domain);

    const handleClick = () => {
        navigate(`/idea/${idea.id}`);
    };

    return (
        <Card
            onClick={handleClick}
            className="border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer bg-white"
        >
            <CardContent className="p-5">
                {/* Row 1: Name + Trending Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-slate-900 leading-tight">
                        {idea.title}
                    </h3>
                    {isTrending && (
                        <Badge
                            variant="outline"
                            className="shrink-0 text-orange-600 border-orange-300 bg-orange-50/50 text-[10px] font-medium"
                        >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Hot
                        </Badge>
                    )}
                </div>

                {/* Row 2: Domain + Stage */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {idea.domain}
                    </span>
                    <span className="text-slate-300">•</span>
                    <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${stage.variant === "running"
                                ? "text-green-700 border-green-300"
                                : stage.variant === "early"
                                    ? "text-blue-700 border-blue-300"
                                    : "text-slate-600 border-slate-300"
                            }`}
                    >
                        {stage.label}
                    </Badge>
                </div>

                {/* Row 3: Founder Name */}
                <p className="text-sm text-slate-600 mb-4">
                    By <span className="font-medium">{idea.founder?.name || "Unknown"}</span>
                </p>

                {/* Row 4: Funding Summary */}
                <div className="flex justify-between text-sm border-t border-slate-100 pt-3">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                            Target
                        </p>
                        <p className="font-semibold text-slate-800">
                            {formatCurrency(idea.investment_needed)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                            Raised
                        </p>
                        <p className="font-semibold text-slate-800">
                            {formatCurrency(idea.investment_received)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
