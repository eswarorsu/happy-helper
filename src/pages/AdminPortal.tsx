import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Lightbulb, CheckCircle2, ShieldCheck, AlertCircle, LayoutDashboard, LogOut, Search, Check, XCircle, ChevronRight, DollarSign, Globe, TrendingUp, CreditCard, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { format } from "date-fns";

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  if (isLoading) return <div className="min-h-screen bg-[#0f1115] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-indigo-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 font-sans">
      <header className="border-b border-white/5 bg-[#161922]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">ADMIN PORTAL</h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Control Center v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search global data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 pl-10 h-10 w-64 rounded-xl text-xs focus:ring-indigo-600 transition-all"
              />
            </div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold text-xs">
              <LogOut className="w-4 h-4 mr-2" /> Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-10">
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Platform Revenue", value: `₹${payments.filter(p => p.status === 'success').reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Active Investors", value: users.filter(u => u.user_type === 'investor').length, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
            { label: "Idea Pipeline", value: ideas.length, icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Deals Closed", value: ideas.filter(i => i.status === 'deal_done').length, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" }
          ].map((stat, i) => (
            <Card key={i} className="bg-[#161922] border-white/5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                  <Badge variant="outline" className="border-white/5 text-[10px] text-slate-500">Live Updates</Badge>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl flex w-fit">
            <TabsTrigger value="overview" className="rounded-lg px-6 font-bold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all flex gap-2">
              <LayoutDashboard size={14} /> Overview
            </TabsTrigger>
            <TabsTrigger value="ideas" className="rounded-lg px-6 font-bold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all flex gap-2">
              <Lightbulb size={14} /> Idea Verification
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg px-6 font-bold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all flex gap-2">
              <Users size={14} /> Users
            </TabsTrigger>
            <TabsTrigger value="financials" className="rounded-lg px-6 font-bold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all flex gap-2">
              <CreditCard size={14} /> Financials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-[#161922] border-white/5 p-6 rounded-2xl">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Revenue Growth
                  </CardTitle>
                  <CardDescription className="text-slate-500">Daily transaction volume across the platform</CardDescription>
                </CardHeader>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payments.slice(0, 7).reverse().map(p => ({ date: format(new Date(p.created_at), 'MMM dd'), amount: Number(p.amount) }))}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                        itemStyle={{ color: '#6366f1' }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-[#161922] border-white/5 p-6 rounded-2xl">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    User Distribution
                  </CardTitle>
                </CardHeader>
                <div className="h-[300px] w-full flex flex-col justify-center">
                  <div className="space-y-6">
                    {[
                      { label: 'Founders', count: users.filter(u => u.user_type === 'founder').length, color: 'bg-indigo-500' },
                      { label: 'Investors', count: users.filter(u => u.user_type === 'investor').length, color: 'bg-emerald-500' },
                      { label: 'Unassigned', count: users.filter(u => !u.user_type).length, color: 'bg-slate-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-white">{item.count} users</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full`}
                            style={{ width: `${(item.count / (users.length || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#161922] border-white/5 p-6 rounded-2xl">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-lg font-bold">Recent closed deals</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {investments.length > 0 ? investments.slice(0, 5).map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{inv.idea?.title}</p>
                          <p className="text-[10px] text-slate-500">{inv.investor?.name} → {inv.founder?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-500">₹{inv.amount?.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-500">{format(new Date(inv.created_at), 'MMM dd')}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-500 text-xs">No investments recorded yet</div>
                  )}
                </div>
              </Card>

              <Card className="bg-[#161922] border-white/5 p-6 rounded-2xl">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-lg font-bold">Pending Approvals</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {users.filter(u => !u.is_approved).slice(0, 5).map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-white/5 text-[10px]">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-white">{user.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{user.user_type}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="h-8 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg"
                      >
                        Review Profile
                      </Button>
                    </div>
                  ))}
                  {users.filter(u => !u.is_approved).length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">All caught up! No pending approvals.</div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ideas">
            <div className="grid gap-3">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="bg-[#161922] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-white text-lg">{idea.title}</h3>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-0 text-[10px] font-black tracking-widest uppercase">{idea.domain}</Badge>
                      {idea.status === 'approved' && <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-black tracking-widest uppercase flex gap-1"><Globe size={12} /> Live</Badge>}
                      {idea.status === 'pending' && <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px] font-black tracking-widest uppercase">Draft</Badge>}
                      {idea.status === 'rejected' && <Badge className="bg-red-500/10 text-red-500 border-0 text-[10px] font-black tracking-widest uppercase">Rejected</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5"><Users size={14} /> {idea.founder?.name}</span>
                      <span className="flex items-center gap-1.5"><DollarSign size={14} /> Goal: ${idea.investment_needed?.toLocaleString()}</span>
                      <span className="flex items-center gap-1.5"><ChevronRight size={14} /> Status: {idea.status || 'Pending'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      onChange={(e) => updateIdeaStatus(idea.id, e.target.value)}
                      value={idea.status || ""}
                      className="bg-[#0f1115] border border-white/10 rounded-xl px-4 h-10 text-xs font-bold text-slate-400 focus:outline-none hover:border-white/20 transition-all"
                    >
                      <option value="pending">Reviewing</option>
                      <option value="approved">Approve & Publish</option>
                      <option value="rejected">Reject</option>
                      <option value="in_progress">In Progress</option>
                      <option value="funded">Funded</option>
                      <option value="deal_done">Deal Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid gap-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#161922] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all group cursor-pointer"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-white/5 group-hover:border-indigo-500/30 transition-all shadow-xl">
                      <AvatarFallback className="bg-white/5 text-slate-400 font-black">{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{user.name}</h3>
                        <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 uppercase font-black tracking-widest">{user.user_type}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Authorization</p>
                      {user.is_approved ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><Check size={12} /> Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-500 border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><AlertCircle size={12} /> Pending</Badge>
                      )}
                    </div>
                    <Button
                      variant={user.is_approved ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleApprove(user.id, !!user.is_approved);
                      }}
                      className={`rounded-xl h-10 px-6 font-bold text-xs shadow-lg transition-all ${!user.is_approved ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                      {user.is_approved ? "Revoke Access" : "Verify Profile"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="financials">
            <Card className="bg-[#161922] border-white/5 p-6 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="pb-4 pt-0 px-4">Transaction ID</th>
                      <th className="pb-4 pt-0 px-4">User</th>
                      <th className="pb-4 pt-0 px-4">Amount</th>
                      <th className="pb-4 pt-0 px-4">Status</th>
                      <th className="pb-4 pt-0 px-4">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.length > 0 ? payments.map((pay) => (
                      <tr key={pay.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">{pay.razorpay_payment_id || pay.razorpay_order_id?.substring(0, 12)}...</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-xs font-bold text-white">{pay.profiles?.name}</p>
                            <p className="text-[10px] text-slate-500">{pay.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-black text-xs text-white">₹{pay.amount?.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <Badge className={`${pay.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : pay.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'} border-0 text-[10px] font-black uppercase tracking-tighter`}>
                            {pay.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={12} /> {format(new Date(pay.created_at), 'PPp')}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-500 text-xs">No transactions recorded on the platform</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
