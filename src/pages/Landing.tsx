import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Rocket, TrendingUp, Users, Lightbulb } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Rocket className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">INNOVESTOR</span>
        </div>
        <div className="flex gap-3">
          <Link to="/auth?mode=login">
            <Button variant="ghost" size="lg">
              Login
            </Button>
          </Link>
          <Link to="/auth?mode=register">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Create Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <div className="mb-6 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          Where Innovation Meets Investment
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          <span className="gradient-text">INNOVESTOR</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
          "Bridging the gap between visionary founders and strategic investors. 
          Transform your ideas into reality."
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link to="/auth?mode=register">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              Get Started
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6">
            Learn More
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full mt-8">
          <div className="glass rounded-2xl p-6 text-left hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Share Your Vision</h3>
            <p className="text-muted-foreground">
              Founders can showcase their innovative ideas to a network of eager investors.
            </p>
          </div>
          
          <div className="glass rounded-2xl p-6 text-left hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Investments</h3>
            <p className="text-muted-foreground">
              Investors discover curated opportunities aligned with their interests and capital.
            </p>
          </div>
          
          <div className="glass rounded-2xl p-6 text-left hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Direct Connection</h3>
            <p className="text-muted-foreground">
              Secure, encrypted chat to discuss ideas and negotiate terms privately.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-muted-foreground text-sm">
        © 2024 INNOVESTOR. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
