import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Search, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, MapPin, Globe, Filter, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, Zap, Heart, ShieldCheck } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import ChatBox from "@/components/ChatBox";

const COLORS = ["#4338ca", "#6366f1", "#818cf8", "#a5b4fc"];

const portfolioData = [
  { name: "FinTech", value: 400 },
  { name: "HealthTech", value: 300 },
  { name: "EdTech", value: 300 },
  { name: "SaaS", value: 200 },
];

const growthData = [
  { month: "Jan", capital: 100000, profit: 5000 },
  { month: "Feb", capital: 120000, profit: 8000 },
  { month: "Mar", capital: 150000, profit: 12000 },
  { month: "Apr", capital: 200000, profit: 18000 },
  { month: "May", capital: 250000, profit: 25000 },
  { month: "Jun", capital: 320000, profit: 35000 },
];

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
  founder?: Profile;
  idea?: { title: string; investment_needed: number };
}

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('investor-dashboard-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_requests' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas' },
        () => fetchData()
      )
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
      navigate("/profile-setup?type=investor");
      return;
    }

    if (profileData.user_type !== "investor") {
      navigate("/founder-dashboard");
      return;
    }

    setProfile(profileData);

    const { data: ideasData } = await supabase
      .from("ideas")
      .select(`
        *,
        founder:profiles!ideas_founder_id_fkey(name)
      `)
      .order("created_at", { ascending: false });

    setIdeas(ideasData || []);

    const { data: requestsData } = await supabase
      .from("chat_requests")
      .select(`
        *,
        founder:profiles!chat_requests_founder_id_fkey(id, name, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title, investment_needed)
      `)
      .eq("investor_id", profileData.id);

    setChatRequests(requestsData || []);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleReachOut = async (idea: Idea) => {
    if (!profile) return;

    if (!profile?.is_approved) {
      toast({
        title: "Verification Required",
        description: "Your profile is under review. You'll be able to reach out once verified.",
        variant: "destructive",
      });
      return;
    }

    const existingRequest = chatRequests.find((r) => r.idea_id === idea.id);
    if (existingRequest) {
      const activeStatuses = ["accepted", "communicating", "deal_pending_investor", "deal_done"];
      if (activeStatuses.includes(existingRequest.status)) {
        setSelectedChat(existingRequest);
      } else {
        toast({
          title: "Request pending",
          description: "Your chat request is waiting for approval",
        });
      }
      return;
    }

    const { data, error } = await supabase
      .from("chat_requests")
      .insert({
        idea_id: idea.id,
        investor_id: profile.id,
        founder_id: idea.founder_id,
        status: "pending",
      })
      .select(`
        *,
        founder:profiles!chat_requests_founder_id_fkey(id, name, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title, investment_needed)
      `)
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent!", description: "Waiting for founder's approval" });
      setChatRequests([...chatRequests, data]);
    }
  };

  const getRequestStatus = (ideaId: string) => {
    const request = chatRequests.find((r) => r.idea_id === ideaId);
    return request?.status;
  };

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedDomain === "all" || idea.domain.toLowerCase() === selectedDomain.toLowerCase();
    return matchesSearch && matchesDomain;
  });

  const toggleWatchlist = (ideaId: string) => {
    setWatchlist(prev =>
      prev.includes(ideaId) ? prev.filter(id => id !== ideaId) : [...prev, ideaId]
    );
    toast({
      title: watchlist.includes(ideaId) ? "Removed from watchlist" : "Added to watchlist",
      duration: 2000
    });
  };

  const marketTrends = Object.entries(
    ideas.reduce((acc: Record<string, number>, idea) => {
      const domain = idea.domain || "Other";
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const domains = ["all", ...new Set(ideas.map((i) => i.domain.toLowerCase()))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 font-sans relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] -ml-64 -mb-64" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900">INNOVESTOR</span>
                  {profile?.is_approved && (
                    <Badge className="bg-green-500 text-white gap-1 px-2 py-0.5 rounded-full flex items-center text-[10px]">
                      <ShieldCheck size={12}/> Verified LP
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-1 uppercase">Investor Hub</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-900">Welcome, {profile?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full font-bold">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-10">
        {/* Portfolio Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Deployed", value: "$1.2M", icon: DollarSign, color: "text-indigo-600", trend: "+12.5%", positive: true },
            { label: "Active Deals", value: chatRequests.filter(r => r.status === 'deal_done').length, icon: Activity, color: "text-slate-900", trend: "Stable", positive: true },
            { label: "Avg. RoI", value: "24.8%", icon: TrendingUp, color: "text-green-600", trend: "+2.1%", positive: true },
            { label: "Market Trend", value: "Bullish", icon: Zap, color: "text-amber-500", trend: "High", positive: true },
          ].map((stat, i) => (
            <Card key={i} className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-2xl overflow-hidden">
              <div className="h-1 w-full bg-slate-50 group-hover:bg-indigo-600 transition-colors" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {stat.trend}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          <Card className="lg:col-span-2 bg-white border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Portfolio Growth & Inflows</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338ca" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4338ca" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="capital" stroke="#4338ca" fillOpacity={1} fill="url(#colorCapital)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Hot Domains (Market Trends)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marketTrends} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={80}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#4338ca" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Growth Insight</p>
                <p className="text-[11px] text-indigo-900 font-medium">
                  {marketTrends[0] ? `${marketTrends[0].name} is currently the top-moving sector with the highest founder activity.` : "Waiting for market data..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Filter by domain, tech, or title..."
              className="pl-12 h-12 bg-white border-0 shadow-lg rounded-2xl font-medium focus:ring-indigo-600 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-3 bg-white px-4 rounded-2xl border-0 shadow-lg">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                className="bg-transparent h-12 text-sm font-bold text-slate-600 focus:outline-none min-w-[120px]"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                {domains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain === "all" ? "All Domains" : domain.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIdeas.map((idea) => {
            const isWatchlisted = watchlist.includes(idea.id);
            const status = getRequestStatus(idea.id);

            return (
              <Card key={idea.id} className="bg-white border-0 shadow-lg hover:shadow-2xl transition-all group overflow-hidden rounded-2xl flex flex-col relative">
                <div className={`h-1 w-full ${status === 'deal_done' ? 'bg-indigo-600' : 'bg-slate-50'} group-hover:bg-indigo-600 transition-colors`} />

                <button
                  onClick={() => toggleWatchlist(idea.id)}
                  className={`absolute top-4 right-4 p-2 rounded-xl transition-all duration-300 z-20 ${isWatchlisted ? 'bg-red-50 text-red-500 scale-110 shadow-sm' : 'bg-slate-50 text-slate-300 hover:text-red-400 hover:bg-red-50'}`}
                >
                  <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                </button>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between mr-8">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {idea.title} {status === "deal_done" && "🤝"}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 mt-1">
                        {idea.domain}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-50/50 border-slate-100">
                      By {idea.founder?.name}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                    {idea.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 group-hover:bg-white transition-colors">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target</p>
                      <p className="text-sm font-black text-slate-900">${idea.investment_needed.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/30 border border-indigo-100 group-hover:bg-white transition-colors">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Secured</p>
                      <p className="text-sm font-black text-indigo-600">${(idea.investment_received || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Project Analytics Section */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold mb-2">
                        <span className="text-slate-400 uppercase tracking-tighter">Funding Progress</span>
                        <span className="text-slate-900">{Math.round(((idea.investment_received || 0) / idea.investment_needed) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(((idea.investment_received || 0) / idea.investment_needed) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/5 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Est. Profits</span>
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> +18.4%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400 uppercase">Operational Spend</span>
                        <span className="text-slate-600">$4.2K / mo</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className={`w-full h-12 rounded-xl font-bold transition-all shadow-lg ${status === 'deal_done' || status === 'accepted' || status === 'communicating'
                      ? 'bg-indigo-600 text-white shadow-indigo-100 hover:shadow-indigo-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    onClick={() => handleReachOut(idea)}
                    variant={status ? "outline" : "default"}
                  >
                    {status === "accepted" || status === "communicating" || status === "deal_pending_investor" || status === "deal_done" ? (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Strategic Chat
                      </>
                    ) : status === "pending" ? (
                      "Interest Notified"
                    ) : (
                      "Reach Out to Founder"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-3xl border-2 border-dashed border-slate-200 mt-10">
            <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No matching ventures found</h3>
            <p className="text-slate-500 text-sm">Update your search filters or browse other domains</p>
          </div>
        )}
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
