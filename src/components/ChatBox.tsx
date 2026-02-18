import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { db, sendMessage, subscribeToChat, markMessageAsRead, Message as FirebaseMessage, connectFirebase } from "@/lib/firebase";
import {
  Send, Handshake, CheckCircle2, Paperclip, Image as ImageIcon,
  FileText, Download, File as FileIcon, X, Check, CheckCheck,
  DollarSign, AlertCircle, TrendingUp, Info, Smile
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message extends Omit<FirebaseMessage, 'id' | 'created_at'> {
  id: string;
  created_at: string;
}

interface ChatBoxProps {
  chatRequest: any;
  currentUserId: string;
  onClose: () => void;
  onMessagesRead?: () => void;
  onViewProfile?: () => void;
  variant?: 'dialog' | 'embedded';
  className?: string;
}

const ChatBox = ({ chatRequest, currentUserId, onClose, onMessagesRead, onViewProfile, variant = 'dialog', className = '' }: ChatBoxProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(chatRequest.status);
  const [isUploading, setIsUploading] = useState(false);
  const [proposedAmount, setProposedAmount] = useState(chatRequest.proposed_amount || "");
  const [showProposalInput, setShowProposalInput] = useState(false);
  const [showRequestInput, setShowRequestInput] = useState(false);
  const [dealStatus, setDealStatus] = useState(chatRequest.deal_status || "none");
  const [showDealPanel, setShowDealPanel] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isFounder = currentUserId === chatRequest.founder_id;
  const otherPartyName = isFounder ? chatRequest.investor?.name : chatRequest.founder?.name;
  const otherPartyAvatar = isFounder ? chatRequest.investor?.avatar_url : chatRequest.founder?.avatar_url;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const chatId = chatRequest.id;
    let unsubscribe: (() => void) | null = null;

    const initChat = async () => {
      try {
        await connectFirebase();
        unsubscribe = subscribeToChat(chatId, (msgs) => {
          const formattedMessages = msgs.map(msg => ({
            ...msg,
            id: msg.id || 'temp-id',
            created_at: typeof msg.created_at === 'number'
              ? new Date(msg.created_at).toISOString()
              : new Date().toISOString()
          }));
          setMessages(formattedMessages);

          msgs.forEach(msg => {
            if (!msg.is_read && msg.sender_id !== currentUserId && msg.id) {
              markMessageAsRead(chatId, msg.id).catch(console.error);
            }
          });

          if (msgs.some(m => !m.is_read && m.sender_id !== currentUserId)) {
            onMessagesRead?.();
          }
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };

    initChat();

    const channel = supabase
      .channel(`chat-status:${chatRequest.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_requests", filter: `id=eq.${chatRequest.id}` },
        (payload) => {
          setRequestStatus(payload.new.status);
          setDealStatus(payload.new.deal_status || "none");
          setProposedAmount(payload.new.proposed_amount || "");
        }
      )
      .subscribe();

    return () => {
      if (unsubscribe) unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [chatRequest.id, currentUserId, onMessagesRead]);

  useEffect(() => {
    setRequestStatus(chatRequest.status);
  }, [chatRequest.status]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await connectFirebase();
      await sendMessage(chatRequest.id, {
        sender_id: currentUserId,
        content: newMessage,
        type: 'text'
      });
      setNewMessage("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", err);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (requestStatus !== "deal_done") {
      toast({ title: "Access Denied", description: "Document sharing is only available after a deal is established.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${chatRequest.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("chat_attachments").upload(filePath, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from("chat_attachments").getPublicUrl(filePath);

      await sendMessage(chatRequest.id, {
        sender_id: currentUserId,
        content: JSON.stringify({ type: "attachment", fileUrl: publicUrl, fileName: file.name, fileType: file.type }),
        type: 'attachment',
        fileUrl: publicUrl,
        fileName: file.name,
        fileType: file.type
      });

      toast({ title: "File shared", description: "Your document has been sent." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderMessageContent = (msg: Message) => {
    const isSent = msg.sender_id === currentUserId;

    // Handle direct image messages (from payment proofs)
    if (msg.type === 'image' && msg.content) {
      return (
        <div className="space-y-2 max-w-[240px]">
          <img
            src={msg.content}
            alt="Payment Screenshot"
            className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-slate-200"
            onClick={() => window.open(msg.content, '_blank')}
          />
          <p className="text-[10px] font-medium opacity-60 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Payment Screenshot
          </p>
        </div>
      );
    }

    try {
      if (msg.content.startsWith('{"type":"attachment"')) {
        const data = JSON.parse(msg.content);
        const isImage = data.fileType.startsWith("image/");

        if (isImage) {
          return (
            <div className="space-y-2 max-w-[220px]">
              <img src={data.fileUrl} alt={data.fileName} className="w-full rounded-xl border border-slate-200" />
              <p className="text-[10px] font-medium opacity-60 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> {data.fileName}
              </p>
            </div>
          );
        }

        return (
          <div className={`flex items-center gap-3 p-3 rounded-xl min-w-[200px] ${isSent ? 'bg-white/20' : 'bg-white'}`}>
            <div className={`p-2 rounded-lg ${isSent ? 'bg-white/20' : 'bg-slate-100'}`}>
              {data.fileType.includes("pdf") ? <FileText className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{data.fileName}</p>
              <p className="text-[10px] opacity-70 uppercase">{data.fileType.split("/")[1]}</p>
            </div>
            <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-black/5 rounded-full">
              <Download className="w-4 h-4" />
            </a>
          </div>
        );
      }
    } catch (e) { }
    return <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
  };

  // ============================================================================
  // DEAL HANDLERS
  // ============================================================================
  const handleDealProposal = async () => {
    if (!isFounder) {
      if (!showProposalInput) {
        setShowProposalInput(true);
        setShowDealPanel(true);
        return;
      }
      const amount = parseFloat(proposedAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({ title: "Invalid Amount", description: "Enter a valid investment amount", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from("chat_requests")
        .update({ proposed_amount: amount, deal_status: "proposed", status: "deal_pending_investor" })
        .eq("id", chatRequest.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Proposal Sent! 💰", description: `₹${amount.toLocaleString()} proposal sent` });
        setShowProposalInput(false);
        await sendMessage(chatRequest.id, { sender_id: currentUserId, content: `💰 Deal Proposed: ₹${amount.toLocaleString()}`, type: 'text' });
      }
    }
  };

  const handleAcceptDeal = async () => {
    if (!isFounder || dealStatus !== "proposed") return;
    const investmentAmount = Number(proposedAmount);
    if (investmentAmount <= 0) return;
    const { error } = await supabase.from("chat_requests").update({ deal_status: "none", status: "deal_done" }).eq("id", chatRequest.id);
    if (error) return;
    const { data: ideaData } = await supabase.from("ideas").select("investment_received").eq("id", chatRequest.idea_id).single();
    const newTotal = (ideaData?.investment_received || 0) + investmentAmount;
    await supabase.from("ideas").update({ investment_received: newTotal, status: "funded" }).eq("id", chatRequest.idea_id);
    await (supabase as any).from("investment_records").insert({
      idea_id: chatRequest.idea_id,
      investor_id: chatRequest.investor_id,
      founder_id: chatRequest.founder_id,
      chat_request_id: chatRequest.id,
      amount: investmentAmount,
      status: "confirmed"
    });
    setProposedAmount("");
    setDealStatus("none");
    toast({ title: "Deal Accepted! 🤝", description: `₹${investmentAmount.toLocaleString()} invested` });
    await sendMessage(chatRequest.id, { sender_id: currentUserId, content: `✅ Deal Accepted: ₹${investmentAmount.toLocaleString()}`, type: 'text' });
  };

  const handleRejectDeal = async () => {
    if (!isFounder || dealStatus !== "proposed") return;
    await (supabase as any).from("chat_requests").update({ deal_status: "rejected", proposed_amount: null }).eq("id", chatRequest.id);
    toast({ title: "Deal Declined" });
    await sendMessage(chatRequest.id, { sender_id: currentUserId, content: `❌ Deal declined`, type: 'text' });
  };

  const handleFounderRequest = async () => {
    if (!isFounder) return;
    if (!showRequestInput) {
      setShowRequestInput(true);
      setShowDealPanel(true);
      return;
    }
    const amount = parseFloat(proposedAmount);
    if (isNaN(amount) || amount <= 0) return;
    const { error } = await (supabase as any).from("chat_requests").update({ proposed_amount: amount, deal_status: "requested" }).eq("id", chatRequest.id);
    if (!error) {
      toast({ title: "Request Sent! 📩" });
      setShowRequestInput(false);
      await sendMessage(chatRequest.id, { sender_id: currentUserId, content: `📩 Reinvestment Request: ₹${amount.toLocaleString()}`, type: 'text' });
    }
  };

  const handleInvestorAcceptRequest = async () => {
    if (isFounder || dealStatus !== "requested") return;
    const investmentAmount = Number(proposedAmount);
    if (investmentAmount <= 0) return;
    await supabase.from("chat_requests").update({ deal_status: "none", status: "deal_done" }).eq("id", chatRequest.id);
    const { data: ideaData } = await supabase.from("ideas").select("investment_received").eq("id", chatRequest.idea_id).single();
    const newTotal = (ideaData?.investment_received || 0) + investmentAmount;
    await supabase.from("ideas").update({ investment_received: newTotal, status: "funded" }).eq("id", chatRequest.idea_id);
    await (supabase as any).from("investment_records").insert({
      idea_id: chatRequest.idea_id,
      investor_id: chatRequest.investor_id,
      founder_id: chatRequest.founder_id,
      chat_request_id: chatRequest.id,
      amount: investmentAmount,
      status: "confirmed"
    });
    setProposedAmount("");
    setDealStatus("none");
    toast({ title: "Request Accepted! 🤝" });
    await sendMessage(chatRequest.id, { sender_id: currentUserId, content: `✅ Reinvestment: ₹${investmentAmount.toLocaleString()}`, type: 'text' });
  };

  const handleInvestorRejectRequest = async () => {
    if (isFounder || dealStatus !== "requested") return;
    await (supabase as any).from("chat_requests").update({ deal_status: "rejected", proposed_amount: null }).eq("id", chatRequest.id);
    toast({ title: "Request Declined" });
    await sendMessage(chatRequest.id, { sender_id: currentUserId, content: `❌ Request declined`, type: 'text' });
  };

  const getStatusConfig = () => {
    if (dealStatus === "proposed" && isFounder) return { label: `₹${Number(proposedAmount).toLocaleString()} Proposal`, color: "bg-amber-100 text-amber-800 border-amber-200", icon: DollarSign };
    if (dealStatus === "proposed" && !isFounder) return { label: "Awaiting Response", color: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertCircle };
    if (dealStatus === "requested" && !isFounder) return { label: `₹${Number(proposedAmount).toLocaleString()} Request`, color: "bg-purple-100 text-purple-800 border-purple-200", icon: DollarSign };
    if (dealStatus === "requested" && isFounder) return { label: "Request Pending", color: "bg-purple-100 text-purple-800 border-purple-200", icon: AlertCircle };
    if (requestStatus === "deal_done") return { label: "Deal Active", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Handshake };
    return null;
  };

  const statusConfig = getStatusConfig();
  const showActionBar = dealStatus === "proposed" || dealStatus === "requested" || showProposalInput || showRequestInput;

  // ============================================================================
  // LIGHT MODE UI COMPONENT
  // ============================================================================
  const Content = (
    <div className={`flex flex-col h-full overflow-hidden bg-background ${className}`}>
      {/* Light Glassmorphic Header */}
      <div className="px-4 py-3 bg-background/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border border-white shadow-sm">
              <AvatarImage src={otherPartyAvatar} />
              <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-sm">
                {otherPartyName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">{otherPartyName}</h3>
            <p className="text-xs text-slate-500 truncate max-w-[180px]">{chatRequest.idea?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {statusConfig && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-medium ${statusConfig.color} hidden sm:flex shadow-sm`}>
              <statusConfig.icon className="w-3 h-3" />
              <span>{statusConfig.label}</span>
            </div>
          )}

          {requestStatus === "deal_done" && (
            <Button variant="ghost" size="icon" onClick={() => navigate(`/deal-center/${chatRequest.id}`)} className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full" title="View Deal">
              <TrendingUp className="w-4 h-4" />
            </Button>
          )}

          {onViewProfile && (
            <Button variant="ghost" size="icon" onClick={onViewProfile} className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full" title="View Profile Info">
              <Info className="w-4 h-4" />
            </Button>
          )}

          {variant === 'embedded' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full ml-1" onClick={onClose} title="Close Chat">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <AnimatePresence>
        {showActionBar && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/50 border-b border-slate-200">
            <div className="px-4 py-3">
              {dealStatus === "proposed" && isFounder && (
                <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-800 font-medium">Investment Offer</p>
                      <p className="text-lg font-bold text-slate-900">₹{Number(proposedAmount).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleRejectDeal} variant="ghost" className="h-9 px-4 text-slate-600 hover:bg-amber-100/50 hover:text-amber-900">Decline</Button>
                    <Button size="sm" onClick={handleAcceptDeal} className="h-9 px-5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm">Accept</Button>
                  </div>
                </div>
              )}

              {dealStatus === "requested" && !isFounder && (
                <div className="flex items-center justify-between gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-purple-800 font-medium">Reinvestment Request</p>
                      <p className="text-lg font-bold text-slate-900">₹{Number(proposedAmount).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleInvestorRejectRequest} variant="ghost" className="h-9 px-4 text-slate-600 hover:bg-purple-100/50 hover:text-purple-900">Decline</Button>
                    <Button size="sm" onClick={handleInvestorAcceptRequest} className="h-9 px-5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm">Accept</Button>
                  </div>
                </div>
              )}

              {(showProposalInput || showRequestInput) && (
                <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={proposedAmount}
                      onChange={(e) => setProposedAmount(e.target.value)}
                      className="pl-7 h-10 border-none bg-transparent text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
                      autoFocus
                    />
                  </div>
                  <Button size="sm" onClick={showRequestInput ? handleFounderRequest : handleDealProposal} className={`h-8 mr-1 px-4 ${showRequestInput ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}>
                    {showRequestInput ? 'Send Request' : 'Send Proposal'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setShowProposalInput(false); setShowRequestInput(false); }} className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg mr-1">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-3 bg-background">
        <div className="space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const isSent = message.sender_id === currentUserId;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isSent ? "justify-end" : "justify-start"}`}
                >
                  {!isSent && showAvatar ? (
                    <Avatar className="w-8 h-8 mt-auto border border-white shadow-sm">
                      <AvatarImage src={otherPartyAvatar} />
                      <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px]">{otherPartyName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : !isSent && <div className="w-8" />}

                  <div className={`flex flex-col max-w-[75%] ${isSent ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2.5 shadow-sm ${isSent
                      ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-none"
                      }`}>
                      {renderMessageContent(message)}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 ${isSent ? "flex-row-reverse" : "flex-row"}`}>
                      <span>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {isSent && (
                        message.is_read ? <CheckCheck className="w-3 h-3 text-indigo-500" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Light Footer Input */}
      <div className="p-4 bg-background border-t border-slate-200/60 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif" />

          {requestStatus === "deal_done" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full shrink-0"
            >
              {isUploading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </Button>
          )}

          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all flex items-center px-2">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 px-2 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <div className="flex gap-1 pr-1">
              {["👍", "❤️", "😊"].map(e => (
                <button type="button" key={e} onClick={() => setNewMessage(p => p + e)} className="p-1 hover:bg-slate-100 rounded-md transition text-sm opacity-60 hover:opacity-100">
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !newMessage.trim()}
            className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>

        <div className="flex justify-center gap-4 mt-3">
          {requestStatus === "deal_done" && !showActionBar && (
            isFounder ? (
              <Button size="sm" variant="ghost" onClick={() => setShowRequestInput(true)} className="h-6 text-[10px] text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-full px-3">
                <DollarSign className="w-3 h-3 mr-1" /> Request Funds
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowProposalInput(true)} className="h-6 text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full px-3">
                <DollarSign className="w-3 h-3 mr-1" /> Invest More
              </Button>
            )
          )}
          {requestStatus !== "deal_done" && !isFounder && !showActionBar && (
            <Button size="sm" variant="ghost" onClick={() => setShowProposalInput(true)} className="h-6 text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full px-3">
              <DollarSign className="w-3 h-3 mr-1" /> Propose Deal
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'dialog') {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[440px] h-[75vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return Content;
};

export default ChatBox;
