import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Plus, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, Check, X, User, Briefcase, GraduationCap, Calendar, Mail, Phone, ChevronRight, Handshake, ShieldCheck, Activity } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatBox from "@/components/ChatBox";

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

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setIsDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    domain: "",
    investment_needed: "",
  });

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

  const handleAddIdea = async () => {
    if (!profile) return;
    if (!profile.is_approved) {
      toast({ title: "Access Denied", description: "Your account is not yet verified.", variant: "destructive" });
      return;
    }
    setIsAddingIdea(true);

    const { error } = await supabase.from("ideas").insert({
      founder_id: profile.id,
      title: newIdea.title,
      description: newIdea.description,
      domain: newIdea.domain,
      investment_needed: parseFloat(newIdea.investment_needed),
      status: 'pending'
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Idea submitted for review" });
      setNewIdea({ title: "", description: "", domain: "", investment_needed: "" });
      fetchData();
      setIsDialogOpen(false);
    }
    setIsAddingIdea(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "deal_done":
        return <Badge className="bg-green-600 hover:bg-green-600 text-white flex gap-1 items-center">Deal Done 🤝</Badge>;
      case "approved":
        return <Badge className="bg-emerald-500 text-white border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><Check size={12}/> Verified & Live</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><X size={12}/> Rejected</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Waiting Approval</Badge>;
      case "communicating":
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Communicating</Badge>;
      case "deal_pending_investor":
        return <Badge className="bg-amber-100 text-amber-700 animate-pulse border-amber-200">Investor Ready!</Badge>;
      case "funded":
        return <Badge variant="default" className="bg-blue-600">Funded</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
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
    { name: "Deal Done", value: ideas.filter((i) => i.status === "deal_done").length },
    { name: "Live Ventures", value: ideas.filter((i) => i.status === "approved" || i.status === "in_progress").length },
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
                <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100 rounded-full w-12 h-12">
                  <User className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[400px] sm:w-[540px] p-0 border-r-0 shadow-2xl">
                <div className="h-full flex flex-col bg-white">
                  <div className="bg-[#1e293b] p-8 text-white">
                    <Avatar className="w-20 h-20 border-4 border-white/20 mb-4">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name}`} />
                      <AvatarFallback className="text-2xl font-bold bg-indigo-600">{profile?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold mb-1">{profile?.name}</h2>
                    <p className="text-indigo-200 text-sm font-medium uppercase tracking-widest">{profile?.user_type}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Professional Details</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <Briefcase className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Experience</p>
                              <p className="text-sm font-semibold text-slate-700">{profile?.experience || "Not provided"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Education</p>
                              <p className="text-sm font-semibold text-slate-700">{profile?.education || "Not provided"}</p>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Venture Portfolio</h3>
                          <Badge variant="outline" className="rounded-full">{ideas.length} Ideas</Badge>
                        </div>
                        <div className="space-y-3">
                          {ideas.map((idea) => (
                            <div key={idea.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all group">
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{idea.title}</p>
                                {getStatusBadge(idea.status)}
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-bold uppercase">{idea.domain}</span>
                                <span className="text-slate-900 font-bold">${idea.investment_received.toLocaleString()} / ${idea.investment_needed.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600"
                                  style={{ width: `${Math.min((idea.investment_received / idea.investment_needed) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
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
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">Welcome, {profile?.name}</span>
              {profile?.is_approved ? (
                <Badge className="bg-emerald-500 text-white gap-1 px-2 py-0.5 rounded-full text-[10px] mt-1 shadow-sm shadow-emerald-100 ring-2 ring-emerald-50">
                  <ShieldCheck size={12}/> Verified Founder
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] gap-1 px-2 py-0.5 rounded-full mt-1 bg-slate-100 text-slate-500">
                  <Activity size={10}/> Verification Pending
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full font-bold">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
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

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Your Ventures</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Launch Idea</DialogTitle>
                    <DialogDescription>Fuel your next big thing</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input value={newIdea.title} onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Domain</Label>
                        <Input value={newIdea.domain} onChange={(e) => setNewIdea({ ...newIdea, domain: e.target.value })} />
                      </div>
                      <div>
                        <Label>Goal ($)</Label>
                        <Input type="number" value={newIdea.investment_needed} onChange={(e) => setNewIdea({ ...newIdea, investment_needed: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={newIdea.description} onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })} rows={4} />
                    </div>
                    <Button onClick={handleAddIdea} className="w-full" disabled={isAddingIdea}>
                      {isAddingIdea ? "Processing..." : "Submit"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {ideas.map((idea) => (
                <Card key={idea.id} className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden rounded-2xl">
                  <div className="h-1 bg-slate-50 group-hover:bg-indigo-600 transition-colors" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {idea.title} {idea.status === "deal_done" && "🤝"}
                      </CardTitle>
                      {getStatusBadge(idea.status)}
                    </div>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">{idea.domain}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500 mb-6 line-clamp-2">{idea.description}</p>
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
    </div>
  );
};

export default FounderDashboard;
