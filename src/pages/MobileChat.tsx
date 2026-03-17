import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import ChatBox from "@/components/ChatBox";

const MobileChat = () => {
    const { chatRequestId } = useParams<{ chatRequestId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [chatRequest, setChatRequest] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchChat = async () => {
            if (!chatRequestId) return;
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!profile) return;
            setCurrentUserId(profile.id);

            const { data, error } = await supabase
                .from("chat_requests")
                .select(`
                    *,
                    idea:ideas(title),
                    investor:profiles!chat_requests_investor_id_fkey(id, name, avatar_url),
                    founder:profiles!chat_requests_founder_id_fkey(id, name, avatar_url)
                `)
                .eq("id", chatRequestId)
                .single();

            if (!error && data) {
                setChatRequest(data);
            }
            setLoading(false);
        };

        fetchChat();
    }, [chatRequestId, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" />
            </div>
        );
    }

    if (!chatRequest || !currentUserId) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background p-4">
                <p className="text-slate-500 mb-4 font-medium">Chat not found or access denied.</p>
                <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-brand-charcoal text-brand-yellow rounded-xl text-sm font-bold shadow-sm">Go Back</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-background overflow-hidden relative">
            <div className="flex-1 overflow-hidden relative h-full">
                <ChatBox 
                    chatRequest={chatRequest} 
                    currentUserId={currentUserId} 
                    onClose={() => navigate(-1)} 
                    variant="embedded" 
                    className="h-full border-0 rounded-none shadow-none"
                />
            </div>
        </div>
    );
};

export default MobileChat;
