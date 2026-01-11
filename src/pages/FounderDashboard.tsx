import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Plus, LogOut, MessageSquare, TrendingUp, DollarSign, Lightbulb, Check, X, Zap, Shield } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
}

interface ChatRequest {
  id: string;
  idea_id: string;
  investor_id: string;
  founder_id: string;
  status: string;
  investor?: Profile;
  idea?: { title: string };
}

const COLORS = ["hsl(250, 84%, 54%)", "hsl(172, 66%, 50%)", "hsl(43, 96%, 56%)", "hsl(280, 65%, 60%)"];

const FounderDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatRequest | null>(null);
  const [showAddIdeaDialog, setShowAddIdeaDialog] = useState(false);
  const [hasPaidSubscription, setHasPaidSubscription] = useState(false);
  
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    domain: "",
    investment_needed: "",
  });

  useEffect(() => {
    fetchData();
    // Check subscription status
    const paid = localStorage.getItem("ideaSubscriptionPaid") === "true";
    setHasPaidSubscription(paid);
    
    // Open dialog if redirected from payment
    if (searchParams.get("showAddIdea") === "true") {
      setShowAddIdeaDialog(true);
    }
  }, [searchParams]);

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
      navigate("/profile-setup?type=founder");
      return;
    }

    if (profileData.user_type !== "founder") {
      navigate("/investor-dashboard");
      return;
    }

    setProfile(profileData);

    // Fetch ideas
    const { data: ideasData } = await supabase
      .from("ideas")
      .select("*")
      .eq("founder_id", profileData.id)
      .order("created_at", { ascending: false });

    setIdeas(ideasData || []);

    // Fetch chat requests
    const { data: requestsData } = await supabase
      .from("chat_requests")
      .select(`
        *,
        investor:profiles!chat_requests_investor_id_fkey(id, name, user_type),
        idea:ideas!chat_requests_idea_id_fkey(title)
      `)
      .eq("founder_id", profileData.id);

    setChatRequests(requestsData || []);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAddIdea = async () => {
    if (!profile) return;
    
    setIsAddingIdea(true);
    
    const { error } = await supabase.from("ideas").insert({
      founder_id: profile.id,
      title: newIdea.title,
      description: newIdea.description,
      domain: newIdea.domain,
      investment_needed: parseFloat(newIdea.investment_needed),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Idea submitted successfully" });
      setNewIdea({ title: "", description: "", domain: "", investment_needed: "" });
      fetchData();
    }
    
    setIsAddingIdea(false);
  };

  const handleChatRequestAction = async (requestId: string, action: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("chat_requests")
      .update({ status: action })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Request ${action}` });
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate statistics
  const totalIdeas = ideas.length;
  const totalInvestmentNeeded = ideas.reduce((sum, idea) => sum + idea.investment_needed, 0);
  const totalInvestmentReceived = ideas.reduce((sum, idea) => sum + (idea.investment_received || 0), 0);
  const fundingGap = totalInvestmentNeeded - totalInvestmentReceived;

  const statusData = [
    { name: "Pending", value: ideas.filter((i) => i.status === "pending").length },
    { name: "In Progress", value: ideas.filter((i) => i.status === "in_progress").length },
    { name: "Funded", value: ideas.filter((i) => i.status === "funded").length },
    { name: "Completed", value: ideas.filter((i) => i.status === "completed").length },
  ].filter((d) => d.value > 0);

  const investmentData = ideas.map((idea) => ({
    name: idea.title.length > 15 ? idea.title.substring(0, 15) + "..." : idea.title,
    needed: idea.investment_needed,
    received: idea.investment_received || 0,
  }));

  const pendingRequests = chatRequests.filter((r) => r.status === "pending");
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
              <p className="text-sm text-muted-foreground">Founder Dashboard</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ideas</p>
                  <p className="text-3xl font-bold">{totalIdeas}</p>
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
                  <p className="text-sm text-muted-foreground">Investment Received</p>
                  <p className="text-3xl font-bold">${totalInvestmentReceived.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Funding Gap</p>
                  <p className="text-3xl font-bold">${fundingGap.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chat Requests</p>
                  <p className="text-3xl font-bold">{pendingRequests.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle>Ideas by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No ideas yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <CardTitle>Investment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {investmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={investmentData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="needed" fill="hsl(250, 84%, 54%)" name="Needed" />
                    <Bar dataKey="received" fill="hsl(172, 66%, 50%)" name="Received" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No ideas yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Requests */}
        {pendingRequests.length > 0 && (
          <Card className="glass border-0 mb-8">
            <CardHeader>
              <CardTitle>Pending Chat Requests</CardTitle>
              <CardDescription>Investors want to connect with you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{request.investor?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Interested in: {request.idea?.title}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleChatRequestAction(request.id, "accepted")}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChatRequestAction(request.id, "rejected")}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Chats */}
        {acceptedChats.length > 0 && (
          <Card className="glass border-0 mb-8">
            <CardHeader>
              <CardTitle>Active Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {acceptedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div>
                      <p className="font-medium">{chat.investor?.name}</p>
                      <p className="text-sm text-muted-foreground">{chat.idea?.title}</p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ideas Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Ideas</h2>
          <Dialog open={showAddIdeaDialog} onOpenChange={setShowAddIdeaDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              {hasPaidSubscription ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Submit New Idea</DialogTitle>
                    <DialogDescription>Share your innovative idea with investors</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newIdea.title}
                        onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                        placeholder="Your idea title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newIdea.description}
                        onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                        placeholder="Describe your idea in detail"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Input
                        id="domain"
                        value={newIdea.domain}
                        onChange={(e) => setNewIdea({ ...newIdea, domain: e.target.value })}
                        placeholder="e.g., FinTech, HealthTech"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="investment">Investment Needed ($)</Label>
                      <Input
                        id="investment"
                        type="number"
                        value={newIdea.investment_needed}
                        onChange={(e) => setNewIdea({ ...newIdea, investment_needed: e.target.value })}
                        placeholder="100000"
                      />
                    </div>
                    <Button onClick={handleAddIdea} className="w-full" disabled={isAddingIdea}>
                      {isAddingIdea ? "Submitting..." : "Submit Idea"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-2xl">Unlock Idea Submission</DialogTitle>
                    <DialogDescription className="text-center">
                      Subscribe to share your innovative ideas with investors
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl text-muted-foreground line-through">₹1000/-</span>
                        <span className="text-4xl font-bold text-primary">₹199/-</span>
                      </div>
                      <p className="text-sm text-accent mt-2 font-medium">Limited Time Offer - 80% OFF!</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent" />
                        </div>
                        <span>Unlimited idea submissions</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent" />
                        </div>
                        <span>Direct chat with investors</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent" />
                        </div>
                        <span>Priority visibility & analytics</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 text-lg" 
                      onClick={() => {
                        setShowAddIdeaDialog(false);
                        navigate("/payment");
                      }}
                    >
                      Pay Now - ₹199
                    </Button>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                      <Shield className="w-4 h-4" />
                      <span>Secure payment · 100% money-back guarantee</span>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="glass border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{idea.title}</CardTitle>
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
                <CardDescription>{idea.domain}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {idea.description}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Investment Needed</span>
                    <span className="font-medium">${idea.investment_needed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Received</span>
                    <span className="font-medium text-accent">
                      ${(idea.investment_received || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          ((idea.investment_received || 0) / idea.investment_needed) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {ideas.length === 0 && (
            <Card className="glass border-0 md:col-span-2 lg:col-span-3">
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first innovative idea
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

export default FounderDashboard;
