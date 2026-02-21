import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/ui/Logo";
import { Users, Lightbulb, CheckCircle2, ShieldCheck, AlertCircle, LayoutDashboard, LogOut, Search, Check, XCircle, ChevronRight, DollarSign, Globe, TrendingUp, CreditCard, Activity, Calendar, Shield, Zap, Bell, Hammer, Database, Settings, Filter, Download, ArrowUpRight, Clock, Info, Mail, Phone, Linkedin, FileText, Target, Menu, X, ChevronDown, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminPortal = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [upiTransactions, setUpiTransactions] = useState<any[]>([]);;
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [ideaFilter, setIdeaFilter] = useState("all");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

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
      const { data: ideaData } = await supabase.from("ideas").select("*, founder:profiles!ideas_founder_id_fkey(name, email, current_job, education, experience, linkedin_profile, avatar_url, phone, domain, investment_capital, interested_domains, created_at)").order("created_at", { ascending: false });
      const { data: payData } = await (supabase as any).from("payments").select("*, profiles(name, email)").order("created_at", { ascending: false });
      const { data: investData } = await (supabase as any).from("investment_records").select("*, founder:profiles!founder_id(name), investor:profiles!investor_id(name), idea:ideas(*)").order("created_at", { ascending: false });

      // Fetch UPI Transactions
      const { data: upiData } = await (supabase as any).from("upi_transactions").select("*, idea:ideas(title), founder:profiles!founder_id(name), investor:profiles!investor_id(name)").order("created_at", { ascending: false });

      setUsers(userData || []);
      setIdeas(ideaData || []);
      setPayments(payData || []);
      setInvestments(investData || []);
      setUpiTransactions(upiData || []);
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
      fetchData();
    }
  };

  const updateIdeaStatus = async (ideaId: string, newStatus: string) => {
    const { error } = await supabase.from("ideas").update({ status: newStatus }).eq("id", ideaId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Idea status updated to ${newStatus}` });
      fetchData();
    }
  };

  const combinedEvents = [
    ...users.filter(u => u.created_at).map(u => ({ id: u.id, type: 'user', title: 'New Registration', detail: `${u.name || 'Anonymous'} joined as ${u.user_type}`, time: new Date(u.created_at), color: 'yellow', icon: Users })),
    ...ideas.filter(i => i.created_at).map(i => ({ id: i.id, type: 'idea', title: 'Idea Submission', detail: `${i.title} by ${i.founder?.name || 'Unknown'}`, time: new Date(i.created_at), color: 'amber', icon: Lightbulb })),
    ...payments.filter(p => p.created_at).map(p => {
      const payer = users.find(u => u.id === p.profile_id || u.user_id === p.user_id) || p.profiles;
      return {
        id: p.id,
        type: 'payment',
        title: 'Platform Payment',
        detail: `₹${p.amount?.toLocaleString()} from ${payer?.name || 'Unknown User'} (${p.status})`,
        time: new Date(p.created_at),
        color: 'emerald',
        icon: DollarSign
      };
    }),
    ...upiTransactions.filter(t => t.created_at).map(t => ({
      id: t.id,
      type: 'upi',
      title: t.status === 'completed' ? 'UPI Payment Confirmed' : 'UPI Payment Pending',
      detail: `₹${t.amount?.toLocaleString()} - ${t.investor?.name || 'Investor'} → ${t.founder?.name || 'Founder'} for ${t.idea?.title || 'Idea'}`,
      time: new Date(t.created_at),
      color: t.status === 'completed' ? 'teal' : 'orange',
      icon: CreditCard
    }))
  ].sort((a, b) => {
    const timeA = a.time instanceof Date && !isNaN(a.time.getTime()) ? a.time.getTime() : 0;
    const timeB = b.time instanceof Date && !isNaN(b.time.getTime()) ? b.time.getTime() : 0;
    return timeB - timeA;
  }).slice(0, 12);

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.user_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIdeas = ideas.filter(i => {
    const matchesSearch = i.title?.toLowerCase().includes(searchQuery.toLowerCase()) || i.domain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = ideaFilter === "all" || i.status === ideaFilter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-brand-yellow/20 border-t-brand-yellow rounded-full animate-spin" />
      <p className="text-slate-400 font-medium text-sm animate-pulse tracking-tight">Initializing Platform Management...</p>
    </div>
  );

  const navigation = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Members', icon: Users },
    { id: 'ideas', label: 'Idea Hub', icon: Lightbulb },
    { id: 'financials', label: 'Financials', icon: CreditCard },
    { id: 'tools', label: 'System Tools', icon: Settings },
  ];

  const handleToolAction = (tool: string) => {
    switch (tool) {
      case 'Notification Engine':
        const msg = prompt("Enter global system broadcast message:");
        if (msg) toast({ title: "Broadcast Sent", description: "Message propagated to all active nodes." });
        break;
      case 'System Lockdown':
        setIsMaintenanceMode(!isMaintenanceMode);
        toast({
          title: !isMaintenanceMode ? "Platform Locked" : "Platform Live",
          description: !isMaintenanceMode ? "Maintenance mode engaged." : "All systems operational.",
          variant: !isMaintenanceMode ? "destructive" : "default"
        });
        break;
      case 'Database Sync':
        setIsLoading(true);
        setTimeout(() => {
          fetchData();
          toast({ title: "Sync Complete", description: "Orphaned data purged. Integrity verified." });
        }, 1500);
        break;
      case 'Audit Stream':
        setActiveTab('overview');
        break;
      default:
        toast({ title: "Protocol Initiated", description: "Standard safety checks completed." });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged Out", description: "Session terminated securely." });
      navigate("/");
    } catch (error) {
      toast({ title: "Error", description: "Failed to sign out", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans antialiased overflow-hidden flex relative">
      {isMaintenanceMode && (
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 z-[100] animate-pulse" />
      )}
      <TooltipProvider>

        {/* Sidebar Backdrop (mobile only) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`bg-[#020617] border-r border-slate-800 transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'fixed inset-y-0 left-0 w-64 lg:relative' : 'hidden lg:flex w-20'}`}
        >
          <div className="p-6 flex items-center justify-between border-b border-slate-800 h-20">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              {isSidebarOpen && (
                <span className="font-bold text-lg tracking-tight text-white truncate">INNOVESTOR</span>
              )}
            </div>
            {isSidebarOpen && (
              <Button variant="ghost" size="icon" className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} />
              </Button>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Icon size={20} className={isActive ? 'text-brand-yellow' : 'group-hover:text-slate-200'} />
                  {isSidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
                  {isActive && isSidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-yellow shadow-[0_0_10px_rgba(239,191,4,0.5)]" />}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="font-semibold text-sm">Log Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          <header className="h-16 sm:h-20 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 z-40">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-slate-400 hover:bg-slate-800"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <div>
                <h2 className="text-xl font-bold text-white capitalize">{activeTab}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">System Live</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Global database search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border-slate-800 pl-10 h-10 w-64 rounded-xl text-xs focus:ring-1 focus:ring-brand-yellow transition-all placeholder:text-slate-600 font-medium text-white"
                />
              </div>

              <div className="h-6 w-[1px] bg-slate-800" />

              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {users.slice(0, 3).map((u, i) => (
                    <Avatar key={i} className="w-8 h-8 border-2 border-[#0f172a] ring-1 ring-slate-800">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback className="text-[10px] font-bold bg-slate-800">{u.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-brand-yellow/20 text-brand-yellow border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold">+24</div>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-slate-800 rounded-full relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-brand-yellow rounded-full border-2 border-[#0f172a]" />
                </Button>
              </div>
            </div>
          </header>

          {/* Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 custom-scrollbar">

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Platform Revenue", value: `₹${payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}`, icon: DollarSign, trend: "+12.5%", color: "yellow" },
                      { label: "Elite Investors", value: users.filter(u => u.user_type === 'investor').length, icon: TrendingUp, trend: "+3 this week", color: "emerald" },
                      { label: "Idea Pipeline", value: ideas.length, icon: Lightbulb, trend: "8 new", color: "amber" },
                      { label: "Success Rate", value: `${Math.round((ideas.filter(i => i.status === 'deal_done').length / (ideas.length || 1)) * 100)}%`, icon: Zap, trend: "Top 5%", color: "yellow" }
                    ].map(({ icon: Icon, ...stat }, i) => (
                      <Card key={i} className="bg-slate-900/50 border-slate-800/50 shadow-sm rounded-2xl border hover:border-slate-700 transition-all">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl bg-slate-800 text-${stat.color}-400`}>
                              <Icon size={20} />
                            </div>
                            <Badge variant="outline" className={`bg-${stat.color}-500/5 text-${stat.color}-400 border-none font-black text-[9px]`}>
                              {stat.trend}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold text-white tabular-nums">{stat.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-12 gap-4 sm:gap-8">
                    {/* Main Chart */}
                    <Card className="col-span-12 lg:col-span-8 bg-slate-900/50 border-slate-800 border shadow-sm rounded-2xl overflow-hidden">
                      <CardHeader className="p-4 sm:p-6 border-b border-slate-800/50 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold text-white">Financial Activity Stream</CardTitle>
                          <CardDescription className="text-xs text-slate-500 mt-1">Real-time payment and investment distribution</CardDescription>
                        </div>
                        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
                          {['7D', '1M', '1Y'].map(t => (
                            <button key={t} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${t === '1M' ? 'bg-brand-yellow text-brand-charcoal shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={payments.filter(p => p.created_at).slice(0, 15).reverse().map(p => ({ date: format(new Date(p.created_at), 'MMM dd'), amount: Number(p.amount) || 0 }))}>
                            <defs>
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                              itemStyle={{ color: '#818cf8' }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fill="url(#chartGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Side Feed */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                      <Card className="bg-slate-900/50 border-slate-800 border rounded-2xl h-[500px] shadow-sm flex flex-col">
                        <CardHeader className="p-6 border-b border-slate-800/50">
                          <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                            Platform Activity
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-brand-yellow/10 text-brand-yellow px-2 py-0.5 rounded-full border border-brand-yellow/20">{users.length} Active Node</span>
                              <Button variant="ghost" size="icon" onClick={fetchData} className="h-6 w-6 text-slate-500 hover:text-brand-yellow">
                                <Activity size={12} className={isLoading ? "animate-spin" : ""} />
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 overflow-y-auto no-scrollbar">
                          <div className="space-y-6">
                            {combinedEvents.map((evt) => {
                              const Icon = evt.icon;
                              return (
                                <div key={`${evt.type}-${evt.id}`} className="flex gap-4 group">
                                  <div className="relative shrink-0">
                                    <div className={`w-8 h-8 rounded-full bg-${evt.color}-500/10 flex items-center justify-center text-${evt.color}-500 border border-${evt.color}-500/20`}>
                                      <Icon size={14} />
                                    </div>
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[1px] h-full bg-slate-800/50" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-200">{evt.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{evt.detail}</p>
                                    <p className="text-[9px] text-slate-600 mt-1 font-bold italic uppercase">{formatDistanceToNow(evt.time, { addSuffix: true })}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
                          <Button variant="ghost" onClick={() => setActiveTab('tools')} className="w-full h-8 text-[10px] font-black uppercase text-brand-yellow hover:bg-brand-yellow/5">Open Audit Engine</Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/50 p-4 sm:p-6 rounded-2xl border border-slate-800 gap-3 sm:gap-0">
                    <div>
                      <h3 className="text-lg font-bold text-white">Member Directory</h3>
                      <p className="text-xs text-slate-500 font-medium">Authorizing and managing platform ecosystem access</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <Button variant="outline" onClick={() => setSearchQuery('investor')} className="border-slate-800 bg-slate-900 h-10 px-4 rounded-xl text-xs font-bold flex gap-2 text-slate-400"><Filter size={14} /> Investors Only</Button>
                      <Button onClick={() => fetchData()} className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal h-10 px-4 rounded-xl text-xs font-bold flex gap-2 shadow-lg shadow-brand-yellow/20"><Download size={14} /> Sync Database</Button>
                    </div>
                  </div>

                  <div className="bg-[#020617] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="py-4 px-6">Member Identity</th>
                            <th className="py-4 px-6">Account Class</th>
                            <th className="py-4 px-6">Contact Vector</th>
                            <th className="py-4 px-6">Verification</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-900/30 group transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-9 h-9 border border-slate-800">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="bg-slate-800 text-xs font-bold">{user.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-bold text-slate-200">{user.name || 'Anonymous'}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{format(new Date(user.created_at), 'MMMM yyyy')}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge className={`${user.user_type === 'investor' ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} border text-[9px] font-black uppercase tracking-tighter px-2`}>
                                  {user.user_type}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-xs text-slate-400 font-medium">{user.email}</td>
                              <td className="py-4 px-6">
                                {user.is_approved ? (
                                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <CheckCircle2 size={14} /> Verified
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                                    <Clock size={14} /> Pending
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }} className="h-8 w-8 p-0 text-slate-500 hover:text-white rounded-lg"><ChevronRight size={16} /></Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ideas' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    {['all', 'pending', 'approved', 'funded'].map(s => (
                      <button
                        key={s}
                        onClick={() => setIdeaFilter(s)}
                        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${ideaFilter === s ? 'border-brand-yellow text-brand-yellow' : 'border-transparent text-slate-500 hover:text-slate-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIdeas.map((idea) => (
                      <Card key={idea.id} className="bg-slate-900 border-slate-800 shadow-xl rounded-2xl overflow-hidden hover:border-brand-yellow/30 transition-all cursor-pointer group" onClick={() => setSelectedIdea(idea)}>
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-slate-800 text-slate-400 border-none text-[9px] font-black uppercase tracking-widest">{idea.domain}</Badge>
                            <Badge className={`${idea.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'} border-none text-[9px] font-black`}>{idea.status}</Badge>
                          </div>
                          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-brand-yellow transition-colors uppercase tracking-tight">{idea.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium mb-4">{idea.description}</p>
                          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 border border-slate-800">
                                <AvatarFallback className="text-[8px] bg-brand-yellow/10 text-brand-yellow font-bold">{idea.founder?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] font-bold text-slate-400">{idea.founder?.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Target Raise</p>
                              <p className="text-xs font-black text-brand-yellow">₹{idea.investment_needed?.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'financials' && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <Card className="bg-[#020617] border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-500/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                            <th className="py-6 px-8">Transaction Hash</th>
                            <th className="py-6 px-8">User Name</th>
                            <th className="py-6 px-8">Amount (INR)</th>
                            <th className="py-6 px-8">Timestamp</th>
                            <th className="py-6 px-8 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {payments.filter(p =>
                            p.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.razorpay_payment_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.razorpay_order_id?.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((p) => (
                            <tr key={p.id} className="hover:bg-slate-900 group transition-colors">
                              <td className="py-5 px-8 font-mono text-[10px] font-black text-slate-600 group-hover:text-brand-yellow transition-colors uppercase tracking-tighter">
                                {p.razorpay_payment_id || p.razorpay_order_id?.substring(0, 16)}
                              </td>
                              <td className="py-5 px-8">
                                {(() => {
                                  const payer = users.find(u => u.id === p.profile_id || u.user_id === p.user_id) || p.profiles;
                                  return (
                                    <>
                                      <p className="text-xs font-bold text-slate-200">{payer?.name || 'Unknown User'}</p>
                                      <p className="text-[10px] text-slate-500 font-medium">{payer?.email || 'No Email'}</p>
                                    </>
                                  );
                                })()}
                              </td>
                              <td className="py-5 px-8 font-black text-white text-sm">₹{p.amount?.toLocaleString()}</td>
                              <td className="py-5 px-8 text-xs text-slate-500 font-medium">{format(new Date(p.created_at), 'dd MMM, HH:mm')}</td>
                              <td className="py-5 px-8 text-right">
                                <Badge className={`${p.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} border-none text-[10px] font-black uppercase`}>
                                  {p.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'tools' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "Notification Engine", desc: "Push global infrastructure updates", icon: Bell, btn: "Dispatch Blast", color: "yellow" },
                    { title: "System Lockdown", desc: "Toggle platform maintenance states", icon: Hammer, btn: "Toggle Mode", color: "amber" },
                    { title: "Database Sync", desc: "Purge orphaned data relationships", icon: Database, btn: "Run Garbage Coll.", color: "emerald" },
                    { title: "Audit Stream", desc: "Detailed administrative trace logs", icon: Activity, btn: "View Full Flow", color: "slate" },
                    { title: "Security Protocols", desc: "Configure worldwide IP restrictions", icon: Shield, btn: "Policy Engine", color: "rose" },
                    { title: "Support Interface", desc: "High-priority ticket management", icon: Mail, btn: "Open Desk", color: "yellow" }
                  ].map(({ icon: Icon, ...tool }, i) => (
                    <Card key={i} className="bg-slate-900 border-slate-800 rounded-2xl p-6 hover:shadow-2xl transition-all group">
                      <div className="flex gap-4 mb-6">
                        <div className={`p-3 rounded-xl bg-slate-800 text-${tool.color}-400 group-hover:bg-${tool.color}-600 group-hover:text-white transition-all`}>
                          <Icon size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight">{tool.title}</h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">{tool.desc}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleToolAction(tool.title)}
                        className="w-full h-10 rounded-xl border-slate-800 text-slate-500 hover:text-white hover:border-brand-yellow hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest"
                      >
                        {tool.title === "System Lockdown" && isMaintenanceMode ? "Deactivate Mode" : tool.btn}
                      </Button>
                    </Card>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* User Review Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl bg-[#0f172a] border-slate-800 text-white rounded-[1.5rem] p-0 overflow-hidden outline-none">
            <ScrollArea className="max-h-[85vh]">
              <div className="p-10">
                <div className="flex items-center gap-6 mb-10">
                  <Avatar className="w-16 h-16 border-2 border-brand-yellow/20">
                    <AvatarImage src={selectedUser?.avatar_url} />
                    <AvatarFallback className="bg-slate-800 text-2xl font-black">{selectedUser?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUser?.name}</h4>
                      <Badge className="bg-brand-yellow/20 text-brand-yellow border-none font-black text-[9px] uppercase tracking-widest">{selectedUser?.user_type}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 font-medium mt-1">{selectedUser?.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-10">
                  <section className="space-y-6">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Professional Identity</p>
                      {[
                        { label: "Current Occupation", value: selectedUser?.current_job },
                        { label: "Academic Background", value: selectedUser?.education },
                        { label: "Primary Expertise", value: selectedUser?.domain },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800/50">
                          <p className="text-[9px] text-slate-600 font-black uppercase mb-1 tracking-widest">{item.label}</p>
                          <p className="text-xs font-bold text-slate-300">{item.value || "Not Declared"}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="space-y-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Detailed Career Context</p>
                    <div className="bg-slate-900 border border-slate-800/50 p-6 rounded-2xl h-[240px]">
                      <ScrollArea className="h-full pr-4">
                        <p className="text-xs text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">{selectedUser?.experience || "Professional narrative not submitted yet."}</p>
                      </ScrollArea>
                    </div>
                  </section>
                </div>

                {selectedUser?.user_type === 'investor' && (
                  <div className="mb-10 bg-brand-yellow/5 border border-brand-yellow/20 p-8 rounded-2xl">
                    <p className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.2em] mb-4">Investment Framework</p>
                    <div className="flex items-end justify-between gap-6">
                      <div>
                        <p className="text-[9px] text-brand-yellow/80 font-bold uppercase mb-1">Stated Capital Facility</p>
                        <p className="text-4xl font-black text-white tabular-nums tracking-tighter">₹{selectedUser?.investment_capital?.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {selectedUser?.interested_domains?.map((d: string) => (
                          <Badge key={d} className="bg-brand-yellow/10 text-brand-yellow border-none font-black text-[9px] tracking-widest">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800 pt-8 sticky bottom-0 bg-[#0f172a] -mx-10 -mb-10 p-10 mt-10">
                  <div className="flex gap-4">
                    <Button variant="outline" className="rounded-xl border-slate-800 text-slate-500 cursor-pointer" onClick={() => setSelectedUser(null)}>Dismiss Review</Button>
                    <Button
                      className={`${selectedUser?.is_approved ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black uppercase text-[10px] tracking-[0.1em] px-8 rounded-xl`}
                      onClick={() => { toggleApprove(selectedUser.id, !!selectedUser.is_approved); setSelectedUser(null); }}
                    >
                      {selectedUser?.is_approved ? 'DEAUTHORIZE MEMBER' : 'GRANT FULL VERIFICATION'}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Idea Review Dialog */}
        <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
          <DialogContent className="max-w-4xl bg-[#0f172a] border-slate-800 text-white rounded-[2rem] p-0 overflow-hidden outline-none">
            <ScrollArea className="max-h-[90vh]">
              <div className="p-12">
                <div className="flex items-start justify-between mb-12">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Badge className="bg-brand-yellow/10 text-brand-yellow border-none font-black text-[9px] tracking-widest">{selectedIdea?.domain}</Badge>
                      <Badge className="bg-slate-800 text-slate-500 border-none font-black text-[9px] tracking-widest">SUBMISSION #{selectedIdea?.id?.substring(0, 6)}</Badge>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tight leading-none">{selectedIdea?.title}</h3>
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                      Proposed by <span className="text-white hover:underline cursor-pointer">{selectedIdea?.founder?.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      {format(new Date(selectedIdea?.created_at || Date.now()), 'dd MMMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mb-2">Live Status</p>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-bold text-xs px-6 py-2 rounded-xl">{selectedIdea?.status?.toUpperCase()}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-12">
                  <div className="md:col-span-8 space-y-8 sm:space-y-12">
                    <section>
                      <h5 className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Target size={14} /> Critical Problem
                      </h5>
                      <div className="bg-slate-900 border border-slate-800/50 p-8 rounded-3xl">
                        <p className="text-lg font-bold text-slate-300 italic leading-relaxed">
                          "{selectedIdea?.description?.split('\n\n')[0] || selectedIdea?.description}"
                        </p>
                      </div>
                    </section>
                    <section>
                      <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Lightbulb size={14} /> Solution Framework
                      </h5>
                      <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <p className="text-sm font-medium text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {selectedIdea?.description?.split('\n\n').slice(1).join('\n\n') || "No detailed solution text provided."}
                        </p>
                      </div>
                    </section>

                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: "Market Size", val: selectedIdea?.market_size || "Lite", icon: Globe, color: "yellow" },
                        { label: "Traction", val: selectedIdea?.traction || "Early", icon: TrendingUp, color: "emerald" },
                        { label: "Core Team", val: selectedIdea?.team_size || "1", icon: Users, color: "yellow" }
                      ].map(({ icon: Icon, ...item }, idx) => (
                        <div key={idx} className="bg-slate-900 p-6 rounded-[2rem] text-center border border-slate-800/50 hover:border-slate-700 transition-all">
                          <div className={`w-10 h-10 rounded-2xl bg-${item.color}-500/10 text-${item.color}-400 flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                            <Icon size={20} />
                          </div>
                          <p className="text-[9px] font-black text-slate-600 uppercase mb-1 tracking-widest">{item.label}</p>
                          <p className="text-sm font-black text-slate-200">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-8 sm:space-y-12">
                    <section>
                      <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Capitalization</h5>
                      <div className="bg-slate-900 border border-slate-800/50 p-8 rounded-[2rem] space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Funding Objective</p>
                          <p className="text-4xl font-black text-white tabular-nums tracking-tighter">₹{selectedIdea?.investment_needed?.toLocaleString()}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[10px] font-black uppercase text-slate-600">
                            <span>Secured: ₹{(selectedIdea?.investment_received || 0).toLocaleString()}</span>
                            <span className="text-brand-yellow">{Math.round(((selectedIdea?.investment_received || 0) / (selectedIdea?.investment_needed || 1)) * 100)}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-yellow rounded-full shadow-[0_0_10px_rgba(239,191,4,0.5)]" style={{ width: `${Math.min(((selectedIdea?.investment_received || 0) / (selectedIdea?.investment_needed || 1)) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Material Resources</h5>
                      <div className="space-y-3">
                        {selectedIdea?.media_url && (
                          <a href={selectedIdea.media_url} target="_blank" className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl border border-slate-800 hover:border-brand-yellow transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-brand-yellow/10 text-brand-yellow flex items-center justify-center"><FileText size={18} /></div>
                              <span className="text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">Pitch Deck</span>
                            </div>
                            <ExternalLink size={14} className="text-slate-600" />
                          </a>
                        )}
                        {selectedIdea?.website_url && (
                          <a href={selectedIdea.website_url} target="_blank" className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Globe size={18} /></div>
                              <span className="text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">Platform URL</span>
                            </div>
                            <ExternalLink size={14} className="text-slate-600" />
                          </a>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-10 sticky bottom-0 bg-[#0f172a] -mx-12 -mb-12 p-12 mt-12 z-20">
                  <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-4">Lifecycle State:</p>
                    <select
                      onChange={(e) => { updateIdeaStatus(selectedIdea.id, e.target.value); setSelectedIdea(null); }}
                      value={selectedIdea?.status || ""}
                      className="bg-transparent border-none text-xs font-black text-slate-300 focus:ring-0 cursor-pointer min-w-[200px]"
                    >
                      <option value="pending">Review Pending</option>
                      <option value="approved">Authorize Deployment</option>
                      <option value="rejected">Decline Submission</option>
                      <option value="in_progress">Active Market Deal</option>
                      <option value="funded">Capital Fully Secured</option>
                      <option value="deal_done">Deal Archived (Success)</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="ghost" className="rounded-xl text-slate-500 font-bold uppercase text-[10px] tracking-widest px-8" onClick={() => setSelectedIdea(null)}>Close Inspection</Button>
                    <Button className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-charcoal font-black uppercase text-[10px] tracking-widest px-10 rounded-xl" onClick={() => setSelectedIdea(null)}>Commit Decisions</Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

      </TooltipProvider >
    </div >
  );
};

export default AdminPortal;
