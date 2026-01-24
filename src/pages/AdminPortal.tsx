import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Lightbulb, CheckCircle2, ShieldCheck, AlertCircle, LayoutDashboard, LogOut, Search, Check, XCircle, ChevronRight, DollarSign, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
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
    const { data: userData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: ideaData } = await supabase.from("ideas").select("*, founder:profiles(name)").order("created_at", { ascending: false });
    setUsers(userData || []);
    setIdeas(ideaData || []);
    setIsLoading(false);
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
            { label: "Total Accounts", value: users.length, icon: Users, color: "indigo" },
            { label: "Verification Pending", value: users.filter(u => !u.is_approved).length, icon: AlertCircle, color: "amber" },
            { label: "Idea Pipeline", value: ideas.length, icon: Lightbulb, color: "emerald" },
            { label: "Deals Finalized", value: ideas.filter(i => i.status === 'deal_done').length, icon: CheckCircle2, color: "blue" }
          ].map((stat, i) => (
            <Card key={i} className="bg-[#161922] border-white/5 shadow-2xl relative overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-white/5 text-white`}><stat.icon className="w-5 h-5" /></div>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="ideas" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="ideas" className="rounded-lg px-6 font-bold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Idea Verification</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg px-6 font-bold py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Users Management</TabsTrigger>
          </TabsList>

          <TabsContent value="ideas">
            <div className="grid gap-3">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="bg-[#161922] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-white text-lg">{idea.title}</h3>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-0 text-[10px] font-black tracking-widest uppercase">{idea.domain}</Badge>
                      {idea.status === 'approved' && <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] font-black tracking-widest uppercase flex gap-1"><Globe size={12}/> Live</Badge>}
                      {idea.status === 'pending' && <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px] font-black tracking-widest uppercase">Draft</Badge>}
                      {idea.status === 'rejected' && <Badge className="bg-red-500/10 text-red-500 border-0 text-[10px] font-black tracking-widest uppercase">Rejected</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5"><Users size={14}/> {idea.founder?.name}</span>
                      <span className="flex items-center gap-1.5"><DollarSign size={14}/> Goal: ${idea.investment_needed?.toLocaleString()}</span>
                      <span className="flex items-center gap-1.5"><ChevronRight size={14}/> Status: {idea.status || 'Pending'}</span>
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
                <div key={user.id} className="bg-[#161922] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all group">
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
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><Check size={12}/> Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-500 border-0 flex gap-1 items-center px-2 py-0.5 rounded-full text-[10px]"><AlertCircle size={12}/> Pending</Badge>
                      )}
                    </div>
                    <Button 
                      variant={user.is_approved ? "outline" : "default"} 
                      onClick={() => toggleApprove(user.id, !!user.is_approved)} 
                      className={`rounded-xl h-10 px-6 font-bold text-xs shadow-lg transition-all ${!user.is_approved ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                      {user.is_approved ? "Revoke Access" : "Verify Profile"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
