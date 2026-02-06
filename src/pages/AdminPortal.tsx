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

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-slate-900 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Admin Portal</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">System Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 border-none pl-10 h-9 w-64 rounded-lg text-xs focus:ring-1 focus:ring-slate-200 transition-all placeholder:text-slate-400"
              />
            </div>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-semibold text-xs">
              <LogOut className="w-4 h-4 mr-2" /> Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Platform Revenue", value: `₹${payments.filter(p => p.status === 'success').reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}`, icon: DollarSign },
            { label: "Active Investors", value: users.filter(u => u.user_type === 'investor').length, icon: TrendingUp },
            { label: "Active Ideas", value: ideas.length, icon: Lightbulb },
            { label: "Closed Deals", value: ideas.filter(i => i.status === 'deal_done').length, icon: CheckCircle2 }
          ].map((stat, i) => (
            <Card key={i} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-md bg-slate-50 text-slate-600"><stat.icon className="w-4 h-4" /></div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-lg flex w-fit h-auto">
            <TabsTrigger value="overview" className="rounded-md px-5 font-bold py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex gap-2 text-xs">
              <LayoutDashboard size={14} /> Overview
            </TabsTrigger>
            <TabsTrigger value="ideas" className="rounded-md px-5 font-bold py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex gap-2 text-xs">
              <Lightbulb size={14} /> Ideas
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-md px-5 font-bold py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex gap-2 text-xs">
              <Users size={14} /> Users
            </TabsTrigger>
            <TabsTrigger value="financials" className="rounded-md px-5 font-bold py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all flex gap-2 text-xs">
              <CreditCard size={14} /> Financials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border-slate-200 p-6 rounded-xl shadow-sm">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <Activity className="w-4 h-4 text-slate-400" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payments.slice(0, 7).reverse().map(p => ({ date: format(new Date(p.created_at), 'MMM dd'), amount: Number(p.amount) }))}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05} />
                          <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} dx={-10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: '8px', fontSize: '11px' }}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#0f172a" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 p-6 rounded-xl shadow-sm">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <Users className="w-4 h-4 text-slate-400" />
                    Community Mix
                  </CardTitle>
                </CardHeader>
                <div className="h-[280px] w-full flex flex-col justify-center">
                  <div className="space-y-6">
                    {[
                      { label: 'Founders', count: users.filter(u => u.user_type === 'founder').length, color: 'bg-slate-900' },
                      { label: 'Investors', count: users.filter(u => u.user_type === 'investor').length, color: 'bg-slate-500' },
                      { label: 'Pending', count: users.filter(u => !u.user_type).length, color: 'bg-slate-300' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-slate-900">{item.count}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
              <Card className="bg-white border-slate-200 p-6 rounded-xl shadow-sm">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-sm font-bold">Latest Investments</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {investments.length > 0 ? investments.slice(0, 5).map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{inv.idea?.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{inv.investor?.name} invested</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">₹{inv.amount?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{format(new Date(inv.created_at), 'MMM dd')}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">No recent investments</div>
                  )}
                </div>
              </Card>

              <Card className="bg-white border-slate-200 p-6 rounded-xl shadow-sm">
                <CardHeader className="px-0 pt-0 pb-6">
                  <CardTitle className="text-sm font-bold">Verification Queue</CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {users.filter(u => !u.is_approved).slice(0, 5).map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-md">
                          <AvatarFallback className="bg-white text-slate-400 text-[10px] border border-slate-100">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.user_type}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="h-8 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                      >
                        Review
                      </Button>
                    </div>
                  ))}
                  {users.filter(u => !u.is_approved).length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">Verification queue is empty</div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ideas">
            <div className="grid gap-4">
              {filteredIdeas.length > 0 ? filteredIdeas.map((idea) => (
                <div key={idea.id} className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{idea.title}</h3>
                      <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-bold uppercase tracking-wider px-2 h-5">{idea.domain}</Badge>
                      {idea.status === 'approved' && <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider px-2 h-5">Live</Badge>}
                      {idea.status === 'pending' && <Badge className="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold uppercase tracking-wider px-2 h-5">Pending</Badge>}
                      {idea.status === 'rejected' && <Badge className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold uppercase tracking-wider px-2 h-5">Rejected</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1.5"><Users size={12} /> {idea.founder?.name}</span>
                      <span className="flex items-center gap-1.5"><DollarSign size={12} /> Goal: ${idea.investment_needed?.toLocaleString()}</span>
                      <span className="flex items-center gap-1.5"><Activity size={12} /> Status: {idea.status || 'Draft'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      onChange={(e) => updateIdeaStatus(idea.id, e.target.value)}
                      value={idea.status || ""}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 h-9 text-[11px] font-bold text-slate-600 focus:outline-none hover:bg-slate-100 transition-all cursor-pointer"
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
              )) : (
                <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-xs font-medium">No ideas found matching your criteria</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid gap-4">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm group cursor-pointer hover:border-slate-300 transition-colors"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 rounded-lg border border-slate-100">
                      <AvatarFallback className="bg-slate-50 text-slate-400 font-bold text-xs">{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                        <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400 uppercase font-bold tracking-wider px-2 h-4">{user.user_type}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mb-1">Status</p>
                      {user.is_approved ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 flex gap-1 items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase"><Check size={10} /> Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-600 border border-amber-100 flex gap-1 items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter"><AlertCircle size={10} /> Pending</Badge>
                      )}
                    </div>
                    <Button
                      variant={user.is_approved ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleApprove(user.id, !!user.is_approved);
                      }}
                      className={`rounded-lg h-9 px-5 font-bold text-[11px] transition-all ${user.is_approved ? 'border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'}`}
                    >
                      {user.is_approved ? "Revoke" : "Verify Profile"}
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-xs font-medium">No users found matching your search</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="financials">
            <Card className="bg-white border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Transaction ID</th>
                      <th className="py-4 px-6">Client</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.length > 0 ? payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="text-xs font-mono text-slate-400">{pay.razorpay_payment_id || pay.razorpay_order_id?.substring(0, 12)}...</span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{pay.profiles?.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{pay.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-xs text-slate-900">₹{pay.amount?.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <Badge className={`${pay.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : pay.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'} border text-[9px] font-bold uppercase px-2 h-5`}>
                            {pay.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={12} strokeWidth={2.5} /> {format(new Date(pay.created_at), 'MMM dd, HH:mm')}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 text-xs font-medium">No transactions recorded</td>
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
