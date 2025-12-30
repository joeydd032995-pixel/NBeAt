import { Link } from "wouter";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Trophy
} from "lucide-react";

export default function Home() {
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

    </div>
  );
}
