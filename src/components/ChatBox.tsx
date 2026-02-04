import { useState, useEffect, useRef } from "react";
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
  FileText, Download, File as FileIcon, X, Check, CheckCheck, DollarSign, AlertCircle
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
  variant?: 'dialog' | 'embedded';
  className?: string;
}

const ChatBox = ({ chatRequest, currentUserId, onClose, onMessagesRead, variant = 'dialog', className = '' }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(chatRequest.status);
  const [fundingAmount, setFundingAmount] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [proposedAmount, setProposedAmount] = useState(chatRequest.proposed_amount || "");
  const [showProposalInput, setShowProposalInput] = useState(false);
  const [showRequestInput, setShowRequestInput] = useState(false);
  const [dealStatus, setDealStatus] = useState(chatRequest.deal_status || "none");

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
        // Ensure Firebase is connected before subscribing
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
      // Ensure Firebase is connected before sending
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

    try {
      if (msg.content.startsWith('{"type":"attachment"')) {
        const data = JSON.parse(msg.content);
        const isImage = data.fileType.startsWith("image/");

        if (isImage) {
          return (
            <div className="space-y-2 max-w-[250px]">
              <img src={data.fileUrl} alt={data.fileName} className="w-full rounded-lg border border-slate-200" />
              <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> {data.fileName}
              </p>
            </div>
          );
        }

        return (
          <div className={`flex items-center gap-3 p-3 rounded-xl border min-w-[220px] ${isSent ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`p-2.5 rounded-lg ${isSent ? 'bg-slate-600' : 'bg-slate-200'}`}>
              {data.fileType.includes("pdf") ? <FileText className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{data.fileName}</p>
              <p className="text-[10px] opacity-60 uppercase font-semibold">{data.fileType.split("/")[1]}</p>
            </div>
            <a href={data.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Download className="w-4 h-4" />
            </a>
          </div>
        );
      }
    } catch (e) { }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>;
  };

  // Handle deal proposal (investor) or acceptance (founder)
  const handleDealProposal = async () => {
    if (!isFounder) {
      // Investor proposing a deal
      if (!showProposalInput) {
        setShowProposalInput(true);
        return;
      }

      const amount = parseFloat(proposedAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({ title: "Invalid Amount", description: "Enter a valid investment amount", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("chat_requests")
        .update({
          proposed_amount: amount,
          deal_status: "proposed",
          status: "deal_pending_investor"
        })
        .eq("id", chatRequest.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Proposal Sent! 💰", description: `₹${amount.toLocaleString()} proposal sent to founder` });
        setShowProposalInput(false);

        // Send a system message
        await sendMessage(chatRequest.id, {
          sender_id: currentUserId,
          content: `💰 Deal Proposed: ₹${amount.toLocaleString()}`,
          type: 'text'
        });
      }
    }
  };

  // Founder accepts deal
  const handleAcceptDeal = async () => {
    if (!isFounder || dealStatus !== "proposed") return;

    const { error } = await supabase
      .from("chat_requests")
      .update({
        deal_status: "accepted",
        status: "deal_done"
      })
      .eq("id", chatRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update idea status - use 'completed' which is valid in DB constraint
    const { error: ideaError } = await supabase
      .from("ideas")
      .update({ status: "completed" })
      .eq("id", chatRequest.idea_id);

    if (ideaError) {
      console.error("Error updating idea status:", ideaError);
    }

    // Also record the investment in investment_records
    const investmentAmount = Number(proposedAmount);
    if (investmentAmount > 0) {
      console.log("Attempting to save investment:", {
        idea_id: chatRequest.idea_id,
        investor_id: chatRequest.investor_id,
        founder_id: chatRequest.founder_id,
        chat_request_id: chatRequest.id,
        amount: investmentAmount
      });

      const { data: investmentData, error: investmentError } = await supabase
        .from("investment_records")
        .insert({
          idea_id: chatRequest.idea_id,
          investor_id: chatRequest.investor_id,
          founder_id: chatRequest.founder_id,
          chat_request_id: chatRequest.id,
          amount: investmentAmount,
          status: "confirmed"
        })
        .select()
        .single();

      if (investmentError) {
        console.error("Error saving investment record:", investmentError);
        toast({
          title: "Warning",
          description: `Deal accepted but investment record failed: ${investmentError.message}`,
          variant: "destructive"
        });
      } else {
        console.log("Investment record saved successfully:", investmentData);
      }
    }

    toast({ title: "Deal Accepted! 🤝", description: `₹${investmentAmount.toLocaleString()} investment confirmed!` });

    // Send system message
    await sendMessage(chatRequest.id, {
      sender_id: currentUserId,
      content: `✅ Deal Accepted: ₹${investmentAmount.toLocaleString()}`,
      type: 'text'
    });
  };

  // Founder rejects deal
  const handleRejectDeal = async () => {
    if (!isFounder || dealStatus !== "proposed") return;

    const { error } = await supabase
      .from("chat_requests")
      .update({
        deal_status: "rejected",
        proposed_amount: null
      })
      .eq("id", chatRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deal Declined", description: "You can continue negotiating" });

      await sendMessage(chatRequest.id, {
        sender_id: currentUserId,
        content: `❌ Deal proposal declined. Let's discuss further.`,
        type: 'text'
      });
    }
  };

  // ============================================================================
  // FOUNDER REINVESTMENT REQUEST FLOW
  // ============================================================================

  // Founder requests reinvestment from investor
  const handleFounderRequest = async () => {
    if (!isFounder) return;

    if (!showRequestInput) {
      setShowRequestInput(true);
      return;
    }

    const amount = parseFloat(proposedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid investment amount", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("chat_requests")
      .update({
        proposed_amount: amount,
        deal_status: "requested"
      })
      .eq("id", chatRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request Sent! 📩", description: `₹${amount.toLocaleString()} request sent to investor` });
      setShowRequestInput(false);

      await sendMessage(chatRequest.id, {
        sender_id: currentUserId,
        content: `📩 Reinvestment Request: ₹${amount.toLocaleString()}`,
        type: 'text'
      });
    }
  };

  // Investor accepts founder's reinvestment request
  const handleInvestorAcceptRequest = async () => {
    if (isFounder || dealStatus !== "requested") return;

    const investmentAmount = Number(proposedAmount);

    const { error } = await supabase
      .from("chat_requests")
      .update({
        deal_status: "accepted",
        status: "deal_done"
      })
      .eq("id", chatRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update idea status
    await supabase.from("ideas").update({ status: "completed" }).eq("id", chatRequest.idea_id);

    // Record investment
    if (investmentAmount > 0) {
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const { error: investmentError } = await supabase
        .from("investment_records")
        .insert({
          idea_id: chatRequest.idea_id,
          investor_id: chatRequest.investor_id,
          founder_id: chatRequest.founder_id,
          chat_request_id: chatRequest.id,
          amount: investmentAmount,
          status: "confirmed",
          notes: `Invoice: ${invoiceNumber}`
        });

      if (investmentError) {
        console.error("Investment record error:", investmentError);
      }
    }

    toast({ title: "Request Accepted! 🤝", description: `₹${investmentAmount.toLocaleString()} investment confirmed!` });

    await sendMessage(chatRequest.id, {
      sender_id: currentUserId,
      content: `✅ Investment Request Accepted: ₹${investmentAmount.toLocaleString()}`,
      type: 'text'
    });
  };

  // Investor rejects founder's reinvestment request
  const handleInvestorRejectRequest = async () => {
    if (isFounder || dealStatus !== "requested") return;

    const { error } = await supabase
      .from("chat_requests")
      .update({
        deal_status: "rejected",
        proposed_amount: null
      })
      .eq("id", chatRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request Declined", description: "You declined the request" });

      await sendMessage(chatRequest.id, {
        sender_id: currentUserId,
        content: `❌ Investment request declined.`,
        type: 'text'
      });
    }
  };

  const handleDealDone = async () => {
    let nextStatus = "";
    if (isFounder) {
      if (requestStatus !== "deal_pending_investor") {
        toast({ title: "Wait", description: "Waiting for investor to accept the deal first." });
        return;
      }
      nextStatus = "deal_done";
    } else {
      if (requestStatus === "deal_pending_investor" || requestStatus === "deal_done") {
        toast({ title: "Action already taken" });
        return;
      }
      nextStatus = "deal_pending_investor";
    }

    const { error } = await supabase.from("chat_requests").update({ status: nextStatus }).eq("id", chatRequest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (nextStatus === "deal_done") {
        // Use 'completed' which is valid in DB constraint
        await supabase.from("ideas").update({ status: "completed" }).eq("id", chatRequest.idea_id);
      }
      toast({ title: "Status Updated", description: isFounder ? "Deal confirmed! 🤝" : "Deal acceptance sent to Founder." });
    }
  };

  const handleFundingSubmit = async () => {
    const amount = parseFloat(fundingAmount);
    if (isNaN(amount)) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }

    const { data: idea } = await supabase.from("ideas").select("investment_received").eq("id", chatRequest.idea_id).single();
    const current = idea?.investment_received || 0;

    const { error } = await supabase.from("ideas").update({ investment_received: current + amount }).eq("id", chatRequest.idea_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Investment of ₹${amount.toLocaleString()} recorded!` });
      setFundingAmount("");
    }
  };

  const quickEmojis = ["👍", "❤️", "😊", "🎉", "🚀", "✅"];

  // ============================================================================
  // PREMIUM FINTECH SLATE STYLED CONTENT
  // ============================================================================
  const Content = (
    <div className={`flex flex-col h-full overflow-hidden bg-white ${className}`}>
      {/* Header - Slate Theme */}
      <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 border-2 border-slate-100 shadow-sm">
              <AvatarImage src={otherPartyAvatar} />
              <AvatarFallback className="bg-slate-900 text-white font-semibold">
                {otherPartyName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">{otherPartyName}</h3>
              {requestStatus === "deal_done" && <Handshake className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[160px]">{chatRequest.idea?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Deal Status Display */}
          {dealStatus === "accepted" || requestStatus === "deal_done" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">
                {proposedAmount ? `₹${Number(proposedAmount).toLocaleString()}` : "Completed"}
              </span>
            </div>
          ) : dealStatus === "proposed" && isFounder ? (
            /* Founder sees proposal with accept/reject */
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                <DollarSign className="w-3 h-3" />
                <span className="text-xs font-bold">₹{Number(proposedAmount).toLocaleString()}</span>
              </div>
              <Button size="sm" onClick={handleAcceptDeal} className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectDeal} className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50">
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : dealStatus === "proposed" && !isFounder ? (
            /* Investor sees pending status */
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Pending ₹{Number(proposedAmount).toLocaleString()}</span>
            </div>
          ) : !isFounder ? (
            /* Investor can propose deal */
            showProposalInput ? (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={proposedAmount}
                    onChange={(e) => setProposedAmount(e.target.value)}
                    className="h-7 w-24 pl-6 text-xs"
                    autoFocus
                  />
                </div>
                <Button size="sm" onClick={handleDealProposal} className="h-7 px-2 bg-slate-900 hover:bg-slate-800 text-white text-xs">
                  Send
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowProposalInput(false)} className="h-7 w-7 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleDealProposal}
                size="sm"
                className="h-8 px-4 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
              >
                <DollarSign className="w-3.5 h-3.5 mr-1" /> Propose Deal
              </Button>
            )
          ) : (
            /* Founder waiting for proposal */
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full">
              <span className="text-xs font-medium">Awaiting proposal</span>
            </div>
          )}
          {variant === 'embedded' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-4 bg-slate-50">
        <div className="space-y-4 pb-2">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const isSent = message.sender_id === currentUserId;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${isSent ? "justify-end" : "justify-start"}`}
                >
                  {!isSent && showAvatar && (
                    <Avatar className="w-7 h-7 mt-auto mb-1 border border-slate-200">
                      <AvatarImage src={otherPartyAvatar} />
                      <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-semibold">{otherPartyName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  {!isSent && !showAvatar && <div className="w-7" />}

                  <div className={`flex flex-col max-w-[80%] ${isSent ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isSent
                        ? "bg-slate-900 text-white rounded-tr-sm"
                        : "bg-white text-slate-800 rounded-tl-sm border border-slate-200"
                        }`}
                    >
                      {renderMessageContent(message)}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-1 ${isSent ? "flex-row-reverse" : "flex-row"}`}>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {isSent && (
                        <div className="text-slate-400">
                          {message.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </div>
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

      {/* Input Area - Slate Theme */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-3 shrink-0">
        {/* Deal completed badge - no more recording needed */}
        {requestStatus === "deal_done" && dealStatus === "accepted" && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Deal completed • ₹{Number(proposedAmount).toLocaleString()} invested
            </span>
          </div>
        )}

        {/* Quick Emojis */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {quickEmojis.map(e => (
            <button
              key={e}
              onClick={() => setNewMessage(p => p + e)}
              className="hover:bg-slate-100 p-1.5 rounded-lg transition text-lg"
            >
              {e}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,.gif" />
          {requestStatus === "deal_done" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-11 w-11 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl shrink-0"
            >
              {isUploading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </Button>
          )}
          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-100 transition-all flex items-center px-4">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="bg-transparent border-0 focus:ring-0 w-full text-sm py-3 outline-none text-slate-800 placeholder:text-slate-400"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !newMessage.trim()}
            className="h-11 w-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shrink-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );

  if (variant === 'dialog') {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white">
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return Content;
};

export default ChatBox;
