import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ShieldCheck,
  AlertCircle,
  LayoutDashboard,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalIdeas: 0,
    pendingVerifications: 0,
    pendingIdeas: 0
  });
  const [view, setView] = useState<"overview" | "users" | "ideas">("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    const { data: ideasData } = await supabase
      .from("ideas")
      .select("*, founder:profiles!ideas_founder_id_fkey(name)")
      .order("created_at", { ascending: false });

    if (profilesData) setUsers(profilesData);
    if (ideasData) setIdeas(ideasData);

    setStats({
      totalUsers: profilesData?.length || 0,
      totalIdeas: ideasData?.length || 0,
      pendingVerifications: profilesData?.filter((u: any) => !u.is_approved).length || 0,
      pendingIdeas: ideasData?.filter((i: any) => i.status === "pending").length || 0
    });
  };

  const verifyUser = async (userId: string, status: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: status })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `User ${status ? "verified" : "unverified"}` });
      fetchData();
    }
  };

  const reviewIdea = async (ideaId: string, status: string) => {
    const { error } = await supabase
      .from("ideas")
      .update({ status: status })
      .eq("id", ideaId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Idea status updated to ${status}` });
      fetchData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const chartData = [
    { name: "Mon", users: 4, ideas: 2 },
    { name: "Tue", users: 7, ideas: 5 },
    { name: "Wed", users: 5, ideas: 8 },
    { name: "Thu", users: 12, ideas: 10 },
    { name: "Fri", users: 15, ideas: 12 },
    { name: "Sat", users: 10, ideas: 7 },
    { name: "Sun", users: 18, ideas: 15 },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#1e293b]/50 backdrop-blur-xl flex flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white">@admin</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Innovestor Internal</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { label: "Overview", icon: LayoutDashboard, id: "overview" },
              { label: "User Verification", icon: Users, id: "users" },
              { label: "Idea Review", icon: Lightbulb, id: "ideas" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${
                  view === item.id 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${view === item.id ? "rotate-90 opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">Exit Portal</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen p-10 overflow-auto">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Enterprise Overview</h2>
                <p className="text-slate-400 font-medium">Monitoring Innovestor Ecosystem Health</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Server
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Total Members", value: stats.totalUsers, icon: Users, color: "indigo" },
                { label: "Venture Projects", value: stats.totalIdeas, icon: Lightbulb, color: "amber" },
                { label: "Pending Verification", value: stats.pendingVerifications, icon: ShieldCheck, color: "indigo", alert: stats.pendingVerifications > 0 },
                { label: "Ideas to Review", value: stats.pendingIdeas, icon: AlertCircle, color: "indigo", alert: stats.pendingIdeas > 0 },
              ].map((stat, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-800 shadow-2xl hover:border-indigo-500/50 transition-all group rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      {stat.alert && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/20 animate-pulse">Action Required</Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <CardHeader className="border-b border-slate-800 bg-slate-900/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white flex gap-2 items-center">
                      {view === "overview" ? "Recent Activity Queue" : view === "users" ? "User Management" : "Idea Review Repository"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-800">
                    {view !== "ideas" && users.filter(u => view === "users" ? true : !u.is_approved).slice(0, 10).map((user) => (
                      <div key={user.id} className="p-4 hover:bg-slate-800/30 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <span className="font-bold text-indigo-400">{user.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{user.email} • {user.user_type}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className={`rounded-lg transition-all ${user.is_approved ? "text-green-400 bg-green-400/10" : "text-slate-500 hover:text-green-400 hover:bg-green-400/10"}`}
                            onClick={() => verifyUser(user.id, !user.is_approved)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {view !== "users" && ideas.filter(i => view === "ideas" ? true : i.status === "pending").slice(0, 10).map((idea) => (
                      <div key={idea.id} className="p-4 hover:bg-slate-800/30 transition-all flex items-center justify-between group border-l-4 border-l-indigo-600/30">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400">
                            <Lightbulb className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{idea.title}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">By {idea.founder?.name} • ${idea.investment_needed}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 rounded-lg text-xs" onClick={() => reviewIdea(idea.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400 h-8 rounded-lg text-xs" onClick={() => reviewIdea(idea.id, "rejected")}>Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Side Charts / Insights */}
              <div className="space-y-8">
                <Card className="bg-slate-900/50 border-slate-800 rounded-2xl shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                      <TrendingUp className="w-4 h-4 text-indigo-400" /> Platform Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px" }} />
                        <Area type="monotone" dataKey="users" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
