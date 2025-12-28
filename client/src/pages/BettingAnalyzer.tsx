import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Calculator, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import { GameSelector } from "@/components/GameSelector";
import { PlayerSearchDropdown, Player } from "@/components/PlayerSearchDropdown";
import { 
  BetCategorySelector, 
  BetCategory, 
  BetSubcategory,
  PLAYER_PROP_CATEGORIES,
  GAME_LINE_CATEGORIES,
  PlayerPropType,
  GameLineType
} from "@/components/BetCategorySelector";

// ============================================================================
// TYPES
// ============================================================================

interface SelectedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  displayTime: string;
  displayDate: string;
  spread: { home: number | null; away: number | null } | null;
  total: number | null;
  moneyline: { home: number; away: number } | null;
}

interface AnalysisResult {
  success: boolean;
  betType: string;
  projection: number;
  line: number;
  edge: number;
  edgePercent: number;
  recommendation: "STRONG_OVER" | "OVER" | "PASS" | "UNDER" | "STRONG_UNDER";
  confidence: number;
  probability: { over: number; under: number };
  breakdown: {
    label: string;
    value: number;
    description: string;
  }[];
  scriptsApplied: string[];
  factors: string[];
  warnings?: string[];
  error?: string;
}

// ============================================================================
// FORMULA EXPLANATIONS
// ============================================================================

const FORMULA_EXPLANATIONS: Record<string, { title: string; steps: string[]; example: string }> = {
  points: {
    title: "Points Projection Formula",
    steps: [
      "1. Start with Season PPG as base",
      "2. Apply Minutes Multiplier: (Expected Minutes / Avg Minutes)",
      "3. Apply Game Context: Home (+2%), Favorite (+1.5%), High Total (+3%)",
      "4. Apply Rest Factor: B2B (-5%), 3+ days rest (+2%)",
      "5. Apply Opponent DRTG adjustment",
      "6. Run Monte Carlo simulation (10,000 iterations)"
    ],
    example: "Player with 25 PPG, playing at home as favorite, 2 days rest → ~26.2 projected"
  },
  rebounds: {
    title: "Rebounds Projection Formula",
    steps: [
      "1. Start with Season RPG as base",
      "2. Apply Position Share (C: 25%, PF: 20%, SF: 15%, SG: 12%, PG: 10%)",
      "3. Adjust for opponent rebound rate allowed",
      "4. Apply pace factor (faster pace = more opportunities)",
      "5. Consider teammate injuries (more rebounds if big man out)"
    ],
    example: "Center with 10 RPG vs poor rebounding team → ~11.2 projected"
  },
  assists: {
    title: "Assists Projection Formula",
    steps: [
      "1. Start with Season APG as base",
      "2. Apply Usage Rate factor",
      "3. Adjust for team assist rate",
      "4. Consider opponent's assist defense",
      "5. Factor in pace and game script"
    ],
    example: "PG with 8 APG, high usage, fast pace game → ~8.8 projected"
  },
  pra: {
    title: "PRA (Points + Rebounds + Assists) Formula",
    steps: [
      "1. Calculate individual Points projection",
      "2. Calculate individual Rebounds projection",
      "3. Calculate individual Assists projection",
      "4. Sum all three projections",
      "5. Apply correlation adjustment (-2% to +2%)",
      "6. High-usage players tend to have positive correlation"
    ],
    example: "Star player: 25 PTS + 8 REB + 6 AST = 39 PRA (±1.5 correlation)"
  },
  moneyline: {
    title: "Moneyline Win Probability Formula",
    steps: [
      "1. Calculate team rating differential (ORTG - DRTG)",
      "2. Apply home court advantage (+3.5 points)",
      "3. Adjust for injuries (key player out = -2 to -5 points)",
      "4. Factor in recent form (last 10 games)",
      "5. Convert point differential to win probability",
      "6. Compare to implied odds for edge"
    ],
    example: "Home team +5 rating vs away → ~65% win probability"
  },
  spread: {
    title: "Point Spread Analysis Formula",
    steps: [
      "1. Calculate expected margin from team ratings",
      "2. Add home court advantage (~3.5 points)",
      "3. Adjust for pace (high pace = more variance)",
      "4. Consider blowout probability",
      "5. Compare projected margin to spread line"
    ],
    example: "Projected margin: -7.5, Spread: -6.5 → Lean AWAY +6.5"
  },
  total: {
    title: "Over/Under Total Formula",
    steps: [
      "1. Calculate combined offensive ratings",
      "2. Apply pace factor (possessions per game)",
      "3. Adjust for defensive matchups",
      "4. Consider recent scoring trends",
      "5. Factor in rest and travel"
    ],
    example: "Two high-pace teams, combined 230 ORTG → Project 228 total"
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function BettingAnalyzer() {
  // Category Selection State
  const [selectedCategory, setSelectedCategory] = useState<BetCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<BetSubcategory | null>(null);
  
  // Game Selection State
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null);
  
  // Player Selection State (for player props)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null); // For combined props
  
  // Analysis Input State
  const [line, setLine] = useState("");
  const [isAltLine, setIsAltLine] = useState(false);
  const [isHome, setIsHome] = useState(true);
  const [isFavorite, setIsFavorite] = useState(true);
  const [daysRest, setDaysRest] = useState("2");
  const [isBackToBack, setIsBackToBack] = useState(false);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Auto-populate game data
  useEffect(() => {
    if (selectedGame) {
      if (selectedGame.total) {
        // Could auto-set total line for O/U bets
      }
      if (selectedGame.spread?.home !== null) {
        setIsFavorite(selectedGame.spread.home < 0);
      }
    }
  }, [selectedGame]);

  // Get the appropriate stat value based on bet type
  const getPlayerStatForBetType = (player: Player, betType: PlayerPropType): string => {
    switch (betType) {
      case "points": return player.ppg || "0";
      case "rebounds": return player.rpg || "0";
      case "assists": return player.apg || "0";
      case "steals": return player.spg || "0";
      case "blocks": return player.bpg || "0";
      case "three_pointers": return player.tpm || "0";
      case "pra": {
        const pts = parseFloat(player.ppg || "0");
        const reb = parseFloat(player.rpg || "0");
        const ast = parseFloat(player.apg || "0");
        return (pts + reb + ast).toFixed(1);
      }
      case "pa": {
        const pts = parseFloat(player.ppg || "0");
        const ast = parseFloat(player.apg || "0");
        return (pts + ast).toFixed(1);
      }
      case "pr": {
        const pts = parseFloat(player.ppg || "0");
        const reb = parseFloat(player.rpg || "0");
        return (pts + reb).toFixed(1);
      }
      case "ra": {
        const reb = parseFloat(player.rpg || "0");
        const ast = parseFloat(player.apg || "0");
        return (reb + ast).toFixed(1);
      }
      case "steals_blocks": {
        const stl = parseFloat(player.spg || "0");
        const blk = parseFloat(player.bpg || "0");
        return (stl + blk).toFixed(1);
      }
      default: return "0";
    }
  };

  // Mutations for backend analysis
  const analyzePropMutation = trpc.propsAnalytics.analyzeProp.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      if (data.success) {
        const result: AnalysisResult = {
          success: true,
          betType: selectedSubcategory?.name || "Unknown",
          projection: data.projection || 0,
          line: data.line || parseFloat(line),
          edge: data.edge || 0,
          edgePercent: data.edge_pct || 0,
          recommendation: (data.recommendation as AnalysisResult["recommendation"]) || "PASS",
          confidence: (data.confidence || 0.5) * 100,
          probability: data.probability || { over: 50, under: 50 },
          breakdown: [
            { label: "Base Stat", value: data.projection || 0, description: "Season average with adjustments" },
            { label: "Final Projection", value: data.projection || 0, description: "All factors applied" }
          ],
          scriptsApplied: data.scripts_used || [],
          factors: data.factors_applied || []
        };
        setResult(result);
        toast.success("Analysis complete!");
      } else {
        toast.error(data.error || "Analysis failed");
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Error: ${error.message}`);
    }
  });

  const analyzeCombinedMutation = trpc.propsAnalytics.analyzeCombinedProp.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      if (data.success) {
        const result: AnalysisResult = {
          success: true,
          betType: selectedSubcategory?.name || "Combined Prop",
          projection: data.projection || 0,
          line: data.line || parseFloat(line),
          edge: data.edge || 0,
          edgePercent: data.edge_pct || 0,
          recommendation: (data.recommendation as AnalysisResult["recommendation"]) || "PASS",
          confidence: (data.confidence || 0.5) * 100,
          probability: { over: 50 + ((data.edge_pct || 0) * 2), under: 50 - ((data.edge_pct || 0) * 2) },
          breakdown: data.components ? Object.entries(data.components).map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as number,
            description: `${key} component`
          })) : [],
          scriptsApplied: data.scripts_used || [],
          factors: data.factors_applied || []
        };
        setResult(result);
        toast.success("Analysis complete!");
      } else {
        toast.error(data.error || "Analysis failed");
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Error: ${error.message}`);
    }
  });

  const analyzeGameLineMutation = trpc.propsAnalytics.analyzeGameLine.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      if (data.success) {
        const result: AnalysisResult = {
          success: true,
          betType: selectedSubcategory?.name || "Game Line",
          projection: data.projection || 0,
          line: data.line || parseFloat(line),
          edge: data.edge || 0,
          edgePercent: data.edge_pct || 0,
          recommendation: (data.recommendation as AnalysisResult["recommendation"]) || "PASS",
          confidence: (data.confidence || 0.5) * 100,
          probability: { over: 50 + ((data.edge_pct || 0) * 2), under: 50 - ((data.edge_pct || 0) * 2) },
          breakdown: [
            { label: "Expected Margin", value: data.expected_margin || 0, description: "Projected point differential" },
            { label: "Projection", value: data.projection || 0, description: "Final projection" }
          ],
          scriptsApplied: data.scripts_used || [],
          factors: data.factors_applied || []
        };
        setResult(result);
        toast.success("Analysis complete!");
      } else {
        toast.error(data.error || "Analysis failed");
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Error: ${error.message}`);
    }
  });

  // Run analysis
  const handleAnalyze = async () => {
    if (!selectedSubcategory) {
      toast.error("Please select a bet type");
      return;
    }

    if (selectedCategory?.id === "player_props" && !selectedPlayer) {
      toast.error("Please select a player");
      return;
    }

    if (!line) {
      toast.error("Please enter a line");
      return;
    }

    setIsAnalyzing(true);
    const lineNum = parseFloat(line);

    // Determine which API to call based on bet type
    if (selectedCategory?.id === "player_props") {
      const betType = selectedSubcategory.id;
      
      // Combined props
      if (["pra", "pa", "pr", "ra", "steals_blocks"].includes(betType)) {
        analyzeCombinedMutation.mutate({
          prop_type: betType as "pra" | "pa" | "pr" | "ra" | "steals_blocks" | "s+b",
          ppg: parseFloat(selectedPlayer?.ppg || "0"),
          rpg: parseFloat(selectedPlayer?.rpg || "0"),
          apg: parseFloat(selectedPlayer?.apg || "0"),
          spg: parseFloat(selectedPlayer?.spg || "0"),
          bpg: parseFloat(selectedPlayer?.bpg || "0"),
          line: lineNum,
          is_home: isHome,
          is_favorite: isFavorite,
          days_rest: parseInt(daysRest),
          is_back_to_back: isBackToBack
        });
      } else {
        // Single stat props
        analyzePropMutation.mutate({
          bet_type: betType,
          ppg: parseFloat(selectedPlayer?.ppg || "0"),
          rpg: parseFloat(selectedPlayer?.rpg || "0"),
          apg: parseFloat(selectedPlayer?.apg || "0"),
          spg: parseFloat(selectedPlayer?.spg || "0"),
          bpg: parseFloat(selectedPlayer?.bpg || "0"),
          tpm: parseFloat(selectedPlayer?.tpm || "0"),
          season_ppg: parseFloat(selectedPlayer?.ppg || "0"),
          avg_minutes: parseFloat(selectedPlayer?.minutesPerGame || "30"),
          line: lineNum,
          is_home: isHome,
          is_favorite: isFavorite,
          days_rest: parseInt(daysRest),
          is_back_to_back: isBackToBack
        });
      }
    } else if (selectedCategory?.id === "game_lines") {
      // Game line analysis
      analyzeGameLineMutation.mutate({
        line_type: selectedSubcategory.id,
        home_team: selectedGame?.homeTeam,
        away_team: selectedGame?.awayTeam,
        home_rating: 110, // Default - would come from team data
        away_rating: 108,
        home_pace: 100,
        away_pace: 100,
        line: lineNum
      });
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes("STRONG_OVER")) return "text-green-500 bg-green-500/10";
    if (rec.includes("OVER")) return "text-green-400 bg-green-400/10";
    if (rec.includes("STRONG_UNDER")) return "text-red-500 bg-red-500/10";
    if (rec.includes("UNDER")) return "text-red-400 bg-red-400/10";
    return "text-yellow-500 bg-yellow-500/10";
  };

  const formulaKey = selectedSubcategory?.id as string;
  const formulaExplanation = FORMULA_EXPLANATIONS[formulaKey] || FORMULA_EXPLANATIONS["points"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-primary hover:text-primary/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Betting Analyzer
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analysis powered by 60+ analytical formulas
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="outline" className="border-primary/50 text-primary">
              <Target className="w-3 h-3 mr-1" />
              14 Player Props
            </Badge>
            <Badge variant="outline" className="border-secondary/50 text-secondary">
              <BarChart3 className="w-3 h-3 mr-1" />
              14 Game Lines
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground">
              <Zap className="w-3 h-3 mr-1" />
              Alt Lines Available
            </Badge>
          </div>
        </div>

        {/* Step 1: Select Bet Category */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              1
            </div>
            <h2 className="text-lg font-semibold text-foreground">Select Bet Type</h2>
          </div>
          <BetCategorySelector
            onCategorySelect={setSelectedCategory}
            onSubcategorySelect={setSelectedSubcategory}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
          />
        </div>

        {/* Step 2: Select Game (if applicable) */}
        {selectedSubcategory && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-semibold text-foreground">Select Game</h2>
            </div>
            <GameSelector
              onGameSelect={(game) => setSelectedGame(game)}
              selectedGameId={selectedGame?.id}
              showOdds={true}
            />
          </div>
        )}

        {/* Step 3: Player Selection (for player props) */}
        {selectedCategory?.id === "player_props" && selectedSubcategory && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                3
              </div>
              <h2 className="text-lg font-semibold text-foreground">Select Player</h2>
            </div>
            <Card className="bg-card border-primary/20">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-primary mb-2 block">Player</Label>
                    <PlayerSearchDropdown
                      onPlayerSelect={setSelectedPlayer}
                      selectedPlayer={selectedPlayer}
                      placeholder="Search for a player..."
                      showPositionFilter={true}
                      accentColor="primary"
                    />
                  </div>
                  
                  {/* Second player for combined props */}
                  {selectedSubcategory.id === "combined_2" && (
                    <div>
                      <Label className="text-primary mb-2 block">Second Player</Label>
                      <PlayerSearchDropdown
                        onPlayerSelect={setSelectedPlayer2}
                        selectedPlayer={selectedPlayer2}
                        placeholder="Search for second player..."
                        showPositionFilter={true}
                        accentColor="secondary"
                      />
                    </div>
                  )}
                </div>

                {/* Show player's relevant stat */}
                {selectedPlayer && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">{selectedPlayer.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPlayer.position} • {selectedPlayer.minutesPerGame} MPG
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {getPlayerStatForBetType(selectedPlayer, selectedSubcategory.id as PlayerPropType)}
                        </p>
                        <p className="text-sm text-muted-foreground">Season Avg</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Enter Line & Context */}
        {selectedSubcategory && (selectedCategory?.id === "game_lines" || selectedPlayer) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
                {selectedCategory?.id === "player_props" ? "4" : "3"}
              </div>
              <h2 className="text-lg font-semibold text-foreground">Enter Line & Context</h2>
            </div>
            <Card className="bg-card border-secondary/20">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Line Input */}
                  <div>
                    <Label className="text-secondary mb-2 block">
                      {selectedSubcategory.name} Line
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={line}
                      onChange={(e) => setLine(e.target.value)}
                      placeholder="Enter line..."
                      className="bg-input border-border"
                    />
                  </div>

                  {/* Alt Line Toggle */}
                  {selectedSubcategory.isAltAvailable && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isAltLine}
                        onCheckedChange={setIsAltLine}
                      />
                      <Label className="text-muted-foreground">Alternate Line</Label>
                    </div>
                  )}

                  {/* Context Toggles */}
                  {selectedCategory?.id === "player_props" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Switch checked={isHome} onCheckedChange={setIsHome} />
                        <Label className="text-muted-foreground">Home Game</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={isFavorite} onCheckedChange={setIsFavorite} />
                        <Label className="text-muted-foreground">Team Favored</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={isBackToBack} onCheckedChange={setIsBackToBack} />
                        <Label className="text-muted-foreground">Back-to-Back</Label>
                      </div>
                      <div>
                        <Label className="text-muted-foreground mb-2 block">Days Rest</Label>
                        <Input
                          type="number"
                          min="0"
                          max="7"
                          value={daysRest}
                          onChange={(e) => setDaysRest(e.target.value)}
                          className="bg-input border-border w-20"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full mt-6 py-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                ✓
              </div>
              <h2 className="text-lg font-semibold text-foreground">Analysis Results</h2>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Main Result Card */}
              <Card className="bg-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">{result.betType} Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Projection vs Line */}
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Projection</div>
                    <div className="text-5xl font-bold text-foreground mb-2">
                      {result.projection}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      vs Line: <span className="text-secondary font-medium">{result.line}</span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`text-center p-4 rounded-lg ${getRecommendationColor(result.recommendation)}`}>
                    <div className="text-2xl font-bold">
                      {result.recommendation.replace("_", " ")}
                    </div>
                    <div className="text-sm opacity-80">
                      {result.confidence.toFixed(0)}% Confidence
                    </div>
                  </div>

                  {/* Edge */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Edge</div>
                      <div className={`text-2xl font-bold ${result.edge > 0 ? "text-primary" : "text-secondary"}`}>
                        {result.edge > 0 ? "+" : ""}{result.edge}
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Edge %</div>
                      <div className={`text-2xl font-bold ${result.edgePercent > 0 ? "text-primary" : "text-secondary"}`}>
                        {result.edgePercent > 0 ? "+" : ""}{result.edgePercent}%
                      </div>
                    </div>
                  </div>

                  {/* Probability */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-primary">Over {result.probability.over.toFixed(1)}%</span>
                      <span className="text-secondary">Under {result.probability.under.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="bg-primary transition-all"
                        style={{ width: `${result.probability.over}%` }}
                      />
                      <div 
                        className="bg-secondary transition-all"
                        style={{ width: `${result.probability.under}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Card */}
              <Card className="bg-card border-secondary/20">
                <CardHeader>
                  <CardTitle className="text-secondary flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Analysis Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Projection Steps */}
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">Projection Steps</h4>
                    <div className="space-y-2">
                      {result.breakdown.map((step, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div>
                            <span className="text-foreground">{step.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{step.description}</span>
                          </div>
                          <span className="font-mono text-secondary">{step.value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Factors Applied */}
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">Factors Applied</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.factors.map((factor, i) => (
                        <Badge key={i} variant="outline" className="border-primary/50 text-primary">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Scripts Used */}
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Scripts Applied ({result.scriptsApplied.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {result.scriptsApplied.map((script, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {script}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Formula Explanation Section */}
        {selectedSubcategory && (
          <Card className="bg-card border-border">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            >
              <CardTitle className="flex items-center justify-between text-foreground">
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-secondary" />
                  How {selectedSubcategory.name} Analysis Works
                </span>
                {showFormulaDetails ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </CardTitle>
            </CardHeader>
            {showFormulaDetails && (
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-primary font-medium mb-2">{formulaExplanation.title}</h4>
                  <ol className="space-y-2">
                    {formulaExplanation.steps.map((step, i) => (
                      <li key={i} className="text-muted-foreground text-sm flex gap-2">
                        <span className="text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-secondary font-medium">Example: </span>
                    {formulaExplanation.example}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
