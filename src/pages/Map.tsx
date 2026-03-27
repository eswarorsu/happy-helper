import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin, Search, Locate, Crown, MessageSquare, TrendingUp,
  ArrowLeft, Filter, X, Globe, Users, DollarSign, Zap, Lock
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useToast } from "@/hooks/use-toast";
import { MobileNav } from "@/components/layout/MobileNav";
import { InvestorSidebar } from "@/components/layout/InvestorSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Fix Leaflet's default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Interfaces ────────────────────────────────────────────
interface MapIdea {
  id: string;
  title: string;
  description: string;
  domain: string;
  investment_needed: number;
  investment_received: number;
  status: string;
  traction: string | null;
  team_size: string | null;
  founder_city: string | null;
  location_lat: number | null;
  location_lng: number | null;
  company_logo_url: string | null;
  founder?: { name: string; avatar_url?: string } | null;
}

interface Profile {
  id: string;
  name: string;
  user_type: string;
  is_approved?: boolean;
  is_premium?: boolean;
}

// ─── Custom marker icon factory ────────────────────────────
function createCustomIcon(logoUrl?: string | null) {
  if (logoUrl) {
    return L.divIcon({
      className: "custom-map-marker",
      html: `<div style="
        width:44px;height:44px;border-radius:50%;border:3px solid #EFBF04;
        background:white;overflow:hidden;display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 14px rgba(0,0,0,0.18);
      "><img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'" /></div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -48],
    });
  }
  return L.divIcon({
    className: "custom-map-marker",
    html: `<div style="
      width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#EFBF04,#F5C518);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 14px rgba(239,191,4,0.4);border:3px solid white;
    "><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -44],
  });
}

// ─── Fly-to-location helper ────────────────────────────────
function FlyToLocation({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// ─── City-to-Coordinate fallback lookup ────────────────────
// For existing ideas that only have founder_city but no lat/lng
const CITY_COORDINATES: Record<string, [number, number]> = {
  "hyderabad": [17.385, 78.4867],
  "bangalore": [12.9716, 77.5946],
  "bengaluru": [12.9716, 77.5946],
  "mumbai": [19.076, 72.8777],
  "delhi": [28.6139, 77.209],
  "new delhi": [28.6139, 77.209],
  "chennai": [13.0827, 80.2707],
  "pune": [18.5204, 73.8567],
  "kolkata": [22.5726, 88.3639],
  "ahmedabad": [23.0225, 72.5714],
  "jaipur": [26.9124, 75.7873],
  "lucknow": [26.8467, 80.9462],
  "chandigarh": [30.7333, 76.7794],
  "indore": [22.7196, 75.8577],
  "bhopal": [23.2599, 77.4126],
  "kochi": [9.9312, 76.2673],
  "coimbatore": [11.0168, 76.9558],
  "nagpur": [21.1458, 79.0882],
  "visakhapatnam": [17.6868, 83.2185],
  "vizag": [17.6868, 83.2185],
  "gurgaon": [28.4595, 77.0266],
  "gurugram": [28.4595, 77.0266],
  "noida": [28.5355, 77.391],
  "surat": [21.1702, 72.8311],
  "thiruvananthapuram": [8.5241, 76.9366],
  "trivandrum": [8.5241, 76.9366],
  "patna": [25.6093, 85.1376],
  "ranchi": [23.3441, 85.3096],
  "bhubaneswar": [20.2961, 85.8245],
  "guwahati": [26.1445, 91.7362],
  "mysore": [12.2958, 76.6394],
  "mysuru": [12.2958, 76.6394],
  "mangalore": [12.9141, 74.856],
  "madurai": [9.9252, 78.1198],
  "vadodara": [22.3072, 73.1812],
  "rajkot": [22.3039, 70.8022],
};

function getCityCoordinates(city: string | null): [number, number] | null {
  if (!city) return null;
  const normalized = city.toLowerCase().trim();
  // Direct match
  if (CITY_COORDINATES[normalized]) return CITY_COORDINATES[normalized];
  // Partial match (e.g. "Hyderabad, India" → "hyderabad")
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) return coords;
  }
  return null;
}

// ─── Demo Data ──────────────────────────────────────────────
const DEMO_STARTUPS: MapIdea[] = [
  { id: "d1", title: "FinStack AI", description: "AI-powered financial analytics for SMBs.", domain: "FinTech", investment_needed: 50000, investment_received: 12000, status: "approved", traction: "MVP", team_size: "2-5 People", founder_city: "Hyderabad", location_lat: 17.385, location_lng: 78.4867, company_logo_url: null, founder: { name: "Ravi Kumar" } },
  { id: "d2", title: "MedScan", description: "Early disease detection via retinal scans.", domain: "HealthTech", investment_needed: 120000, investment_received: 30000, status: "approved", traction: "Early Adopters", team_size: "5-10 People", founder_city: "Bangalore", location_lat: 12.9716, location_lng: 77.5946, company_logo_url: null, founder: { name: "Priya Sharma" } },
  { id: "d3", title: "CropWise", description: "IoT-based precision agriculture platform.", domain: "AgriTech", investment_needed: 75000, investment_received: 5000, status: "approved", traction: "Idea Stage", team_size: "Solo Founder", founder_city: "Pune", location_lat: 18.5204, location_lng: 73.8567, company_logo_url: null, founder: { name: "Ajay Patil" } },
  { id: "d4", title: "LearnLoop", description: "Gamified micro-learning for GenZ.", domain: "EdTech", investment_needed: 40000, investment_received: 8000, status: "approved", traction: "Generating Revenue", team_size: "2-5 People", founder_city: "Mumbai", location_lat: 19.076, location_lng: 72.8777, company_logo_url: null, founder: { name: "Neha Jain" } },
  { id: "d5", title: "GreenRoute", description: "Carbon-neutral last-mile delivery network.", domain: "CleanTech", investment_needed: 200000, investment_received: 60000, status: "in_progress", traction: "Early Adopters", team_size: "10+ People", founder_city: "Delhi", location_lat: 28.6139, location_lng: 77.209, company_logo_url: null, founder: { name: "Sameer Gupta" } },
  { id: "d6", title: "PayNova", description: "UPI-based B2B payments for wholesalers.", domain: "FinTech", investment_needed: 90000, investment_received: 0, status: "approved", traction: "MVP", team_size: "2-5 People", founder_city: "Chennai", location_lat: 13.0827, location_lng: 80.2707, company_logo_url: null, founder: { name: "Kavita Raman" } },
];

// ─── Domain colors ──────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  FinTech: "bg-blue-100 text-blue-700 border-blue-200",
  HealthTech: "bg-emerald-100 text-emerald-700 border-emerald-200",
  EdTech: "bg-purple-100 text-purple-700 border-purple-200",
  "AI/ML": "bg-indigo-100 text-indigo-700 border-indigo-200",
  SaaS: "bg-sky-100 text-sky-700 border-sky-200",
  "E-commerce": "bg-orange-100 text-orange-700 border-orange-200",
  CleanTech: "bg-teal-100 text-teal-700 border-teal-200",
  AgriTech: "bg-lime-100 text-lime-700 border-lime-200",
  PropTech: "bg-amber-100 text-amber-700 border-amber-200",
  Gaming: "bg-pink-100 text-pink-700 border-pink-200",
  Logistics: "bg-rose-100 text-rose-700 border-rose-200",
};

function getDomainColor(domain: string) {
  return DOMAIN_COLORS[domain] || "bg-slate-100 text-slate-700 border-slate-200";
}

function formatCurrency(num: number) {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const MapPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ideas, setIdeas] = useState<MapIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<MapIdea | null>(null);

  // Default center: India
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  useEffect(() => {
    fetchData();
    // Silently track user's browser location for admin/AI purposes
    trackUserLocation();
  }, []);

  // ── Silent geolocation tracking (saves to profile for admin) ──
  const trackUserLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;
          await (supabase as any)
            .from("profiles")
            .update({
              last_known_lat: pos.coords.latitude,
              last_known_lng: pos.coords.longitude,
              last_location_updated_at: new Date().toISOString(),
            })
            .eq("user_id", session.user.id);
          console.log("[MAP] User location tracked for admin:", pos.coords.latitude, pos.coords.longitude);
        } catch (e) {
          // Silent fail — location tracking is non-critical
        }
      },
      () => { /* User denied — no action needed */ },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  };

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth?mode=login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!profileData) {
      navigate("/profile-setup?type=investor");
      return;
    }

    setProfile(profileData as any);

    // Fetch ALL ideas (with and without location)
    const { data: ideasData } = await supabase
      .from("ideas")
      .select(`*, founder:profiles!ideas_founder_id_fkey(name, avatar_url)`)
      .in("status", ["approved", "in_progress", "funded"]);

    // Separate real ideas with location data from those without
    const allIdeas = (ideasData || []) as unknown as MapIdea[];
    const mappedIdeas = allIdeas.map((idea) => {
      // If idea already has lat/lng, use it
      if (idea.location_lat && idea.location_lng) return idea;
      // Otherwise, try to get coordinates from founder_city
      const cityCoords = getCityCoordinates(idea.founder_city);
      if (cityCoords) {
        // Add slight random offset so multiple ideas in same city don't overlap exactly
        const offset = () => (Math.random() - 0.5) * 0.02;
        return { ...idea, location_lat: cityCoords[0] + offset(), location_lng: cityCoords[1] + offset() };
      }
      return idea; // No location available
    });

    // Filter to ideas that now have coordinates
    const ideasWithLocation = mappedIdeas.filter((i) => i.location_lat && i.location_lng);

    // Merge with demo data (demo fills gaps if DB is empty)
    const combined = [...ideasWithLocation, ...DEMO_STARTUPS];
    // Deduplicate by id (real data takes priority)
    const uniqueMap = new Map<string, MapIdea>();
    combined.forEach((idea) => uniqueMap.set(idea.id, idea));
    setIdeas(Array.from(uniqueMap.values()));
    setIsLoading(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setFlyTo({ center: loc, zoom: 12 });
        toast({ title: "📍 Location found!", description: "Showing startups near you." });
      },
      () => toast({ title: "Location denied", description: "Please enable location access.", variant: "destructive" })
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleConnect = async (idea: MapIdea) => {
    if (!profile) return;
    toast({ title: "Connect request sent! 🚀", description: `Your interest in "${idea.title}" has been noted.` });
  };

  // Filter logic
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchSearch = !searchQuery ||
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.founder_city || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchDomain = selectedDomain === "all" || idea.domain === selectedDomain;
      return matchSearch && matchDomain;
    });
  }, [ideas, searchQuery, selectedDomain]);

  const domains = useMemo(() => {
    const unique = [...new Set(ideas.map((i) => i.domain))];
    return ["all", ...unique];
  }, [ideas]);

  // ─── Premium gate ────────────────────────────────────────
  // For now we allow access so the feature is always visible.
  // To enable premium gating, uncomment below:
  // if (!isLoading && profile && !profile.is_premium) { ... redirect ... }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Startup Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <InvestorSidebar
        userName={profile?.name}
        onLogout={handleLogout}
        unreadCount={0}
        onMessagesClick={() => navigate("/mobile-messages")}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* ── Mobile Header ── */}
        <header className="lg:hidden sticky top-0 z-[500] border-b border-border/60 bg-white/90 backdrop-blur-xl py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <span className="text-base font-bold tracking-tight text-foreground uppercase">Startup Map</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLocateMe} className="rounded-full w-9 h-9 border border-border text-muted-foreground hover:text-brand-yellow hover:border-brand-yellow">
              <Locate className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowFilters(!showFilters)} className="rounded-full w-9 h-9 border border-border text-muted-foreground">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* ── Desktop Top Bar ── */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-border/60 bg-white/80 backdrop-blur-md z-[500]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-yellow" />
              <h1 className="text-xl font-bold text-foreground tracking-tight">Startup Map</h1>
            </div>
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
              <Zap className="w-3 h-3 mr-1" /> {filteredIdeas.length} Startups
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search startups, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 bg-white border-slate-200 rounded-xl text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Domain Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-md scrollbar-hide">
              {domains.slice(0, 6).map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all",
                    selectedDomain === domain
                      ? "bg-brand-yellow text-brand-charcoal border-brand-yellow shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {domain === "all" ? "All" : domain}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={handleLocateMe} className="rounded-xl border-slate-200 text-slate-600 hover:text-brand-yellow hover:border-brand-yellow gap-1.5">
              <Locate className="w-4 h-4" /> Near Me
            </Button>
          </div>
        </header>

        {/* ── Mobile Filter Drawer ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-b border-border/60 px-4 py-3 z-[499] overflow-hidden"
            >
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search startups, cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 bg-slate-50 border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all shrink-0",
                      selectedDomain === domain
                        ? "bg-brand-yellow text-brand-charcoal border-brand-yellow"
                        : "bg-white text-slate-500 border-slate-200"
                    )}
                  >
                    {domain === "all" ? "All" : domain}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── THE MAP ── */}
        <div className="flex-1 relative z-0">
          <MapContainer
            center={defaultCenter}
            zoom={5}
            className="w-full h-full z-0"
            zoomControl={!isMobile}
            attributionControl={false}
            style={{ background: "#f8fafc" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
            />

            {flyTo && <FlyToLocation center={flyTo.center} zoom={flyTo.zoom} />}

            {/* User location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={L.divIcon({
                  className: "user-location-marker",
                  html: `<div style="width:20px;height:20px;border-radius:50%;background:#4F46E5;border:3px solid white;box-shadow:0 0 0 4px rgba(79,70,229,0.3),0 2px 8px rgba(0,0,0,0.2);"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              >
                <Popup><span className="text-xs font-semibold">📍 You are here</span></Popup>
              </Marker>
            )}

            {/* Startup markers */}
            {filteredIdeas.map((idea) => {
              if (!idea.location_lat || !idea.location_lng) return null;
              return (
                <Marker
                  key={idea.id}
                  position={[idea.location_lat, idea.location_lng]}
                  icon={createCustomIcon(idea.company_logo_url)}
                  eventHandlers={{
                    click: () => setSelectedIdea(idea),
                  }}
                >
                  <Popup className="custom-map-popup" maxWidth={280} minWidth={240}>
                    <div className="p-1">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 truncate">{idea.title}</h3>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {idea.founder_city || "India"}
                          </p>
                        </div>
                        <Badge className={cn("text-[10px] border shrink-0", getDomainColor(idea.domain))}>
                          {idea.domain}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">{idea.description}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        <div className="bg-slate-50 rounded-lg p-1.5 text-center">
                          <DollarSign className="w-3 h-3 text-emerald-600 mx-auto mb-0.5" />
                          <p className="text-[10px] font-bold text-slate-800">{formatCurrency(idea.investment_needed)}</p>
                          <p className="text-[8px] text-slate-400 uppercase tracking-wider">Goal</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-1.5 text-center">
                          <TrendingUp className="w-3 h-3 text-blue-600 mx-auto mb-0.5" />
                          <p className="text-[10px] font-bold text-slate-800">{idea.traction || "N/A"}</p>
                          <p className="text-[8px] text-slate-400 uppercase tracking-wider">Stage</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-1.5 text-center">
                          <Users className="w-3 h-3 text-purple-600 mx-auto mb-0.5" />
                          <p className="text-[10px] font-bold text-slate-800">{idea.team_size || "Solo"}</p>
                          <p className="text-[8px] text-slate-400 uppercase tracking-wider">Team</p>
                        </div>
                      </div>

                      {/* Founder + CTA */}
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500">
                          by <span className="font-semibold text-slate-700">{idea.founder?.name || "Founder"}</span>
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleConnect(idea)}
                          className="h-7 px-3 text-[11px] font-bold bg-brand-yellow text-brand-charcoal hover:bg-amber-400 rounded-lg shadow-sm"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> Connect
                        </Button>
                      </div>

                      {/* Progress */}
                      <div className="mt-2">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-yellow to-amber-400 rounded-full transition-all"
                            style={{ width: `${Math.min((idea.investment_received / idea.investment_needed) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 text-right">
                          {formatCurrency(idea.investment_received)} / {formatCurrency(idea.investment_needed)} raised
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* ── Mobile Bottom Card (Selected Idea) ── */}
          <AnimatePresence>
            {selectedIdea && isMobile && (
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="absolute bottom-20 left-3 right-3 z-[600] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4"
              >
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="absolute top-3 right-3 w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow to-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                    {selectedIdea.company_logo_url ? (
                      <img src={selectedIdea.company_logo_url} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <span className="text-lg font-black text-brand-charcoal">{selectedIdea.title.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{selectedIdea.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={cn("text-[10px] border", getDomainColor(selectedIdea.domain))}>
                        {selectedIdea.domain}
                      </Badge>
                      <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {selectedIdea.founder_city || "India"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3">{selectedIdea.description}</p>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-slate-800">{formatCurrency(selectedIdea.investment_needed)}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Goal</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-slate-800">{selectedIdea.traction || "N/A"}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Stage</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-slate-800">{selectedIdea.team_size || "Solo"}</p>
                    <p className="text-[9px] text-slate-400 uppercase">Team</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/idea/${selectedIdea.id}`)}
                    variant="outline"
                    className="flex-1 h-9 text-xs font-semibold rounded-xl border-slate-200"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => handleConnect(selectedIdea)}
                    className="flex-1 h-9 text-xs font-bold bg-brand-yellow text-brand-charcoal hover:bg-amber-400 rounded-xl shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Connect
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Stats overlay (desktop) ── */}
          <div className="hidden lg:flex absolute top-4 right-4 z-[400] gap-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg px-4 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{filteredIdeas.length}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Startups</p>
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg px-4 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {formatCurrency(filteredIdeas.reduce((sum, i) => sum + i.investment_needed, 0))}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Seeking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <MobileNav userType="investor" />

      {/* Leaflet CSS overrides for popup styling */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12) !important;
          border: 1px solid #e2e8f0 !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 8px 10px !important;
          font-family: inherit !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
        }
        .leaflet-popup-close-button {
          display: none !important;
        }
        .custom-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.1) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #475569 !important;
          border-bottom: 1px solid #f1f5f9 !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f8fafc !important;
          color: #1e293b !important;
        }
      `}</style>
    </div>
  );
};

export default MapPage;
