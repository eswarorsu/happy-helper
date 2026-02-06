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

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="h-10 w-10 border-4 border-indigo-500 rounded-full border-t-white"
      />
      <p className="text-indigo-900 font-bold text-sm">Synchronizing Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <TooltipProvider>
        {/* Modern Nav */}
        <header className="sticky top-0 z-50 px-8 py-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-[1550px] mx-auto bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm rounded-2xl px-8 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Innovestor Admin
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0 px-2 font-black uppercase">Live</Badge>
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
                  className="bg-slate-100/50 border-none pl-11 pr-4 h-11 w-80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>

              <div className="h-8 w-[1px] bg-slate-200" />

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-9 px-4 border-slate-200 bg-white text-slate-600 flex items-center gap-2 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {systemStatus}
                </Badge>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </Button>
                <Button onClick={() => navigate("/")} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 px-5 font-bold text-xs gap-2">
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
                    <Card className="bg-white border-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden group hover:shadow-indigo-900/5 transition-all">
                      <CardContent className="p-6 relative">
                        <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-${stat.color}-50/50 rounded-full rotate-12 transition-transform group-hover:scale-110 pointer-events-none`} />
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                            <stat.icon size={22} />
                          </div>
                          <span className={`text-[10px] font-black text-${stat.color}-600 bg-${stat.color}-50/80 px-2 py-1 rounded-md`}>
                            {stat.trend}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 tabular-nums">{stat.value}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Main Tabs System */}
              <Tabs defaultValue="overview" className="space-y-8">
                <div className="flex items-center justify-between">
                  <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl h-auto gap-1">
                    <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-2">
                      <LayoutDashboard size={16} /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-2">
                      <Users size={16} /> User Base
                    </TabsTrigger>
                    <TabsTrigger value="ideas" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-2">
                      <Lightbulb size={16} /> Idea Hub
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-2">
                      <CreditCard size={16} /> Ledger
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="rounded-xl px-6 py-2.5 font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all flex gap-2">
                      <Settings size={16} /> Admin Tools
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-white border-slate-200 rounded-xl h-10 px-4 text-xs font-bold gap-2 text-slate-600 hover:text-slate-900 shadow-sm">
                      <Download size={14} /> Export Report
                    </Button>
                    <Button variant="outline" size="icon" className="bg-white border-slate-200 rounded-xl h-10 w-10 text-slate-400 hover:text-slate-900 shadow-sm">
                      <Filter size={14} />
                    </Button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <TabsContent value="overview">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Revenue Curve */}
                        <Card className="bg-white border-white shadow-sm rounded-3xl p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8">
                            <Tooltip>
                              <TooltipTrigger><Info size={16} className="text-slate-300" /></TooltipTrigger>
                              <TooltipContent>Real-time transaction flow across segments</TooltipContent>
                            </Tooltip>
                          </div>
                          <CardHeader className="px-0 pt-0 pb-8">
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                              Revenue Trajectory
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-medium">Monitoring platform-wide financial activity</CardDescription>
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
                        <Card className="bg-white border-white shadow-sm rounded-3xl p-8">
                          <CardHeader className="px-0 pt-0 pb-8 flex flex-row items-center justify-between space-y-0">
                            <div>
                              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                Latest Closed Deals
                              </CardTitle>
                              <p className="text-xs text-slate-400 font-medium mt-1">Founders meeting their match</p>
                            </div>
                            <Button variant="ghost" className="text-indigo-600 font-bold text-[11px] hover:bg-indigo-50 px-3 h-8 rounded-lg uppercase tracking-wider">Expand All</Button>
                          </CardHeader>
                          <div className="space-y-4">
                            {investments.slice(0, 6).map((inv, idx) => (
                              <motion.div
                                key={idx}
                                whileHover={{ x: 5 }}
                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:bg-indigo-50/30 hover:border-indigo-100 transition-all cursor-pointer"
                                onClick={() => navigate(`/idea/${inv.idea_id}`)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-500 shadow-sm">
                                    <Zap size={18} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{inv.idea?.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold text-slate-400">{inv.investor?.name}</span>
                                      <ChevronRight size={10} className="text-slate-300" />
                                      <span className="text-[10px] font-bold text-slate-400">{inv.founder?.name}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-indigo-600">₹{inv.amount?.toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{format(new Date(inv.created_at), 'MMM dd')}</p>
                                </div>
                              </motion.div>
                            ))}
                            {investments.length === 0 && (
                              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300"><Clock size={24} /></div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Awaiting First Breakthrough</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="users">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <Card className="bg-white border-white shadow-sm rounded-3xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Community Directory</h3>
                            <p className="text-xs text-slate-400 font-medium">Review and authorize platform members</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-white border-slate-200 text-slate-600"><Filter size={14} /> Segment</Button>
                            <Button className="h-10 px-5 rounded-xl text-xs font-bold gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"><Users size={14} /> Invite New</Button>
                          </div>
                        </div>
                        <div className="p-8 grid gap-4">
                          {filteredUsers.map((user) => (
                            <motion.div
                              key={user.id}
                              layout
                              whileHover={{ scale: 1.005 }}
                              className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group cursor-pointer"
                              onClick={() => navigate(`/profile/${user.id}`)}
                            >
                              <div className="flex items-center gap-5">
                                <div className="relative">
                                  <Avatar className="w-12 h-12 rounded-xl ring-2 ring-white shadow-md">
                                    <AvatarFallback className="bg-indigo-50 text-indigo-500 font-bold">{user.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.is_approved ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900">{user.name}</h3>
                                    <Badge className={`${user.user_type === 'investor' ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-600'} border-none text-[9px] font-black uppercase tracking-widest px-2 h-4`}>{user.user_type}</Badge>
                                  </div>
                                  <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Onboarding Status</p>
                                  {user.is_approved ? (
                                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 flex gap-1.5 items-center px-3 py-1 rounded-lg text-[10px] font-bold"><Check size={12} strokeWidth={3} /> Verified Member</Badge>
                                  ) : (
                                    <Badge className="bg-amber-50 text-amber-600 border border-amber-100 flex gap-1.5 items-center px-3 py-1 rounded-lg text-[10px] font-bold"><AlertCircle size={12} strokeWidth={3} /> Action Required</Badge>
                                  )}
                                </div>
                                <Button
                                  variant={user.is_approved ? "outline" : "default"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleApprove(user.id, !!user.is_approved);
                                  }}
                                  className={`rounded-xl h-11 px-6 font-black text-xs transition-all ${user.is_approved ? 'border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/15'}`}
                                >
                                  {user.is_approved ? "Revoke Access" : "Grant Authorization"}
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="ideas">
                    {/* Similar structure for Ideas content but with more "peaceful" grid */}
                    <div className="grid gap-6">
                      {filteredIdeas.map((idea) => (
                        <motion.div
                          key={idea.id}
                          whileHover={{ y: -4 }}
                          className="bg-white border border-white shadow-sm p-6 rounded-3xl flex items-center justify-between hover:shadow-indigo-900/5 transition-all group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{idea.title}</h3>
                              <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-black uppercase tracking-widest px-3 h-6">{idea.domain}</Badge>
                              {idea.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-700 border-none flex gap-1.5 items-center px-3 h-6 rounded-full text-[10px] font-black"><Globe size={12} /> Live Market</Badge>}
                            </div>
                            <div className="flex items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> {idea.founder?.name}</span>
                              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Goal: ₹{idea.investment_needed?.toLocaleString()}</span>
                              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Current: {idea.status || 'Screening'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <select
                              onChange={(e) => updateIdeaStatus(idea.id, e.target.value)}
                              value={idea.status || ""}
                              className="bg-slate-100/80 border-none rounded-xl px-4 h-11 text-xs font-black text-slate-700 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer min-w-[160px]"
                            >
                              <option value="pending">Reviewing</option>
                              <option value="approved">Approve & Publish</option>
                              <option value="rejected">Reject Submission</option>
                              <option value="in_progress">Active Deal</option>
                              <option value="funded">Fully Funded</option>
                              <option value="deal_done">Deal Closed</option>
                            </select>
                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><ArrowUpRight size={18} /></Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="financials">
                    <Card className="bg-white border-white shadow-sm rounded-3xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">
                              <th className="py-6 px-10">Verification Key</th>
                              <th className="py-6 px-10">Client Profile</th>
                              <th className="py-6 px-10">Volume (INR)</th>
                              <th className="py-6 px-10">Settlement</th>
                              <th className="py-6 px-10">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {payments.map((pay) => (
                              <tr key={pay.id} className="group hover:bg-indigo-50/20 transition-colors">
                                <td className="py-5 px-10">
                                  <span className="text-[11px] font-mono font-black text-slate-300 group-hover:text-indigo-400 transition-colors">{pay.razorpay_payment_id || pay.razorpay_order_id?.substring(0, 16)}</span>
                                </td>
                                <td className="py-5 px-10 text-sm font-bold text-slate-700">{pay.profiles?.name}</td>
                                <td className="py-5 px-10 font-black text-slate-900">₹{pay.amount?.toLocaleString()}</td>
                                <td className="py-5 px-10">
                                  <Badge className={`${pay.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} border-none text-[10px] font-black uppercase tracking-widest px-3 h-6`}>
                                    {pay.status}
                                  </Badge>
                                </td>
                                <td className="py-5 px-10 text-[11px] text-slate-400 font-bold uppercase tracking-tighter">
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
                          <Card className="bg-white border-white shadow-sm rounded-3xl p-6 h-full flex flex-col justify-between group">
                            <div className="space-y-4">
                              <div className={`w-12 h-12 rounded-2xl bg-${tool.color}-50 text-${tool.color}-600 flex items-center justify-center transition-colors group-hover:bg-${tool.color}-600 group-hover:text-white`}>
                                <tool.icon size={24} />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{tool.title}</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">{tool.desc}</p>
                              </div>
                            </div>
                            <Button variant="outline" className={`mt-6 rounded-xl h-10 border-slate-200 text-xs font-bold text-slate-600 hover:text-${tool.color}-600 hover:border-${tool.color}-100 hover:bg-${tool.color}-50`}>
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
              <Card className="bg-white border-white shadow-sm rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl -mt-12 -mr-12" />
                <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity size={12} className="text-indigo-400" />
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
                        <span className="text-slate-400">{h.label}</span>
                        <span className={`text-${h.color}-600`}>{h.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: h.value.includes('%') ? h.value : '100%' }}
                          className={`h-full bg-${h.color}-500 rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Activity Log */}
              <Card className="bg-white border-white shadow-sm rounded-3xl p-6">
                <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock size={12} className="text-indigo-400" />
                  Event Stream
                </h4>
                <div className="space-y-6">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex gap-4 group">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-500`}>
                          {log.type === 'success' && <Check size={14} />}
                          {log.type === 'payment' && <DollarSign size={14} />}
                          {log.type === 'info' && <Info size={14} />}
                        </div>
                        {log.id !== activityLog.length && (
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-slate-100" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{log.action}</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{log.user || log.detail}</p>
                        <p className="text-[9px] font-black text-slate-300 uppercase mt-1 tracking-tighter">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-6 text-indigo-600 font-bold text-[10px] uppercase tracking-widest h-10 hover:bg-indigo-50 rounded-xl">Initialize Full Audit</Button>
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
      </TooltipProvider>
    </div>
  );
};

export default AdminDashboard;
