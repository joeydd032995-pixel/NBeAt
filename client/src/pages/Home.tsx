import { Link } from "wouter";
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
  User
} from "lucide-react";

export default function Home() {
  const primaryTool = {
    title: "Betting Analyzer",
    description: "Comprehensive analysis for ALL bet types with formula explanations",
    href: "/betting-analyzer",
    features: [
      "14 Player Props (PTS, REB, AST, PRA, DD, 3PM, S+B, etc.)",
      "14 Game Lines (ML, Spread, O/U, Q1, H1, H2, Alt Lines)",
      "60+ Analytical Scripts with Explanations",
      "Auto-populated Player Stats",
      "Edge Detection & Confidence Ratings"
    ]
  };

  const features = [
    {
      title: "Player Stats",
      description: "Live 2025-26 NBA player statistics (PPG, RPG, APG, FG%)",
      icon: TrendingUp,
      href: "/player-stats",
      color: "text-primary"
    },
    {
      title: "Props Analytics",
      description: "Quick prop analysis with game selection and auto-populated stats",
      icon: Zap,
      href: "/props-analytics",
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
      title: "Injury Report",
      description: "Real-time NBA injury updates to factor into betting decisions",
      icon: AlertCircle,
      href: "/injury-report",
      color: "text-secondary"
    },
    {
      title: "Parlay Builder",
      description: "Build multi-leg parlays with structured tickets (Floor, Sharp, Core, Chaos)",
      icon: Calculator,
      href: "/parlay-builder",
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
      title: "AI Betting Assistant",
      description: "LLM-powered chatbot for strategy advice and personalized recommendations",
      icon: MessageSquare,
      href: "/ai-assistant",
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
      title: "Data Sync",
      description: "Sync and verify NBA player data from official sources",
      icon: Activity,
      href: "/data-sync",
      color: "text-accent"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
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
              <Link href="/betting-analyzer">
                <Button size="lg" className="neon-border-pink text-lg px-8">
                  <Calculator className="w-5 h-5 mr-2" />
                  Betting Analyzer
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Tool - Betting Analyzer */}
      <div className="container py-8">
        <Link href={primaryTool.href}>
          <Card className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-cyan-500/10 border-2 border-pink-500/30 hover:border-pink-500/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-cyan-500 text-white">
                    <Calculator className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-pink-400 group-hover:text-pink-300 transition-colors">
                      {primaryTool.title}
                    </CardTitle>
                    <CardDescription className="text-cyan-400">
                      {primaryTool.description}
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-8 h-8 text-pink-400 group-hover:translate-x-2 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {primaryTool.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="bg-slate-800/50 text-gray-300">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Bet Types Overview */}
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Props */}
          <Card className="bg-slate-900/50 border-pink-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-pink-400" />
                <CardTitle className="text-pink-400">Player Props</CardTitle>
              </div>
              <CardDescription>Individual player performance bets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {["Points", "Rebounds", "Assists", "Steals", "Blocks", "PRA", "Double Double", "P+A", "R+A", "P+R", "S+B", "3PM", "2PM", "Combined 2P"].map((prop) => (
                  <Badge key={prop} variant="outline" className="justify-center border-pink-500/30 text-pink-300">
                    {prop}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Lines */}
          <Card className="bg-slate-900/50 border-cyan-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-cyan-400" />
                <CardTitle className="text-cyan-400">Game Lines</CardTitle>
              </div>
              <CardDescription>Team and game outcome bets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {["Moneyline", "Spread", "O/U Total", "Q1 ML", "Q1 Spread", "Q1 O/U", "H1 ML", "H1 Spread", "H1 O/U", "H2 ML", "H2 Spread", "H2 O/U", "Alt Spread", "Alt Total"].map((line) => (
                  <Badge key={line} variant="outline" className="justify-center border-cyan-500/30 text-cyan-300">
                    {line}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container py-16">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">All Tools</h2>
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
            <div className="text-5xl font-bold text-primary neon-glow-pink">60+</div>
            <div className="text-lg text-muted-foreground tracking-wide">ANALYTICAL SCRIPTS</div>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-bold text-secondary neon-glow-blue">28</div>
            <div className="text-lg text-muted-foreground tracking-wide">BET TYPES SUPPORTED</div>
          </div>
          <div className="space-y-2">
            <div className="text-5xl font-bold text-accent">569+</div>
            <div className="text-lg text-muted-foreground tracking-wide">NBA PLAYERS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
