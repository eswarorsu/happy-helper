import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Lightbulb, CheckCircle2, ShieldCheck, AlertCircle, LayoutDashboard, LogOut, Search, Check, XCircle, ChevronRight, DollarSign, Globe, TrendingUp, CreditCard, Activity, Calendar, Shield, Zap, Bell, Hammer, Database, Settings, Filter, Download, ArrowUpRight, Clock, Info, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemStatus, setSystemStatus] = useState("Operational");
  const [activityLog, setActivityLog] = useState<any[]>([
    { id: 1, action: "User Approved", user: "John Doe", time: "2 mins ago", type: "success" },
    { id: 2, action: "New Payment", detail: "₹5,000 received", time: "15 mins ago", type: "payment" },
    { id: 3, action: "System Update", detail: "v2.1 deployed", time: "1 hour ago", type: "info" },
  ]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", session.user.id)
        .single();

      if (!profile?.is_admin) {
        toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
        navigate("/");
      }
    };

    checkAdmin();
    fetchData();

    // Subscribe to changes for realtime feel
    const userChannel = supabase.channel("admin_users").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchData()).subscribe();
    const ideaChannel = supabase.channel("admin_ideas").on("postgres_changes", { event: "*", schema: "public", table: "ideas" }, () => fetchData()).subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(ideaChannel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: userData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: ideaData } = await supabase.from("ideas").select("*, founder:profiles(name)").order("created_at", { ascending: false });
      const { data: payData } = await supabase.from("payments").select("*, profiles(name, email)").order("created_at", { ascending: false });
      const { data: investData } = await supabase.from("investment_records").select("*, founder:profiles!founder_id(name), investor:profiles!investor_id(name), idea:ideas(title)").order("created_at", { ascending: false });

      setUsers(userData || []);
      setIdeas(ideaData || []);
      setPayments(payData || []);
      setInvestments(investData || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApprove = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_approved: !currentStatus }).eq("id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `User ${!currentStatus ? 'approved' : 'unapproved'}` });
      fetchData(); // Manually refresh data to ensure UI is in sync
    }
  };

  const updateIdeaStatus = async (ideaId: string, newStatus: string) => {
    const { error } = await supabase.from("ideas").update({ status: newStatus }).eq("id", ideaId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Idea status updated to ${newStatus}` });
      fetchData(); // Manually refresh data to ensure UI is in sync
    }
  };

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredIdeas = ideas.filter(i => i.title?.toLowerCase().includes(searchQuery.toLowerCase()) || i.domain?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent"
      />
      <p className="text-indigo-400 font-bold text-sm">Synchronizing Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-white">
      <TooltipProvider>
        {/* Modern Nav */}
        <header className="sticky top-0 z-50 px-8 py-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-[1550px] mx-auto bg-[#151921]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl px-8 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Innovestor Admin
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-2 font-black uppercase">Live</Badge>
                </h1>
                <p className="text-[11px] font-bold text-slate-400 tracking-[0.1em] uppercase">Enterprise Management Console</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                <Input
                  placeholder="Universal Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/5 pl-11 pr-4 h-11 w-80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500 placeholder:font-medium text-white"
                />
              </div>

              <div className="h-8 w-[1px] bg-white/10" />

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-9 px-4 border-white/10 bg-white/5 text-slate-400 flex items-center gap-2 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {systemStatus}
                </Badge>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0f1115]" />
                </Button>
                <Button onClick={() => navigate("/")} className="bg-white text-slate-900 hover:bg-slate-200 rounded-xl h-10 px-5 font-bold text-xs gap-2">
                  <LogOut size={16} /> Exit
                </Button>
              </div>
            </div>
          </motion.div>
        </header>

        <main className="max-w-[1550px] mx-auto px-8 py-6 pb-20">
          <div className="grid grid-cols-12 gap-8">

            {/* Left Column: Nav & Content */}
            <div className="col-span-12 lg:col-span-9 space-y-8">

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Platform Revenue", value: `₹${payments.filter(p => (p.status || '').toLowerCase() === 'success').reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}`, icon: DollarSign, trend: "+12.5%", color: "indigo" },
                  { label: "Elite Investors", value: users.filter(u => u.user_type === 'investor').length, icon: TrendingUp, trend: "+3 this week", color: "emerald" },
                  { label: "Idea Pipeline", value: ideas.length, icon: Lightbulb, trend: "8 new", color: "amber" },
                  { label: "Success Rate", value: `${Math.round((ideas.filter(i => i.status === 'deal_done').length / (ideas.length || 1)) * 100)}%`, icon: Zap, trend: "Top 5%", color: "purple" }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="bg-[#151921] border-white/5 shadow-[0_4px_25px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden group hover:shadow-indigo-500/10 transition-all">
                      <CardContent className="p-6 relative">
                        <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-${stat.color}-500/10 rounded-full rotate-12 transition-transform group-hover:scale-110 pointer-events-none`} />
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400`}>
                            <stat.icon size={22} />
                          </div>
                          <span className={`text-[10px] font-black text-${stat.color}-400 bg-${stat.color}-500/10 px-2 py-1 rounded-md`}>
                            {stat.trend}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-white tabular-nums">{stat.value}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Main Tabs System */}
              <Tabs defaultValue="overview" className="space-y-8">
                <div className="flex items-center justify-between">
                  <TabsList className="bg-white/5 p-1.5 rounded-2xl h-auto gap-1">
                    <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-[#1a1f28] data-[state=active]:text-indigo-400 data-[state=active]:shadow-lg transition-all flex gap-2 text-slate-500">
                      <LayoutDashboard size={16} /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-[#1a1f28] data-[state=active]:text-indigo-400 data-[state=active]:shadow-lg transition-all flex gap-2 text-slate-500">
                      <Users size={16} /> User Base
                    </TabsTrigger>
                    <TabsTrigger value="ideas" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-[#1a1f28] data-[state=active]:text-indigo-400 data-[state=active]:shadow-lg transition-all flex gap-2 text-slate-500">
                      <Lightbulb size={16} /> Idea Hub
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-[#1a1f28] data-[state=active]:text-indigo-400 data-[state=active]:shadow-lg transition-all flex gap-2 text-slate-500">
                      <CreditCard size={16} /> Ledger
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-[#1a1f28] data-[state=active]:text-indigo-400 data-[state=active]:shadow-lg transition-all flex gap-2 text-slate-500">
                      <Settings size={16} /> Admin Tools
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-[#151921] border-white/5 rounded-xl h-10 px-4 text-xs font-bold gap-2 text-slate-400 hover:text-white shadow-sm">
                      <Download size={14} /> Export Report
                    </Button>
                    <Button variant="outline" size="icon" className="bg-[#151921] border-white/5 rounded-xl h-10 w-10 text-slate-500 hover:text-white shadow-sm">
                      <Filter size={14} />
                    </Button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <TabsContent value="overview">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Revenue Curve */}
                        <Card className="bg-[#151921] border-white/5 shadow-2xl rounded-3xl p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8">
                            <Tooltip>
                              <TooltipTrigger><Info size={16} className="text-slate-600" /></TooltipTrigger>
                              <TooltipContent>Real-time transaction flow across segments</TooltipContent>
                            </Tooltip>
                          </div>
                          <CardHeader className="px-0 pt-0 pb-8">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                              Revenue Trajectory
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Monitoring platform-wide financial activity</CardDescription>
                          </CardHeader>
                          <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={payments.slice(0, 10).reverse().map(p => ({ date: format(new Date(p.created_at), 'MMM dd'), amount: Number(p.amount) }))}>
                                <defs>
                                  <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} dy={15} />
                                <YAxis stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} dx={-15} />
                                <RechartsTooltip
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={4} fill="url(#indigoGradient)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>

                        {/* Recent Deals Table */}
                        <Card className="bg-[#151921] border-white/5 shadow-2xl rounded-3xl p-8">
                          <CardHeader className="px-0 pt-0 pb-8 flex flex-row items-center justify-between space-y-0">
                            <div>
                              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                Latest Closed Deals
                              </CardTitle>
                              <p className="text-xs text-slate-500 font-medium mt-1">Founders meeting their match</p>
                            </div>
                            <Button variant="ghost" className="text-indigo-400 font-bold text-[11px] hover:bg-white/5 px-3 h-8 rounded-lg uppercase tracking-wider">Expand All</Button>
                          </CardHeader>
                          <div className="space-y-4">
                            {investments.slice(0, 6).map((inv, idx) => (
                              <motion.div
                                key={idx}
                                whileHover={{ x: 5 }}
                                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all cursor-pointer"
                                onClick={() => setSelectedIdea(ideas.find(i => i.id === inv.idea_id))}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-emerald-400 shadow-sm">
                                    <Zap size={18} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{inv.idea?.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold text-slate-500">{inv.investor?.name}</span>
                                      <ChevronRight size={10} className="text-slate-600" />
                                      <span className="text-[10px] font-bold text-slate-500">{inv.founder?.name}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-indigo-400">₹{inv.amount?.toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">{format(new Date(inv.created_at), 'MMM dd')}</p>
                                </div>
                              </motion.div>
                            ))}
                            {investments.length === 0 && (
                              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 text-slate-600"><Clock size={24} /></div>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Awaiting First Breakthrough</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="users">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <Card className="bg-[#151921] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Community Directory</h3>
                            <p className="text-xs text-slate-500 font-medium">Review and authorize platform members</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-transparent border-white/10 text-slate-400"><Filter size={14} /> Segment</Button>
                            <Button className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"><Users size={14} /> Invite New</Button>
                          </div>
                        </div>
                        <div className="p-8 grid gap-4">
                          {filteredUsers.map((user) => (
                            <motion.div
                              key={user.id}
                              layout
                              whileHover={{ scale: 1.005 }}
                              className="bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group cursor-pointer"
                              onClick={() => setSelectedUser(user)}
                            >
                              <div className="flex items-center gap-5">
                                <div className="relative">
                                  <Avatar className="w-12 h-12 rounded-xl ring-2 ring-[#0b0e14] shadow-md">
                                    <AvatarFallback className="bg-indigo-500/10 text-indigo-400 font-bold">{user.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0b0e14] ${user.is_approved ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white">{user.name}</h3>
                                    <Badge className={`${user.user_type === 'investor' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'} border-none text-[9px] font-black uppercase tracking-widest px-2 h-4`}>{user.user_type}</Badge>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Onboarding Status</p>
                                  {user.is_approved ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex gap-1.5 items-center px-3 py-1 rounded-lg text-[10px] font-bold"><Check size={12} strokeWidth={3} /> Verified Member</Badge>
                                  ) : (
                                    <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 flex gap-1.5 items-center px-3 py-1 rounded-lg text-[10px] font-bold"><AlertCircle size={12} strokeWidth={3} /> Action Required</Badge>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                  }}
                                  className="rounded-xl h-11 px-6 font-black text-xs border-white/10 text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                                >
                                  Deep Review
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="ideas">
                    <div className="grid gap-6">
                      {filteredIdeas.map((idea) => (
                        <motion.div
                          key={idea.id}
                          whileHover={{ y: -4 }}
                          className="bg-[#151921] border border-white/5 shadow-sm p-6 rounded-3xl flex items-center justify-between hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group cursor-pointer"
                          onClick={() => setSelectedIdea(idea)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{idea.title}</h3>
                              <Badge className="bg-white/5 text-slate-400 border-none text-[10px] font-black uppercase tracking-widest px-3 h-6">{idea.domain}</Badge>
                              {idea.status === 'approved' && <Badge className="bg-emerald-500/10 text-emerald-400 border-none flex gap-1.5 items-center px-3 h-6 rounded-full text-[10px] font-black"><Globe size={12} /> Live Market</Badge>}
                            </div>
                            <div className="flex items-center gap-6 text-xs text-slate-500 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {idea.founder?.name}</span>
                              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Goal: ₹{idea.investment_needed?.toLocaleString()}</span>
                              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Current: {idea.status || 'Screening'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedIdea(idea); }} className="h-11 w-11 rounded-xl border-white/10 text-slate-500 hover:text-indigo-400 hover:bg-white/5"><ArrowUpRight size={18} /></Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="financials">
                    <Card className="bg-[#151921] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">
                              <th className="py-6 px-10">Verification Key</th>
                              <th className="py-6 px-10">Client Profile</th>
                              <th className="py-6 px-10">Volume (INR)</th>
                              <th className="py-6 px-10">Settlement</th>
                              <th className="py-6 px-10">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.02]">
                            {payments.map((pay) => (
                              <tr key={pay.id} className="group hover:bg-indigo-500/10 transition-colors">
                                <td className="py-5 px-10">
                                  <span className="text-[11px] font-mono font-black text-slate-700 group-hover:text-indigo-400 transition-colors">{pay.razorpay_payment_id || pay.razorpay_order_id?.substring(0, 16)}</span>
                                </td>
                                <td className="py-5 px-10 text-sm font-bold text-white">{pay.profiles?.name}</td>
                                <td className="py-5 px-10 font-black text-white">₹{pay.amount?.toLocaleString()}</td>
                                <td className="py-5 px-10">
                                  <Badge className={`${pay.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} border-none text-[10px] font-black uppercase tracking-widest px-3 h-6`}>
                                    {pay.status}
                                  </Badge>
                                </td>
                                <td className="py-5 px-10 text-[11px] text-slate-500 font-bold uppercase tracking-tighter">
                                  <div className="flex items-center gap-2"><Clock size={12} /> {format(new Date(pay.created_at), 'PPp')}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tools">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: "Universal Notification", desc: "Push updates to all active members", icon: Bell, btn: "Compose Blast", color: "indigo" },
                        { title: "System Maintenance", desc: "Toggle maintenance toggle for all users", icon: Hammer, btn: "Enter Mode", color: "amber" },
                        { title: "Database Integrity", desc: "Verify and clean orphaned relationships", icon: Database, btn: "Run Sync", color: "emerald" },
                        { title: "Audit Logs", desc: "Detailed trace of all administrative steps", icon: Activity, btn: "View Full Log", color: "slate" },
                        { title: "Platform Settings", desc: "Configure global investment thresholds", icon: Settings, btn: "Config Panel", color: "purple" },
                        { title: "Support Inbox", desc: "Manage escalated user inquiries", icon: Mail, btn: "Open Tickets", color: "rose" }
                      ].map((tool, i) => (
                        <motion.div key={i} whileHover={{ y: -5 }}>
                          <Card className="bg-[#151921] border-white/5 shadow-2xl rounded-3xl p-6 h-full flex flex-col justify-between group">
                            <div className="space-y-4">
                              <div className={`w-12 h-12 rounded-2xl bg-${tool.color}-500/10 text-${tool.color}-400 flex items-center justify-center transition-colors group-hover:bg-${tool.color}-500 group-hover:text-white`}>
                                <tool.icon size={24} />
                              </div>
                              <div>
                                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{tool.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 font-medium">{tool.desc}</p>
                              </div>
                            </div>
                            <Button variant="outline" className={`mt-6 rounded-xl h-10 border-white/10 text-xs font-bold text-slate-500 hover:text-${tool.color}-400 hover:border-${tool.color}-500/30 hover:bg-${tool.color}-500/10`}>
                              {tool.btn}
                            </Button>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </div>

            {/* Right Column: Activity Sidebar */}
            <div className="col-span-12 lg:col-span-3 space-y-8">

              {/* Health Widget */}
              <Card className="bg-[#151921] border-white/5 shadow-2xl rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mt-12 -mr-12" />
                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity size={12} className="text-indigo-500" />
                  Live Heartbeat
                </h4>
                <div className="space-y-6">
                  {[
                    { label: "Server Latency", value: "24ms", color: "emerald" },
                    { label: "Active Nodes", value: "12 / 12", color: "indigo" },
                    { label: "Database Load", value: "8.2%", color: "emerald" }
                  ].map((h, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-500">{h.label}</span>
                        <span className={`text-${h.color}-400`}>{h.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: h.value.includes('%') ? h.value : '100%' }}
                          className={`h-full bg-${h.color}-500 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Activity Log */}
              <Card className="bg-[#151921] border-white/5 shadow-2xl rounded-3xl p-6">
                <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock size={12} className="text-indigo-500" />
                  Event Stream
                </h4>
                <div className="space-y-6">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex gap-4 group">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400`}>
                          {log.type === 'success' && <Check size={14} />}
                          {log.type === 'payment' && <DollarSign size={14} />}
                          {log.type === 'info' && <Info size={14} />}
                        </div>
                        {log.id !== activityLog.length && (
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-white/5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{log.action}</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{log.user || log.detail}</p>
                        <p className="text-[9px] font-black text-slate-800 uppercase mt-1 tracking-tighter">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-6 text-indigo-400 font-bold text-[10px] uppercase tracking-widest h-10 hover:bg-white/5 rounded-xl">Initialize Full Audit</Button>
              </Card>

              {/* Quote or Admin Note */}
              <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20 group">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-125" />
                <ShieldCheck size={40} className="mb-4 text-indigo-200" />
                <p className="text-sm font-bold leading-relaxed">"True leadership is monitoring with precision and acting with empathy."</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-4 text-indigo-200">System Guardian v2</p>
              </div>

            </div>
          </div>
        </main>

        {/* User Review Modal */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-3xl bg-[#0f1115] border-white/5 text-white overflow-hidden p-0 rounded-[2rem] shadow-2xl">
            <ScrollArea className="max-h-[85vh]">
              <div className="p-8 space-y-8">
                <DialogHeader>
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 rounded-2xl ring-4 ring-indigo-500/20">
                      <AvatarImage src={selectedUser?.avatar_url} className="object-cover" />
                      <AvatarFallback className="bg-indigo-600 text-white text-2xl font-black">{selectedUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl font-black text-white">{selectedUser?.name}</DialogTitle>
                      <DialogDescription className="text-slate-500 font-bold mt-1 flex items-center gap-2">
                        {selectedUser?.user_type?.toUpperCase()} • {selectedUser?.email}
                        <Badge className={`${selectedUser?.is_approved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'} border-none text-[10px] px-2 h-5`}>
                          {selectedUser?.is_approved ? 'AUTHORIZED' : 'PENDING REVIEW'}
                        </Badge>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Identity Details</h4>
                      <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Current Role</p>
                          <p className="text-sm font-bold text-slate-200">{selectedUser?.current_job || "N/A"}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Education</p>
                          <p className="text-sm font-bold text-slate-200">{selectedUser?.education || "N/A"}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Domain Expertise</p>
                          <p className="text-sm font-bold text-slate-200">{selectedUser?.domain || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Contact & Links</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><Phone size={18} /></div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Phone Number</p>
                            <p className="text-sm font-bold text-slate-200">{selectedUser?.phone || "Private"}</p>
                          </div>
                        </div>
                        {selectedUser?.linkedin_profile && (
                          <a href={selectedUser.linkedin_profile} target="_blank" className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center"><Linkedin size={18} /></div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">LinkedIn Profile</p>
                              <p className="text-sm font-bold text-blue-400">View Network</p>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Professional Narrative</h4>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 h-[320px]">
                        <ScrollArea className="h-full">
                          <p className="text-sm text-slate-400 leading-relaxed font-medium italic whitespace-pre-wrap">
                            "{selectedUser?.experience || "No professional narrative provided yet."}"
                          </p>
                        </ScrollArea>
                      </div>
                    </div>

                    {selectedUser?.user_type === 'investor' && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Investment profile</h4>
                        <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
                          <p className="text-[10px] text-emerald-500/60 font-black uppercase mb-1">Declared Capital Capacity</p>
                          <p className="text-3xl font-black text-emerald-400">₹{selectedUser?.investment_capital?.toLocaleString() || "0"}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedUser?.interested_domains?.map((d: string) => (
                              <Badge key={d} className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-black">{d}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-8 border-t border-white/5 sm:justify-between items-center bg-[#0b0e14] -mx-8 -mb-8 p-8 sticky bottom-0 z-10">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Joined {format(new Date(selectedUser?.created_at || Date.now()), 'PP')}</span>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="rounded-xl border-white/10 text-slate-400 hover:text-white" onClick={() => setSelectedUser(null)}>Dismiss</Button>
                    <Button
                      className={`${selectedUser?.is_approved ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-xl px-8 font-black shadow-lg shadow-indigo-600/20`}
                      onClick={() => { toggleApprove(selectedUser.id, !!selectedUser.is_approved); setSelectedUser(null); }}
                    >
                      {selectedUser?.is_approved ? 'Revoke Authorization' : 'Grant Verification'}
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Idea Review Modal */}
        <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
          <DialogContent className="max-w-4xl bg-[#0f1115] border-white/5 text-white overflow-hidden p-0 rounded-[2.5rem] shadow-2xl">
            <ScrollArea className="max-h-[90vh]">
              <div className="p-10 space-y-10">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[10px] font-black px-3 py-1">{selectedIdea?.domain}</Badge>
                        <Badge className="bg-white/5 text-slate-500 border-none text-[10px] font-black px-3 py-1">VERSION 1.4</Badge>
                      </div>
                      <DialogTitle className="text-4xl font-black text-white leading-tight">{selectedIdea?.title}</DialogTitle>
                      <p className="text-slate-500 font-bold mt-2 flex items-center gap-3">
                        Submitted by <span className="text-indigo-400 underline cursor-pointer">{selectedIdea?.founder?.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        {format(new Date(selectedIdea?.created_at || Date.now()), 'PPP')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Verification Status</p>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[12px] px-4 h-8 font-black rounded-xl">{selectedIdea?.status?.toUpperCase()}</Badge>
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid grid-cols-12 gap-10">
                  <div className="col-span-8 space-y-10">
                    <section>
                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Target size={14} /> The Problem Statement
                      </h4>
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                        <p className="text-lg font-medium text-slate-300 leading-relaxed italic">
                          "{selectedIdea?.description?.split('\n\n')[0] || selectedIdea?.description}"
                        </p>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Lightbulb size={14} /> The Proposed Solution
                      </h4>
                      <div className="bg-indigo-500/5 p-8 rounded-[2rem] border border-indigo-500/10">
                        <p className="text-slate-400 leading-relaxed font-medium whitespace-pre-wrap text-sm">
                          {selectedIdea?.description?.split('\n\n').slice(1).join('\n\n') || "Documentation pending deep review session."}
                        </p>
                      </div>
                    </section>

                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: "Market Size", val: selectedIdea?.market_size || "Undetermined", icon: Globe, color: "blue" },
                        { label: "Current Traction", val: selectedIdea?.traction || "Early Stage", icon: TrendingUp, color: "amber" },
                        { label: "Internal Team", val: `${selectedIdea?.team_size || '1'} Members`, icon: Users, color: "purple" }
                      ].map((m, i) => (
                        <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5 text-center group hover:bg-white/10 transition-all">
                          <div className={`w-10 h-10 rounded-2xl bg-${m.color}-500/10 text-${m.color}-400 flex items-center justify-center mx-auto mb-3`}><m.icon size={20} /></div>
                          <p className="text-[9px] font-black text-slate-600 uppercase mb-1 tracking-widest">{m.label}</p>
                          <p className="text-xs font-black text-slate-200">{m.val}</p>
                        </div>
                      ))}
                    </div>
                  </div >

                  <div className="col-span-4 space-y-10">
                    <section>
                      <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em] mb-4">Capital Requirements</h4>
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
                        <div>
                          <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Target Raise</p>
                          <p className="text-3xl font-black text-white">₹{selectedIdea?.investment_needed?.toLocaleString()}</p>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((selectedIdea?.investment_received / selectedIdea?.investment_needed) * 100, 100)}%` }}
                            className="h-full bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                          />
                        </div>
                        <div className="flex justify-between">
                          <p className="text-[10px] text-slate-600 font-bold uppercase">Secured: ₹{selectedIdea?.investment_received?.toLocaleString()}</p>
                          <p className="text-[10px] text-amber-500 font-black uppercase">{Math.round((selectedIdea?.investment_received / selectedIdea?.investment_needed) * 100)}%</p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">External Assets</h4>
                      <div className="space-y-4">
                        {selectedIdea?.media_url && (
                          <a href={selectedIdea.media_url} target="_blank" className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 group transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><FileText size={18} /></div>
                              <span className="text-sm font-bold text-slate-300 group-hover:text-white">Pitch Deck</span>
                            </div>
                            <ArrowUpRight size={16} className="text-slate-600" />
                          </a>
                        )}
                        {selectedIdea?.website_url && (
                          <a href={selectedIdea.website_url} target="_blank" className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 group transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Globe size={18} /></div>
                              <span className="text-sm font-bold text-slate-300 group-hover:text-white">Live URL</span>
                            </div>
                            <ArrowUpRight size={16} className="text-slate-600" />
                          </a>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                <DialogFooter className="pt-10 border-t border-white/5 sm:justify-between items-center bg-[#0b0e14] -mx-10 -mb-10 p-10 sticky bottom-0 z-10">
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Update State:</p>
                    <select
                      onChange={(e) => { updateIdeaStatus(selectedIdea.id, e.target.value); setSelectedIdea(null); }}
                      value={selectedIdea?.status || ""}
                      className="bg-white/5 border border-white/10 rounded-xl px-6 h-12 text-xs font-black text-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer min-w-[240px]"
                    >
                      <option value="pending" className="bg-[#151921]">Under Preliminary Review</option>
                      <option value="approved" className="bg-[#151921]">Authorize & Push to Market</option>
                      <option value="rejected" className="bg-[#151921]">Flag as Non-Compliant</option>
                      <option value="in_progress" className="bg-[#151921]">Escalate to Active Deal</option>
                      <option value="funded" className="bg-[#151921]">Mark as Fully Capitalized</option>
                      <option value="deal_done" className="bg-[#151921]">Archive as Successful Deal</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="rounded-xl border-white/5 bg-transparent text-slate-500 px-8 hover:text-white hover:bg-white/5" onClick={() => setSelectedIdea(null)}>Close Inspection</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 font-black shadow-xl shadow-indigo-600/20" onClick={() => setSelectedIdea(null)}>Finalize Review</Button>
                  </div>
                </DialogFooter>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
};

export default AdminDashboard;
