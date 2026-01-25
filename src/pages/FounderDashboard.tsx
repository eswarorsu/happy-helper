import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Plus, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, Check, X, User, Users, Briefcase, GraduationCap, Handshake, ShieldCheck, Activity, Pencil, ExternalLink, Menu, Phone, Mail, Linkedin, Globe } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatBox from "@/components/ChatBox";

const DOMAINS = [
  "FinTech", "HealthTech", "EdTech", "AI/ML", "SaaS", "E-commerce",
  "CleanTech", "AgriTech", "PropTech", "Gaming", "Social Media", "Logistics", "Other"
];

interface Profile {
  id: string;
  name: string;
  user_type: string;
  is_approved?: boolean;
  email?: string;
  experience?: string;
  education?: string;
  dob?: string;
  phone?: string;
  avatar_url?: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  domain: string;
  investment_needed: number;
  investment_received: number;
  status: string;
  created_at: string;
  media_url?: string;
  team_size?: string;
  market_size?: string;
  traction?: string;
  linkedin_url?: string;
  website_url?: string;
}

interface ChatRequest {
  id: string;
  idea_id: string;
  investor_id: string;
  founder_id: string;
  status: string;
  investor?: { id: string; name: string };
  idea?: { title: string };
  unread_count?: number;
}

const COLORS = ["#1e293b", "#4338ca", "#0f172a", "#3730a3"];

const FounderDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const ideasRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);

  // View idea state
  const [viewingIdea, setViewingIdea] = useState<Idea | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('founder-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle scroll to ideas when parameter is present
  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    if (scrollTo === 'ideas' && ideasRef.current) {
      setTimeout(() => {
        ideasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [searchParams]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth?mode=login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profileError || !profileData) {
      navigate("/profile-setup?type=founder");
      return;
    }

    if (profileData.user_type !== "founder") {
      navigate("/investor-dashboard");
      return;
    }

    setProfile(profileData);

    const { data: ideasData } = await supabase
      .from("ideas")
      .select("*")
      .eq("founder_id", profileData.id)
      .order("created_at", { ascending: false });

    setIdeas(ideasData || []);

    const { data: requestsData } = await supabase
      .from("chat_requests")
      .select(`
        *,
        investor:profiles!chat_requests_investor_id_fkey(id, name, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title)
      `)
      .eq("founder_id", profileData.id);

    if (requestsData) {
      const requestsWithCounts = await Promise.all(requestsData.map(async (request) => {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .eq("chat_request_id", request.id)
          .eq("is_read", false)
          .neq("sender_id", profileData.id);

        return { ...request, unread_count: count || 0 };
      }));
      setChatRequests(requestsWithCounts);
    } else {
      setChatRequests([]);
    }

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const scrollToIdeas = () => {
    ideasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChatRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
    const status = action === "accepted" ? "communicating" : "rejected";
    const { error } = await supabase
      .from("chat_requests")
      .update({ status: status })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Request ${action}` });
      fetchData();
    }
  };

  // Open view dialog
  const openViewDialog = (idea: Idea) => {
    setViewingIdea(idea);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Waiting Approval</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">In Progress</Badge>;
      case "funded":
        return <Badge variant="default" className="bg-blue-600 text-white">Funded</Badge>;
      case "completed":
        return <Badge className="bg-green-600 hover:bg-green-600 text-white flex gap-1 items-center">Completed 🎉</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><X size={12} /> Rejected</Badge>;
      // Backward compatibility for non-schema statuses
      case "approved":
        return <Badge className="bg-emerald-500 text-white border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><Check size={12} /> Verified & Live</Badge>;
      case "deal_done":
        return <Badge className="bg-green-600 hover:bg-green-600 text-white flex gap-1 items-center">Deal Done 🤝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const totalIdeas = ideas.length;
  const totalInvestmentNeeded = ideas.reduce((sum, idea) => sum + idea.investment_needed, 0);
  const totalInvestmentReceived = ideas.reduce((sum, idea) => sum + (idea.investment_received || 0), 0);
  const fundingGap = totalInvestmentNeeded - totalInvestmentReceived;

  const statusData = [
    { name: "Completed", value: ideas.filter((i) => i.status === "completed").length },
    { name: "In Progress", value: ideas.filter((i) => i.status === "in_progress").length },
    { name: "Funded", value: ideas.filter((i) => i.status === "funded").length },
  ].filter((d) => d.value > 0);

  const investmentData = ideas.map((idea) => ({
    name: idea.title.length > 15 ? idea.title.substring(0, 15) + "..." : idea.title,
    needed: idea.investment_needed,
    received: idea.investment_received || 0,
  }));

  const pendingRequests = chatRequests.filter((r) => r.status === "pending" || !r.status);
  const acceptedChats = chatRequests.filter((r) =>
    ["accepted", "communicating", "deal_pending_investor", "deal_done"].includes(r.status)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 font-sans relative">
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] -ml-64 -mb-64" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 text-slate-600 hover:bg-slate-100 rounded-full w-10 h-10">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Rocket className="w-5 h-5 text-indigo-600" /> Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => navigate("/founder-dashboard")}>
                    <Rocket className="w-5 h-5 mr-3" /> Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 group" onClick={scrollToIdeas}>
                    <Lightbulb className="w-5 h-5 mr-3" />
                    <span className="flex-1 text-left">Ideas Submitted</span>
                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0 ml-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {totalIdeas}
                    </Badge>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => navigate("/profile")}>
                    <User className="w-5 h-5 mr-3" /> Profile
                  </Button>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                      <LogOut className="w-5 h-5 mr-3" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <h1 className="font-black text-2xl tracking-tighter text-slate-900 leading-none">INNOVESTOR</h1>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-1">Founder OS</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">Welcome, {profile?.name}</span>
              {profile?.is_approved ? (
                <Badge className="bg-emerald-500 text-white gap-1 px-2 py-0.5 rounded-full text-[10px] mt-1 shadow-sm shadow-emerald-100 ring-2 ring-emerald-50">
                  <ShieldCheck size={12} /> Verified Founder
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] gap-1 px-2 py-0.5 rounded-full mt-1 bg-slate-100 text-slate-500">
                  <Activity size={10} /> Verification Pending
                </Badge>
              )}
            </div>
            <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="font-bold bg-indigo-50 text-indigo-600">
                {profile?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>


          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Ventures", value: totalIdeas, icon: Lightbulb, color: "text-slate-900" },
            { label: "Capital Secured", value: `$${totalInvestmentReceived.toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600" },
            { label: "Funding Gap", value: `$${fundingGap.toLocaleString()}`, icon: DollarSign, color: "text-slate-500" },
            { label: "Active Interests", value: pendingRequests.length, icon: MessageSquare, color: "text-indigo-600" },
          ].map((stat, i) => (
            <Card key={i} className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <div className="h-1 w-full bg-slate-50 group-hover:bg-indigo-600 transition-colors" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          <Card className="lg:col-span-2 bg-white border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {investmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={investmentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="needed" fill="#cfd8e3" radius={[4, 4, 0, 0]} name="Investment Needed" />
                    <Bar dataKey="received" fill="#4338ca" radius={[4, 4, 0, 0]} name="Capital Secured" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-300">No data available</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Venture Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-300">Waiting for data</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8" ref={ideasRef}>
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Your Ventures</h2>
              <Button
                onClick={() => {
                  if (!profile?.is_approved) {
                    toast({
                      title: "Verification Required",
                      description: "Your profile must be verified by an admin before you can launch an idea.",
                      variant: "destructive"
                    });
                    return;
                  }
                  navigate("/payment");
                }}
                className={`rounded-xl shadow-lg transition-all ${profile?.is_approved ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
              >
                <Plus className="w-4 h-4 mr-2" /> Launch New Idea
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {ideas.map((idea) => (
                <Card
                  key={idea.id}
                  className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden rounded-2xl cursor-pointer"
                  onClick={() => openViewDialog(idea)}
                >
                  <div className="h-1 bg-slate-50 group-hover:bg-indigo-600 transition-colors" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {idea.title} {idea.status === "completed" && "🎉"}
                        {/* <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" /> */}
                      </CardTitle>
                      {getStatusBadge(idea.status)}
                    </div>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">{idea.domain}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{idea.description}</p>
                    {idea.media_url && (
                      <a
                        href={idea.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 font-bold mb-4"
                      >
                        <ExternalLink className="w-3 h-3" /> View Pitch Deck
                      </a>
                    )}
                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-400 uppercase tracking-tighter">Target</span>
                        <span className="text-slate-900">${idea.investment_needed.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full"
                          style={{ width: `${Math.min(((idea.investment_received || 0) / idea.investment_needed) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" /> Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {acceptedChats.length > 0 ? (
                    acceptedChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer transition-all group"
                        onClick={() => setSelectedChat(chat)}
                      >
                        <Avatar className="w-10 h-10 shadow-sm">
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-bold">
                            {chat.investor?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-slate-900 text-sm truncate">{chat.investor?.name}</p>
                            {(chat.id !== selectedChat?.id && (chat.unread_count || 0) > 0) && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{chat.idea?.title}</p>
                        </div>
                        <MessageSquare className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-300">No active connections</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {pendingRequests.length > 0 && (
              <Card className="bg-indigo-600 border-0 shadow-xl rounded-2xl overflow-hidden text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Rocket className="w-4 h-4" /> New Interests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                      <div className="mb-3">
                        <p className="font-bold text-sm">{request.investor?.name}</p>
                        <p className="text-[10px] font-bold uppercase text-white/50">{request.idea?.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleChatRequestAction(request.id, "accepted")} className="flex-1 bg-white text-indigo-600 hover:bg-indigo-50">Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleChatRequestAction(request.id, "rejected")} className="flex-1 text-white hover:bg-white/10">Pass</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {selectedChat && profile && (
        <ChatBox
          chatRequest={selectedChat}
          currentUserId={profile.id}
          onClose={() => setSelectedChat(null)}
          onMessagesRead={() => {
            setChatRequests(prev => prev.map(req =>
              req.id === selectedChat.id ? { ...req, unread_count: 0 } : req
            ));
            fetchData();
          }}
        />
      )}

      {/* View Idea Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              {viewingIdea?.title}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                {viewingIdea?.domain}
              </Badge>
              {viewingIdea?.status && getStatusBadge(viewingIdea.status)}
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target</p>
                <p className="text-lg font-black text-slate-900">${viewingIdea?.investment_needed.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Raised</p>
                <p className="text-lg font-black text-slate-900">${viewingIdea?.investment_received.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Description
              </h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 max-h-[300px] overflow-y-auto">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {viewingIdea?.description}
                </p>
              </div>
            </div>

            {viewingIdea?.media_url && (
              <div className="pt-2">
                <a
                  href={viewingIdea.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-colors border border-indigo-100"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Pitch Deck / Documents
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FounderDashboard;
