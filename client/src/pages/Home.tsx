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
  User,
  ArrowUpRight,
  ArrowDownRight
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
      title: "Game Dashboard",
      description: "All player props & game lines for a selected game with adjustable sliders",
      icon: Target,
      href: "/game-dashboard",
      accent: "coral"
    },
    {
      title: "Player Stats",
      description: "Live 2025-26 NBA player statistics (PPG, RPG, APG, FG%)",
      icon: TrendingUp,
      href: "/player-stats",
      accent: "yellow"
    },
    {
      title: "Props Analytics",
      description: "Quick prop analysis with game selection and auto-populated stats",
      icon: Zap,
      href: "/props-analytics",
      accent: "coral"
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
      title: "AI Betting Assistant",
      description: "LLM-powered chatbot for strategy advice and personalized recommendations",
      icon: MessageSquare,
      href: "/ai-assistant",
      accent: "coral"
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
            <span className="text-primary font-medium accent-underline">Overview</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Analytics</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Props</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Games</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="container pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">60+</p>
                  <p className="text-xs text-muted-foreground">Scripts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/10">
                  <ArrowDownRight className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">28</p>
                  <p className="text-xs text-muted-foreground">Bet Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">569+</p>
                  <p className="text-xs text-muted-foreground">Players</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border card-hover">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/10">
                  <Trophy className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">30</p>
                  <p className="text-xs text-muted-foreground">Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Tool - Betting Analyzer */}
      <div className="container py-6">
        <Link href={primaryTool.href}>
          <Card className="bg-card border-primary/30 hover:border-primary/60 transition-all cursor-pointer group card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                    <Calculator className="w-7 h-7" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                      {primaryTool.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {primaryTool.description}
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {primaryTool.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Bet Types Overview */}
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player Props */}
          <Card className="bg-card border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Player Props</CardTitle>
                  <CardDescription className="text-xs">Individual player performance bets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {["Points", "Rebounds", "Assists", "Steals", "Blocks", "PRA", "Double Double", "P+A", "R+A", "P+R", "S+B", "3PM", "2PM", "Combined 2P"].map((prop) => (
                  <Badge key={prop} variant="outline" className="justify-center border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                    {prop}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Lines */}
          <Card className="bg-card border-secondary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Trophy className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Game Lines</CardTitle>
                  <CardDescription className="text-xs">Team and game outcome bets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {["Moneyline", "Spread", "O/U Total", "Q1 ML", "Q1 Spread", "Q1 O/U", "H1 ML", "H1 Spread", "H1 O/U", "H2 ML", "H2 Spread", "H2 O/U", "Alt Spread", "Alt Total"].map((line) => (
                  <Badge key={line} variant="outline" className="justify-center border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors">
                    {line}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container py-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">All Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isCoralAccent = feature.accent === "coral";
            return (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full bg-card border-border hover:border-primary/40 transition-all duration-200 cursor-pointer group card-hover">
                  <CardHeader className="pb-3">
                    <div className={`mb-3 p-2 rounded-lg w-fit ${isCoralAccent ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                      <Icon className={`w-6 h-6 ${isCoralAccent ? 'text-primary' : 'text-secondary'} group-hover:scale-110 transition-transform`} />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">{feature.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
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
