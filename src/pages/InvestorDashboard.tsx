import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Search, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, Activity, Zap, Heart, ShieldCheck, ArrowUpRight, Filter } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import ChatBox from "@/components/ChatBox";

interface Profile {
  id: string;
  name: string;
  user_type: string;
  is_approved?: boolean;
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
  founder_id: string;
  founder?: { name: string };
}

interface ChatRequest {
  id: string;
  idea_id: string;
  investor_id: string;
  founder_id: string;
  status: string;
}

const colors = ["#4338ca", "#6366f1", "#818cf8", "#a5b4fc"];
const growthData = [
  { month: "Jan", capital: 100000 },
  { month: "Feb", capital: 120000 },
  { month: "Mar", capital: 150000 },
  { month: "Apr", capital: 200000 },
  { month: "May", capital: 250000 },
  { month: "Jun", capital: 320000 },
];

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('investor-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate("/auth?mode=login");

    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single();
    if (!p) return navigate("/profile-setup?type=investor");
    setProfile(p);

    const { data: i } = await supabase.from("ideas").select("*, founder:profiles(name)").order("created_at", { ascending: false });
    setIdeas(i || []);

    const { data: r } = await supabase.from("chat_requests").select("*").eq("investor_id", p.id);
    setChatRequests(r || []);
    setIsLoading(false);
  };

  const handleReachOut = async (idea: Idea) => {
    if (!profile?.is_approved) {
      return toast({ title: "Verification Required", description: "Your profile is under review.", variant: "destructive" });
    }

    const existing = chatRequests.find(r => r.idea_id === idea.id);
    if (existing) {
       if (["accepted", "communicating", "deal_done"].includes(existing.status)) setSelectedChat(existing);
       else toast({ title: "Pending", description: "Request waiting for approval" });
       return;
    }

    const { data, error } = await supabase.from("chat_requests").insert({
      idea_id: idea.id, investor_id: profile.id, founder_id: idea.founder_id, status: "pending"
    }).select().single();

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Sent!", description: "Founder notified" });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-2 border-indigo-600 rounded-full border-t-transparent"></div></div>;

  const filtered = ideas.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.domain.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] -mr-64 -mt-64 opacity-50" />
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Rocket className="text-white w-6 h-6" /></div>
                <div>
                   <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-900">INNOVESTOR</span>
                      {profile?.is_approved && <Badge className="bg-green-500 text-white text-[10px] rounded-full px-2 py-0.5 flex gap-1 items-center"><ShieldCheck size={12}/> Verified LP</Badge>}
                   </div>
                   <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase">Investor Hub</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold truncate max-w-[150px]">Hello, {profile?.name}</span>
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => navigate("/"))} className="rounded-full font-bold">Logout</Button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Portfolio Value", value: "$1.2M", icon: DollarSign, color: "text-indigo-600" },
            { label: "Active Deals", value: chatRequests.filter(r => r.status === 'deal_done').length, icon: Activity, color: "text-slate-900" },
            { label: "Avg. ROI", value: "24.5%", icon: TrendingUp, color: "text-green-600" },
            { label: "Market State", value: "Bullish", icon: Zap, color: "text-amber-500" }
          ].map((stat, i) => (
            <Card key={i} className="bg-white border-0 shadow-lg group rounded-2xl">
              <CardContent className="p-6">
                <stat.icon className={`w-5 h-5 mb-4 ${stat.color}`} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-10">
           <Card className="lg:col-span-2 bg-white border-0 shadow-lg rounded-2xl">
              <CardHeader><CardTitle className="text-lg font-bold">Growth Trends</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={growthData}>
                    <Area type="monotone" dataKey="capital" stroke="#4338ca" fill="#4338ca20" strokeWidth={3} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" hide />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>
           <Card className="bg-white border-0 shadow-lg rounded-2xl p-6">
              <h3 className="font-bold mb-4">Investment Strategy</h3>
              <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Top Sector</p>
                      <p className="font-bold">FinTech & SaaS</p>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-xs">
                    Your portfolio is currently 15% above benchmark performance this quarter.
                  </div>
              </div>
           </Card>
        </div>

        <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input className="pl-12 h-12 rounded-xl border-0 shadow-lg" placeholder="Search ventures..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" className="h-12 rounded-xl border-0 shadow-lg px-6"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(idea => (
                <Card key={idea.id} className="bg-white border-0 shadow-lg rounded-2xl group overflow-hidden flex flex-col">
                  <div className="h-1 bg-slate-50 group-hover:bg-indigo-600 transition-colors" />
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-bold group-hover:text-indigo-600 transition-colors">{idea.title}</CardTitle>
                            <Badge variant="outline" className="text-[9px] uppercase tracking-widest mt-1">{idea.domain}</Badge>
                          </div>
                          <Heart className={`w-4 h-4 cursor-pointer ${watchlist.includes(idea.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} onClick={() => setWatchlist(prev => prev.includes(idea.id) ? prev.filter(x => x !== idea.id) : [...prev, idea.id])} />
                      </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                      <p className="text-xs text-slate-500 line-clamp-2 mb-6">{idea.description}</p>
                      <div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between">
                          <div><p className="text-[9px] font-black text-slate-400 uppercase">Target</p><p className="font-bold">${idea.investment_needed.toLocaleString()}</p></div>
                          <div className="text-right"><p className="text-[9px] font-black text-indigo-400 uppercase">Equity</p><p className="font-bold text-indigo-600">Pending</p></div>
                      </div>
                      <Button className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800" onClick={() => handleReachOut(idea)}>
                        {chatRequests.some(r => r.idea_id === idea.id) ? "Chat Access Granted" : "Reach Out to Founder"}
                      </Button>
                  </CardContent>
                </Card>
            ))}
        </div>
      </main>

      {selectedChat && profile && (
        <ChatBox
          chatRequest={selectedChat}
          currentUserId={profile.id}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </div>
  );
};

export default InvestorDashboard;
