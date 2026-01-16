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
import { Rocket, Search, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, MapPin, Globe, Filter } from "lucide-react";
import ChatBox from "@/components/ChatBox";

interface Profile {
  id: string;
  name: string;
  user_type: string;
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

  const domains = ["all", ...new Set(ideas.map((i) => i.domain.toLowerCase()))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">INNOVESTOR</h1>
              <p className="text-sm text-muted-foreground">Investor Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">Welcome, {profile?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ideas, domains, or descriptions..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Filter className="w-4 h-4 mt-3 text-muted-foreground" />
            <select
              className="bg-white border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain.charAt(0).toUpperCase() + domain.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <Card key={idea.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{idea.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 font-medium text-primary">
                      {idea.domain}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-slate-50">
                    By {idea.founder?.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                  {idea.description}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Investment Needed</span>
                    <span className="font-bold text-slate-900">${idea.investment_needed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Secured</span>
                    <span className="font-bold text-accent">${(idea.investment_received || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(((idea.investment_received || 0) / idea.investment_needed) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button
                  className="w-full font-bold"
                  onClick={() => handleReachOut(idea)}
                  variant={getRequestStatus(idea.id) ? "outline" : "default"}
                >
                  {getRequestStatus(idea.id) === "accepted" || getRequestStatus(idea.id) === "communicating" || getRequestStatus(idea.id) === "deal_pending_investor" || getRequestStatus(idea.id) === "deal_done" ? (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Chat
                    </>
                  ) : getRequestStatus(idea.id) === "pending" ? (
                    "Request Pending"
                  ) : (
                    "Reach Out"
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No ideas found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
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
