import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import chatBg from "@/assets/chat-bg.png";
// or correct relative path like "../assets/chat-bg.png"

import { Send, Handshake, CheckCircle2, DollarSign, Badge, Paperclip, Image as ImageIcon, FileText, Download, File as FileIcon } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

interface ChatBoxProps {
  chatRequest: any;
  currentUserId: string;
  onClose: () => void;
  onMessagesRead?: () => void;
}

const ChatBox = ({ chatRequest, currentUserId, onClose, onMessagesRead }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(chatRequest.status);
  const [fundingAmount, setFundingAmount] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isFounder = currentUserId === chatRequest.founder_id;
  const otherPartyName = isFounder ? chatRequest.investor?.name : chatRequest.founder?.name;

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat:${chatRequest.id, currentUserId, onMessagesRead}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_request_id=eq.${chatRequest.id}` },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // If message is from other party, mark as read immediately
          if (newMessage.sender_id !== currentUserId) {
            supabase.rpc('mark_messages_as_read', {
              p_chat_request_id: chatRequest.id
            }).then(({ error }) => {
              if (error) console.error("Error marking message as read (realtime RPC):", error);
              else if (onMessagesRead) onMessagesRead();
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_requests", filter: `id=eq.${chatRequest.id}` },
        (payload) => {
          setRequestStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRequest.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Sycn status if it changes externally via prop
  useEffect(() => {
    setRequestStatus(chatRequest.status);
  }, [chatRequest.status]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_request_id", chatRequest.id)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);

      // Mark unread messages as read
      const unreadMessages = data.filter(m => !m.is_read && m.sender_id !== currentUserId);
      if (unreadMessages.length > 0) {
        const { error } = await supabase.rpc('mark_messages_as_read', {
          p_chat_request_id: chatRequest.id
        });

        if (error) {
          console.error("Error marking messages as read (RPC fetch):", error);
        } else if (onMessagesRead) {
          onMessagesRead();
        }
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("messages")
      .insert({
        chat_request_id: chatRequest.id,
        sender_id: currentUserId,
        content: newMessage,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage("");
    }
    setIsLoading(false);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (requestStatus !== "deal_done") {
      toast({
        title: "Access Denied",
        description: "Document sharing is only available after a deal is established.",
        variant: "destructive"
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${chatRequest.id}/${fileName}`;

      console.log("Attempting upload to bucket: 'chat_attachments' at path:", filePath);
      const { error: uploadError, data } = await supabase.storage
        .from("chat_attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error(uploadError.message || "Failed to upload file to 'chat_attachments' bucket.");
      }

      const { data: { publicUrl } } = supabase.storage
        .from("chat_attachments")
        .getPublicUrl(filePath);

      const attachmentData = {
        type: "attachment",
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: file.type,
      };

      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          chat_request_id: chatRequest.id,
          sender_id: currentUserId,
          content: JSON.stringify(attachmentData),
        });

      if (msgError) throw msgError;

      toast({ title: "File shared", description: "Your document has been sent successfully." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderMessageContent = (content: string) => {
    try {
      if (content.startsWith('{"type":"attachment"')) {
        const data = JSON.parse(content);
        const isImage = data.fileType.startsWith("image/");

        if (isImage) {
          return (
            <div className="space-y-2">
              <img
                src={data.fileUrl}
                alt={data.fileName}
                className="max-w-full rounded-lg border border-slate-100 shadow-sm"
              />
              <p className="text-[10px] font-medium opacity-70 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> {data.fileName}
              </p>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-3 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
            <div className="bg-indigo-100 p-2 rounded-lg">
              {data.fileType.includes("pdf") ? <FileText className="w-5 h-5 text-indigo-600" /> : <FileIcon className="w-5 h-5 text-indigo-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{data.fileName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">
                {data.fileType.split("/")[1]}</p>
            </div>
            <a
              href={data.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </a>
          </div>
        );
      }
    } catch (e) {
      // Not a JSON message or parse failed, fall back to text
    }
    return <p>{content}</p>;
  };

  const handleDealDone = async () => {
    let nextStatus = "";
    if (isFounder) {
      if (requestStatus !== "deal_pending_investor") {
        toast({
          title: "Wait",
          description: "Waiting for investor to accept the deal first.",
          variant: "default"
        });
        return;
      }
      nextStatus = "deal_done";
    } else {
      // Investor side
      if (requestStatus === "deal_pending_investor" || requestStatus === "deal_done") {
        toast({ title: "Action already taken", description: "Deal status is already updated." });
        return;
      }
      nextStatus = "deal_pending_investor";
    }

    const { error } = await supabase
      .from("chat_requests")
      .update({ status: nextStatus })
      .eq("id", chatRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (nextStatus === "deal_done") {
        await supabase
          .from("ideas")
          .update({ status: "deal_done" })
          .eq("id", chatRequest.idea_id);
      }
      toast({
        title: "Status Updated",
        description: isFounder ? "Deal confirmed! 🤝" : "Deal acceptance sent to Founder."
      });
    }
  };

  const handleFundingSubmit = async () => {
    const amount = parseFloat(fundingAmount);
    if (isNaN(amount)) {
      toast({ title: "Invalid Amount", description: "Please enter a valid number.", variant: "destructive" });
      return;
    }

    // Attempt to increment investment received via direct update (as fallback for RPC)
    const { data: idea } = await supabase.from("ideas").select("investment_received").eq("id", chatRequest.idea_id).single();
    const current = idea?.investment_received || 0;

    const { error } = await supabase
      .from("ideas")
      .update({ investment_received: current + amount })
      .eq("id", chatRequest.idea_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Investment of $${amount.toLocaleString()} recorded!` });
      setFundingAmount("");
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
<DialogContent className="sm:max-w-[520px] h-[700px] flex flex-col p-0 overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="px-4 py-3 border-b bg-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-indigo-100">
              <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">
                {otherPartyName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                {otherPartyName}
                {requestStatus === "deal_done" && <Handshake className="w-5 h-5 text-green-500" />}
              </DialogTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{chatRequest.idea?.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {requestStatus === "deal_done" ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 scale-90">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">Established</span>
              </div>
            ) : (
              <Button
                onClick={handleDealDone}
                size="sm"
                className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isFounder
                  ? (requestStatus === "deal_pending_investor" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed")
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
              >
                {isFounder
                  ? (requestStatus === "deal_pending_investor" ? "Confirm Deal Done" : "Wait for Investor")
                  : "Deal Done"}
              </Button>
            )}
          </div>
        </DialogHeader>
<ScrollArea
   className="relative"
  style={{
    height: "calc(100% - 230px)", 
    backgroundImage: `url(${chatBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
<div className="absolute inset-0 bg-white/0 backdrop-blur-sm pointer-events-none" />

  <div className="relative z-10 space-y-3">
    {messages.map((message) => (
      <div
        key={message.id}
        className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
            message.sender_id === currentUserId
              ? "bg-indigo-600 text-white rounded-tr-none"
              : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
          }`}
        >
          {renderMessageContent(message.content)}
          <p className={`text-[9px] mt-1 opacity-60 ${
            message.sender_id === currentUserId ? "text-right" : "text-left"
          }`}>
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    ))}
    <div ref={scrollRef} />
  </div>
</ScrollArea>

    

        <div className="p-4 border-t bg-white space-y-4">
          {requestStatus === "deal_done" && isFounder && (
            <div className="flex flex-col gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Record Official Funding</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <Input
                    placeholder={`amount for ${chatRequest.idea?.title}`}
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    className="pl-7 bg-white h-9 text-xs rounded-lg border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>
                <Button onClick={handleFundingSubmit} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold uppercase rounded-lg">Record</Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif"
            />
            {requestStatus === "deal_done" && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFileClick}
                disabled={isUploading}
                className="h-11 w-11 rounded-xl border-slate-100 hover:bg-slate-50 shrink-0"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5 text-slate-500" />
                )}
              </Button>
            )}
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl bg-slate-50 border-0 focus-visible:ring-indigo-600 h-11"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !newMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 h-11 w-11 rounded-xl shadow-lg shadow-indigo-100"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatBox;
