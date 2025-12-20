import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Calculator, 
  Target, 
  BarChart3, 
  Wallet, 
  LineChart,
  MessageSquare,
  Shield,
  Activity,
  AlertCircle,
  Bell
} from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Player Stats",
      description: "Live 2025-26 NBA player statistics (PPG, RPG, APG, FG%)",
      icon: TrendingUp,
      href: "/player-stats",
      color: "text-primary"
    },
    {
      title: "Team Analytics",
      description: "Offensive/defensive ratings, pace, and team trends for all 30 NBA teams",
      icon: BarChart3,
      href: "/team-analytics",
      color: "text-secondary"
    },
    {
      title: "Player Comparison",
      description: "Side-by-side stat analysis of two players for betting decisions",
      icon: Target,
      href: "/player-comparison",
      color: "text-accent"
    },
    {
      title: "Stat Trends",
      description: "Performance charts showing hot/cold streaks over recent games",
      icon: LineChart,
      href: "/stat-trends",
      color: "text-primary"
    },
    {
      title: "Live Odds",
      description: "Real-time betting lines from 9 major sportsbooks (moneyline, spreads, totals)",
      icon: TrendingUp,
      href: "/live-odds",
      color: "text-secondary"
    },
    {
      title: "Prop Analyzer",
      description: "Player prop bets with historical hit rates and AI recommendations",
      icon: Activity,
      href: "/prop-analyzer",
      color: "text-primary"
    },
    {
      title: "Injury Report",
      description: "Real-time NBA injury updates to factor into betting decisions",
      icon: AlertCircle,
      href: "/injury-report",
      color: "text-secondary"
    },
    {
      title: "Custom Alerts",
      description: "Set personalized thresholds for betting opportunities",
      icon: Bell,
      href: "/custom-alerts",
      color: "text-accent"
    },
    {
      title: "Parlay Builder",
      description: "Build multi-leg parlays and calculate potential payouts",
      icon: Calculator,
      href: "/parlay-builder",
      color: "text-primary"
    },
    {
      title: "AI Assistant",
      description: "Get AI-powered insights with access to all platform data",
      icon: MessageSquare,
      href: "/ai-assistant",
      color: "text-secondary"
    },
    {
      title: "Data Sync",
      description: "Sync live NBA player statistics from Basketball Reference",
      icon: Shield,
      href: "/data-sync",
      color: "text-accent"
    },
    {
      title: "Parlay Builder",
      description: "Generate structured tickets 1-9 (Floor, Sharp Spread, Core Over, Chaos)",
      icon: Calculator,
      href: "/parlay-builder",
      color: "text-primary"
    },
    {
      title: "Kelly Calculator",
      description: "Optimal bet sizing with fractional Kelly multiplier support",
      icon: Calculator,
      href: "/kelly-calculator",
      color: "text-primary"
    },
    {
      title: "Bankroll Manager",
      description: "Track your bankroll with configurable risk parameters",
      icon: Wallet,
      href: "/bankroll-manager",
      color: "text-secondary"
    },
    {
      title: "Performance Analytics",
      description: "Historical tracking of bets, parlays, and bankroll performance",
      icon: BarChart3,
      href: "/performance",
      color: "text-accent"
    },
    {
      title: "AI Betting Assistant",
      description: "LLM-powered chatbot for strategy advice and personalized recommendations",
      icon: MessageSquare,
      href: "/chatbot",
      color: "text-secondary"
    },
    {
      title: "High-EV Opportunities",
      description: "Real-time detection of profitable betting opportunities",
      icon: TrendingUp,
      href: "/opportunities",
      color: "text-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Vertical accent lines */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-secondary/50 to-transparent"></div>
        <div className="absolute right-8 top-0 bottom-0 w-px bg-gradient-to-b from-secondary/50 via-accent/50 to-transparent"></div>
        
        <div className="container py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-primary neon-glow-pink tracking-wide">
              NBA BETTING ANALYTICS
            </h1>
            <p className="text-xl md:text-2xl text-secondary neon-glow-blue font-light tracking-widest">
              ADVANCED INTELLIGENCE • OPTIMAL WAGERING • MAXIMUM EDGE
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Combine real-time NBA data, advanced betting calculators, and AI-powered insights 
              to optimize your wagering decisions with precision and confidence.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/player-stats">
                <Button size="lg" className="neon-border-pink text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/chatbot">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full hover:border-primary/50 transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-10 h-10" />
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-5xl font-bold text-primary neon-glow-pink">16</div>
            <div className="text-lg text-muted-foreground tracking-wide">BETTING SCRIPTS</div>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-bold text-secondary neon-glow-blue">LIVE</div>
            <div className="text-lg text-muted-foreground tracking-wide">NBA DATA 2025-26</div>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-bold text-accent">AI</div>
            <div className="text-lg text-muted-foreground tracking-wide">POWERED INSIGHTS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
