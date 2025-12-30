import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Calculator,
  Target,
  BarChart3,
  Wallet,
  LineChart,
  MessageSquare,
  Activity,
  AlertCircle,
  Bell,
  Zap,
  ChevronRight,
  Trophy,
  User,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

type TabType = "overview" | "analytics" | "props" | "games";

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  // Tab navigation handlers
  const handleTabClick = (tab: TabType) => {
    if (tab === "overview") {
      setActiveTab("overview");
    } else if (tab === "analytics") {
      setLocation("/betting-analyzer");
    } else if (tab === "props") {
      setLocation("/props-analytics");
    } else if (tab === "games") {
      setLocation("/game-dashboard");
    }
  };
  const features = [
    {
      title: "Betting Analyzer",
      description: "Comprehensive analysis for ALL bet types with formula explanations",
      icon: Calculator,
      href: "/betting-analyzer",
      accent: "coral"
    },
    {
      title: "Game Props",
      description: "Browse all player props by game with Over/Under lines and odds",
      icon: Trophy,
      href: "/game-props",
      accent: "yellow"
    },
    {
      title: "Game Dashboard",
      description: "All player props & game lines for a selected game with adjustable sliders",
      icon: Target,
      href: "/game-dashboard",
      accent: "yellow"
    },
    {
      title: "Player Stats",
      description: "Live 2025-26 NBA player statistics (PPG, RPG, APG, FG%)",
      icon: TrendingUp,
      href: "/player-stats",
      accent: "coral"
    },
    {
      title: "Props Analytics",
      description: "Quick prop analysis with game selection and auto-populated stats",
      icon: Zap,
      href: "/props-analytics",
      accent: "yellow"
    },
    {
      title: "Team Analytics",
      description: "Offensive/defensive ratings, pace, and team trends for all 30 NBA teams",
      icon: BarChart3,
      href: "/team-analytics",
      accent: "yellow"
    },
    {
      title: "Player Comparison",
      description: "Side-by-side stat analysis of two players for betting decisions",
      icon: Target,
      href: "/player-comparison",
      accent: "coral"
    },
    {
      title: "Stat Trends",
      description: "Performance charts showing hot/cold streaks over recent games",
      icon: LineChart,
      href: "/stat-trends",
      accent: "yellow"
    },
    {
      title: "Live Odds",
      description: "Real-time betting lines from 9 major sportsbooks (moneyline, spreads, totals)",
      icon: TrendingUp,
      href: "/live-odds",
      accent: "coral"
    },
    {
      title: "Injury Report",
      description: "Real-time NBA injury updates to factor into betting decisions",
      icon: AlertCircle,
      href: "/injury-report",
      accent: "yellow"
    },
    {
      title: "Parlay Builder",
      description: "Build multi-leg parlays with structured tickets (Floor, Sharp, Core, Chaos)",
      icon: Calculator,
      href: "/parlay-builder",
      accent: "coral"
    },
    {
      title: "Bankroll Manager",
      description: "Track your bankroll with configurable risk parameters",
      icon: Wallet,
      href: "/bankroll-manager",
      accent: "yellow"
    },
    {
      title: "AI Betting Assistant (Coming Soon!)",
      description: "LLM-powered chatbot for strategy advice and personalized recommendations",
      icon: MessageSquare,
      href: "",
      accent: "coral",
      disabled: true
    },
    {
      title: "Custom Alerts",
      description: "Set personalized thresholds for betting opportunities",
      icon: Bell,
      href: "/custom-alerts",
      accent: "yellow"
    },
    {
      title: "Data Sync",
      description: "Sync and verify NBA player data from official sources",
      icon: Activity,
      href: "/data-sync",
      accent: "coral"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Clean Dashboard Style */}
      <div className="container py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Main Dashboard
          </h1>
          <div className="flex items-center gap-8 text-sm">
            <button 
              onClick={() => handleTabClick("overview")}
              className={`font-medium transition-colors ${activeTab === "overview" ? "text-primary accent-underline" : "text-muted-foreground hover:text-foreground"}`}
            >
              Overview
            </button>
            <button 
              onClick={() => handleTabClick("analytics")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Analytics
            </button>
            <button 
              onClick={() => handleTabClick("props")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Props
            </button>
            <button 
              onClick={() => handleTabClick("games")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Games
            </button>
          </div>
        </div>
      </div>



      {/* Features Grid */}
      <div className="container py-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">All Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isCoralAccent = feature.accent === "coral";
            const isDisabled = 'disabled' in feature && feature.disabled;
            
            const cardContent = (
              <Card className={`h-full bg-card border-border transition-all duration-200 ${
                isDisabled 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:border-primary/40 cursor-pointer group card-hover'
              }`}>
                <CardHeader className="pb-3">
                  <div className={`mb-3 p-2 rounded-lg w-fit ${isCoralAccent ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                    <Icon className={`w-6 h-6 ${isCoralAccent ? 'text-primary' : 'text-secondary'} ${!isDisabled && 'group-hover:scale-110'} transition-transform`} />
                  </div>
                  <CardTitle className="text-base font-semibold text-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
            
            if (isDisabled) {
              return <div key={feature.title}>{cardContent}</div>;
            }
            
            return (
              <Link key={feature.title} href={feature.href}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container py-12">
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-3">Ready to analyze?</h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Start with the Betting Analyzer for comprehensive prop and game line analysis with full transparency.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/betting-analyzer">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Calculator className="w-4 h-4 mr-2" />
                  Betting Analyzer
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button size="lg" variant="outline" className="border-border hover:bg-muted">
                  AI Assistant
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
