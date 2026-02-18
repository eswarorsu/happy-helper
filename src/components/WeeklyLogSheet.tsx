import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Rocket, Calendar, Image as ImageIcon, Plus, Loader2, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Idea {
    id: string;
    title: string;
}

interface WeeklyLog {
    id: string;
    idea_id: string;
    content: string;
    media_url: string | null;
    created_at: string;
}

export function WeeklyLogSheet({
    idea,
    open,
    onOpenChange,
    isFounder = false
}: {
    idea: Idea | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isFounder?: boolean;
}) {
    const { toast } = useToast();
    const [logs, setLogs] = useState<WeeklyLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newLog, setNewLog] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (open && idea) {
            fetchLogs();
        }
    }, [open, idea]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit to images
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image (PNG, JPG, etc.)",
                variant: "destructive"
            });
            return;
        }

        // Limit size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Maximum size is 5MB",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${idea?.id || 'general'}/${Math.random()}.${fileExt}`;
            const filePath = `weekly-logs/${fileName}`;

            const { data, error } = await supabase.storage
                .from('idea-media')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('idea-media')
                .getPublicUrl(filePath);

            setMediaUrl(publicUrl);
            toast({
                title: "Screenshot uploaded! 📸",
                description: "Image attached successfully."
            });
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload failed",
                description: "Could not upload image. Please check your storage settings.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const fetchLogs = async () => {
        if (!idea) return;
        setIsLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from("weekly_logs")
                .select("*")
                .eq("idea_id", idea.id)
                .order("created_at", { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    console.error("Weekly logs table does not exist. Please run migration.");
                    setLogs([]);
                } else {
                    throw error;
                }
            } else {
                setLogs(data || []);
            }
        } catch (error: any) {
            console.error("Error fetching logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!idea || !newLog.trim()) return;
        setIsSubmitting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", session.user.id)
                .single();

            if (!profile) return;

            const { error } = await (supabase as any)
                .from("weekly_logs")
                .insert({
                    idea_id: idea.id,
                    founder_id: profile.id,
                    content: newLog.trim(),
                    media_url: mediaUrl || null
                });

            if (error) throw error;

            toast({
                title: "Log Added! 🚀",
                description: "Your progress has been recorded."
            });

            setNewLog("");
            setMediaUrl("");
            setIsAdding(false);
            fetchLogs();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md bg-white border-l border-slate-200 p-0 flex flex-col text-slate-900 shadow-2xl">
                <div className="p-6 border-b border-slate-100 bg-white">
                    <SheetHeader className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <SheetTitle className="text-xl font-bold text-slate-900">Weekly Progress</SheetTitle>
                        </div>
                        <SheetDescription className="text-sm font-medium text-slate-500">
                            Logs for <span className="text-indigo-600 font-bold">{idea?.title}</span>
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {isFounder && (
                        <div className="p-4 border-b border-border/60">
                            {!isAdding ? (
                                <Button
                                    onClick={() => setIsAdding(true)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11"
                                >
                                    <Plus className="w-4 h-4" /> Add This Week's Work
                                </Button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 bg-background p-4 rounded-xl border border-border"
                                >
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            What did you work on?
                                        </label>
                                        <Textarea
                                            placeholder="Describe your progress..."
                                            value={newLog}
                                            onChange={(e) => setNewLog(e.target.value)}
                                            className="min-h-[120px] bg-white border-slate-200 resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5" /> Media (Link or Upload)
                                            </span>
                                            {mediaUrl && (
                                                <button
                                                    onClick={() => setMediaUrl("")}
                                                    className="text-red-500 hover:text-red-600 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </label>

                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="url"
                                                    placeholder="URL..."
                                                    value={mediaUrl}
                                                    onChange={(e) => setMediaUrl(e.target.value)}
                                                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pr-10"
                                                />
                                            </div>
                                            <div className="shrink-0">
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                />
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    disabled={isUploading}
                                                    className="h-10 w-10 p-0 border-border"
                                                    onClick={() => document.getElementById('file-upload')?.click()}
                                                >
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAdding(false)}
                                            className="flex-1 h-10"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !newLog.trim()}
                                            className="flex-1 h-10 bg-indigo-600 text-white"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Progress"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    <ScrollArea className="flex-1 p-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                <p className="text-sm text-slate-500">Loading history...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-slate-500 font-medium">No logs yet</p>
                            </div>
                        ) : (
                            <div className="space-y-8 relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-indigo-50" />
                                {logs.map((log, index) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative pl-10"
                                    >
                                        <div className="absolute left-[11px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 z-10" />
                                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-900 transition-all hover:shadow-md">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                                {log.content}
                                            </p>
                                            {log.media_url && (
                                                <div className="mt-4 rounded-lg overflow-hidden border border-border/60">
                                                    <img
                                                        src={log.media_url}
                                                        alt="Progress"
                                                        className="w-full h-auto object-cover max-h-64"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
