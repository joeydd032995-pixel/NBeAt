import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  success: boolean;
  player_name?: string;
  final_projection?: number;
  line?: number;
  edge?: number;
  recommendation?: string;
  confidence?: number;
  expected_value?: number;
  base_projection?: number;
  context_adjusted?: number;
  rest_adjusted?: number;
  factors_applied?: string[];
  variance?: {
    mean: number;
    std_dev: number;
    consistency: string;
  };
  hit_rate?: {
    hit_rate_pct: number;
    trend: string;
  };
  monte_carlo?: {
    p_over: number;
    p_under: number;
    p5: number;
    p95: number;
  };
  error?: string;
}

export default function PropsAnalytics() {
  const [activeTab, setActiveTab] = useState("quick");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Quick Analysis Form State
  const [playerName, setPlayerName] = useState("");
  const [seasonPpg, setSeasonPpg] = useState("");
  const [avgMinutes, setAvgMinutes] = useState("");
  const [line, setLine] = useState("");
  const [isHome, setIsHome] = useState(true);
  const [isFavorite, setIsFavorite] = useState(true);
  const [spread, setSpread] = useState("");
  const [total, setTotal] = useState("220");
  const [daysRest, setDaysRest] = useState("2");
  const [isBackToBack, setIsBackToBack] = useState(false);

  // Prop Specific Form State
  const [propType, setPropType] = useState<"assists" | "rebounds" | "steals" | "blocks" | "threes">("assists");
  const [position, setPosition] = useState<"PG" | "SG" | "SF" | "PF" | "C">("PG");
  const [teamAvg, setTeamAvg] = useState("");

  // Edge Calculator Form State
  const [projection, setProjection] = useState("");
  const [edgeLine, setEdgeLine] = useState("");

  const fullAnalysisMutation = trpc.propsAnalytics.fullAnalysis.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      setResult(data as AnalysisResult);
      if (data.success) {
        toast.success(`Analysis complete for ${data.player_name}`);
      } else {
        toast.error(`Analysis failed: ${data.error}`);
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  const edgeMutation = trpc.propsAnalytics.calculateEdge.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      setResult(data as unknown as AnalysisResult);
      if (data.success) {
        toast.success(`Edge calculated: ${data.edge} points`);
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  const propSpecificMutation = trpc.propsAnalytics.propSpecific.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      setResult({
        success: data.success,
        final_projection: data.projection,
        factors_applied: [`Position: ${data.position}`, `Share: ${(data.position_share * 100).toFixed(1)}%`],
      } as AnalysisResult);
      if (data.success) {
        toast.success(`${data.prop_type} projection: ${data.projection}`);
      }
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleFullAnalysis = () => {
    if (!playerName || !seasonPpg || !avgMinutes || !line) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsAnalyzing(true);
    fullAnalysisMutation.mutate({
      name: playerName,
      season_ppg: parseFloat(seasonPpg),
      avg_minutes: parseFloat(avgMinutes),
      line: parseFloat(line),
      is_home: isHome,
      is_favorite: isFavorite,
      spread: spread ? parseFloat(spread) : 0,
      total: parseFloat(total),
      days_rest: parseInt(daysRest),
      is_back_to_back: isBackToBack,
    });
  };

  const handleEdgeCalculation = () => {
    if (!projection || !edgeLine) {
      toast.error("Please enter projection and line");
      return;
    }

    setIsAnalyzing(true);
    edgeMutation.mutate({
      projection: parseFloat(projection),
      line: parseFloat(edgeLine),
    });
  };

  const handlePropSpecific = () => {
    if (!teamAvg) {
      toast.error("Please enter team average");
      return;
    }

    setIsAnalyzing(true);
    propSpecificMutation.mutate({
      prop_type: propType,
      position: position,
      team_avg: parseFloat(teamAvg),
    });
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "STRONG_BUY":
        return "text-green-500";
      case "BUY":
        return "text-green-400";
      case "SELL":
        return "text-red-400";
      case "STRONG_SELL":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "STRONG_BUY":
      case "BUY":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "SELL":
      case "STRONG_SELL":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary neon-glow-pink">
              PROPS ANALYTICS
            </h1>
            <p className="text-lg text-muted-foreground">
              Advanced player prop projections powered by 60+ analytical formulas
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Input Panel */}
            <Card className="bg-card/50 backdrop-blur border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Analysis Tools
                </CardTitle>
                <CardDescription>
                  Enter player data to generate projections and betting recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="quick">Full Analysis</TabsTrigger>
                    <TabsTrigger value="edge">Edge Calc</TabsTrigger>
                    <TabsTrigger value="props">Other Props</TabsTrigger>
                  </TabsList>

                  {/* Full Analysis Tab */}
                  <TabsContent value="quick" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="playerName">Player Name *</Label>
                        <Input
                          id="playerName"
                          placeholder="e.g., LeBron James"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seasonPpg">Season PPG *</Label>
                        <Input
                          id="seasonPpg"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 25.5"
                          value={seasonPpg}
                          onChange={(e) => setSeasonPpg(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avgMinutes">Avg Minutes *</Label>
                        <Input
                          id="avgMinutes"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 35.2"
                          value={avgMinutes}
                          onChange={(e) => setAvgMinutes(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="line">Sportsbook Line *</Label>
                        <Input
                          id="line"
                          type="number"
                          step="0.5"
                          placeholder="e.g., 24.5"
                          value={line}
                          onChange={(e) => setLine(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="spread">Spread</Label>
                        <Input
                          id="spread"
                          type="number"
                          step="0.5"
                          placeholder="e.g., -5.5"
                          value={spread}
                          onChange={(e) => setSpread(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total">O/U Total</Label>
                        <Input
                          id="total"
                          type="number"
                          step="0.5"
                          placeholder="220"
                          value={total}
                          onChange={(e) => setTotal(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="daysRest">Days Rest</Label>
                        <Select value={daysRest} onValueChange={setDaysRest}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 (B2B)</SelectItem>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="2">2 days</SelectItem>
                            <SelectItem value="3">3+ days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isHome"
                          checked={isHome}
                          onCheckedChange={setIsHome}
                        />
                        <Label htmlFor="isHome">Home Game</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isFavorite"
                          checked={isFavorite}
                          onCheckedChange={setIsFavorite}
                        />
                        <Label htmlFor="isFavorite">Team Favored</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isBackToBack"
                          checked={isBackToBack}
                          onCheckedChange={setIsBackToBack}
                        />
                        <Label htmlFor="isBackToBack">Back-to-Back</Label>
                      </div>
                    </div>

                    <Button
                      onClick={handleFullAnalysis}
                      disabled={isAnalyzing}
                      className="w-full py-6 text-lg bg-gradient-to-r from-primary to-secondary"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Run Full Analysis
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  {/* Edge Calculator Tab */}
                  <TabsContent value="edge" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="projection">Your Projection</Label>
                        <Input
                          id="projection"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 26.5"
                          value={projection}
                          onChange={(e) => setProjection(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edgeLine">Sportsbook Line</Label>
                        <Input
                          id="edgeLine"
                          type="number"
                          step="0.5"
                          placeholder="e.g., 24.5"
                          value={edgeLine}
                          onChange={(e) => setEdgeLine(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleEdgeCalculation}
                      disabled={isAnalyzing}
                      className="w-full py-6"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Target className="w-5 h-5 mr-2" />
                          Calculate Edge
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  {/* Other Props Tab */}
                  <TabsContent value="props" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Prop Type</Label>
                        <Select value={propType} onValueChange={(v) => setPropType(v as typeof propType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assists">Assists</SelectItem>
                            <SelectItem value="rebounds">Rebounds</SelectItem>
                            <SelectItem value="steals">Steals</SelectItem>
                            <SelectItem value="blocks">Blocks</SelectItem>
                            <SelectItem value="threes">3-Pointers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select value={position} onValueChange={(v) => setPosition(v as typeof position)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PG">Point Guard</SelectItem>
                            <SelectItem value="SG">Shooting Guard</SelectItem>
                            <SelectItem value="SF">Small Forward</SelectItem>
                            <SelectItem value="PF">Power Forward</SelectItem>
                            <SelectItem value="C">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamAvg">Team Average (for this stat)</Label>
                      <Input
                        id="teamAvg"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 25.5 (team assists per game)"
                        value={teamAvg}
                        onChange={(e) => setTeamAvg(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handlePropSpecific}
                      disabled={isAnalyzing}
                      className="w-full py-6"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-5 h-5 mr-2" />
                          Calculate Prop Projection
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="bg-card/50 backdrop-blur border-2 border-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Projection breakdown and betting recommendation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter player data and run analysis to see results</p>
                  </div>
                ) : !result.success ? (
                  <div className="text-center py-12 text-red-500">
                    <XCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>Analysis failed: {result.error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Main Projection */}
                    {result.final_projection !== undefined && (
                      <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                        <p className="text-sm text-muted-foreground mb-1">
                          {result.player_name || "Player"} Projection
                        </p>
                        <p className="text-5xl font-bold text-primary neon-glow-pink">
                          {result.final_projection?.toFixed(1)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          vs Line: {result.line}
                        </p>
                      </div>
                    )}

                    {/* Edge & Recommendation */}
                    {result.edge !== undefined && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-sm text-muted-foreground">Edge</p>
                          <p className={`text-2xl font-bold ${result.edge >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {result.edge >= 0 ? '+' : ''}{result.edge?.toFixed(1)}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-sm text-muted-foreground">Recommendation</p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            {getRecommendationIcon(result.recommendation || "PASS")}
                            <p className={`text-xl font-bold ${getRecommendationColor(result.recommendation || "PASS")}`}>
                              {result.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Confidence & EV */}
                    {result.confidence !== undefined && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="text-xl font-bold">
                            {(result.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-sm text-muted-foreground">Expected Value</p>
                          <p className={`text-xl font-bold ${(result.expected_value || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(result.expected_value || 0) >= 0 ? '+' : ''}{result.expected_value?.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Projection Breakdown */}
                    {result.base_projection !== undefined && (
                      <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">Projection Breakdown</p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Base</p>
                            <p className="font-medium">{result.base_projection?.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Context Adj</p>
                            <p className="font-medium">{result.context_adjusted?.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Final</p>
                            <p className="font-medium text-primary">{result.rest_adjusted?.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Monte Carlo Results */}
                    {result.monte_carlo && (
                      <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">Monte Carlo Simulation</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">P(Over)</p>
                            <p className="text-lg font-bold text-green-500">
                              {(result.monte_carlo.p_over * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">P(Under)</p>
                            <p className="text-lg font-bold text-red-500">
                              {(result.monte_carlo.p_under * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          95% Range: {result.monte_carlo.p5?.toFixed(1)} - {result.monte_carlo.p95?.toFixed(1)}
                        </p>
                      </div>
                    )}

                    {/* Factors Applied */}
                    {result.factors_applied && result.factors_applied.length > 0 && (
                      <div className="p-4 rounded-lg bg-muted/30">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Factors Applied</p>
                        <div className="flex flex-wrap gap-2">
                          {result.factors_applied.map((factor, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>About Props Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-primary mb-2">60+ Formulas</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive analytics including base projections, game context, 
                    rest impact, variance analysis, and Monte Carlo simulations.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-secondary mb-2">Edge Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    Identify profitable betting opportunities by comparing your 
                    projections against sportsbook lines with confidence ratings.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-accent mb-2">Multi-Prop Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze points, assists, rebounds, steals, blocks, and 3-pointers 
                    with position-based projections.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
