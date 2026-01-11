import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, LogOut, MessageSquare, Search, DollarSign, Lightbulb, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChatBox from "@/components/ChatBox";

interface Profile {
  id: string;
  name: string;
  user_type: string;
  interested_domains: string[] | null;
}

interface FounderInfo {
  id: string;
  name: string;
  user_type?: string;
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
  founder?: FounderInfo;
}

interface ChatRequest {
  id: string;
  idea_id: string;
  investor_id: string;
  founder_id: string;
  status: string;
  founder?: FounderInfo;
  idea?: { title: string };
}

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth?mode=login");
      return;
    }

    // Fetch profile
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

    // Fetch all ideas with founder info
    const { data: ideasData } = await supabase
      .from("ideas")
      .select(`
        *,
        founder:founder_id(id, name)
      `)
      .order("created_at", { ascending: false });

    setIdeas(ideasData || []);

    // Fetch chat requests
    const { data: requestsData } = await supabase
      .from("chat_requests")
      .select(`
        *,
        founder:profiles!chat_requests_founder_id_fkey(id, name, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title)
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

    // Check if request already exists
    const existingRequest = chatRequests.find((r) => r.idea_id === idea.id);
    if (existingRequest) {
      if (existingRequest.status === "accepted") {
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
      })
      .select(`
        *,
        founder:profiles!chat_requests_founder_id_fkey(id, name, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title)
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get unique domains for filter
  const domains = [...new Set(ideas.map((idea) => idea.domain))];

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = domainFilter === "all" || idea.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  const acceptedChats = chatRequests.filter((r) => r.status === "accepted");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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
            <span className="text-sm text-muted-foreground">Welcome, {profile?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Ideas</p>
                  <p className="text-3xl font-bold">{ideas.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Chats</p>
                  <p className="text-3xl font-bold">{acceptedChats.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Investment Capacity</p>
                  <p className="text-3xl font-bold">
                    ${profile?.interested_domains ? "Active" : "Set up"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Chats */}
        {acceptedChats.length > 0 && (
          <Card className="glass border-0 mb-8">
            <CardHeader>
              <CardTitle>Active Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {acceptedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors min-w-[200px]"
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {chat.founder?.name?.charAt(0) || "F"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{chat.founder?.name}</p>
                      <p className="text-xs text-muted-foreground">{chat.idea?.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ideas Grid */}
        <h2 className="text-2xl font-bold mb-6">Discover Ideas</h2>
        <div className="space-y-4">
          {filteredIdeas.map((idea) => {
            const requestStatus = getRequestStatus(idea.id);
            return (
              <Card key={idea.id} className="glass border-0 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{idea.title}</h3>
                        <Badge variant="secondary">{idea.domain}</Badge>
                        <Badge
                          variant={
                            idea.status === "funded"
                              ? "default"
                              : idea.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {idea.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{idea.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">By: </span>
                          <span className="font-medium">{idea.founder?.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Investment Needed: </span>
                          <span className="font-medium text-primary">
                            ${idea.investment_needed.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress: </span>
                          <span className="font-medium text-accent">
                            {Math.round(
                              ((idea.investment_received || 0) / idea.investment_needed) * 100
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {requestStatus === "accepted" ? (
                        <Button
                          onClick={() => {
                            const chat = chatRequests.find((r) => r.idea_id === idea.id);
                            if (chat) setSelectedChat(chat);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Open Chat
                        </Button>
                      ) : requestStatus === "pending" ? (
                        <Button variant="secondary" disabled>
                          Request Pending
                        </Button>
                      ) : requestStatus === "rejected" ? (
                        <Button variant="outline" disabled>
                          Request Declined
                        </Button>
                      ) : (
                        <Button onClick={() => handleReachOut(idea)}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Reach Out
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredIdeas.length === 0 && (
            <Card className="glass border-0">
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No ideas found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || domainFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Check back later for new investment opportunities"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Chat Dialog */}
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
