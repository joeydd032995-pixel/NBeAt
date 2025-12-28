import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Target, 
  BarChart3, 
  Loader2,
  Users,
  Trophy,
  Zap,
  ChevronRight,
  Minus,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { GameSelector } from "@/components/GameSelector";
import { cn } from "@/lib/utils";
import { 
  FormulaVariablesPanel, 
  FormulaVariables, 
  DEFAULT_VARIABLES,
  InlineFormulaVariables 
} from "@/components/FormulaVariablesPanel";
import { DualTeamRoster } from "@/components/TeamRosterPanel";

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

interface PlayerProp {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  stat: string;
  statLabel: string;
  seasonAvg: number;
  line: number;
  projection: number;
  edge: number;
  recommendation: string;
}

interface GameLine {
  type: string;
  label: string;
  line: number;
  projection: number;
  edge: number;
  recommendation: string;
}

// ============================================================================
// PLAYER PROP CARD COMPONENT
// ============================================================================

interface PlayerPropCardProps {
  prop: PlayerProp;
  onLineChange: (playerId: number, stat: string, newLine: number) => void;
}

function PlayerPropCard({ prop, onLineChange }: PlayerPropCardProps) {
  const [localLine, setLocalLine] = useState(prop.line);
  
  useEffect(() => {
    setLocalLine(prop.line);
  }, [prop.line]);

  const handleSliderChange = (values: number[]) => {
    const newLine = values[0];
    setLocalLine(newLine);
    onLineChange(prop.playerId, prop.stat, newLine);
  };

  const edge = prop.seasonAvg - localLine;
  const edgePercent = localLine > 0 ? (edge / localLine) * 100 : 0;

  const getEdgeColor = () => {
    if (edge > 2) return "text-green-400";
    if (edge > 0.5) return "text-green-300";
    if (edge < -2) return "text-red-400";
    if (edge < -0.5) return "text-red-300";
    return "text-yellow-400";
  };

  const getRecommendation = () => {
    if (edge > 2) return { text: "OVER", color: "bg-green-500/20 text-green-400" };
    if (edge > 0.5) return { text: "LEAN O", color: "bg-green-500/10 text-green-300" };
    if (edge < -2) return { text: "UNDER", color: "bg-red-500/20 text-red-400" };
    if (edge < -0.5) return { text: "LEAN U", color: "bg-red-500/10 text-red-300" };
    return { text: "PASS", color: "bg-yellow-500/10 text-yellow-400" };
  };

  const rec = getRecommendation();

  // Get slider range based on stat type
  const getRange = () => {
    switch (prop.stat) {
      case "points": return { min: 0.5, max: 60, step: 0.5 };
      case "rebounds": return { min: 0.5, max: 20, step: 0.5 };
      case "assists": return { min: 0.5, max: 18, step: 0.5 };
      case "pra": return { min: 5, max: 80, step: 0.5 };
      case "steals": return { min: 0.5, max: 5, step: 0.5 };
      case "blocks": return { min: 0.5, max: 5, step: 0.5 };
      case "threes": return { min: 0.5, max: 10, step: 0.5 };
      default: return { min: 0.5, max: 50, step: 0.5 };
    }
  };

  const range = getRange();

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{prop.playerName}</span>
          <Badge variant="outline" className="text-xs border-slate-600 text-gray-400">
            {prop.position}
          </Badge>
        </div>
        <Badge className={cn("text-xs", rec.color)}>{rec.text}</Badge>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{prop.statLabel}</span>
        <span>Avg: <span className="text-primary font-medium">{prop.seasonAvg.toFixed(1)}</span></span>
      </div>

      <div className="flex items-center gap-3">
        <Slider
          value={[localLine]}
          onValueChange={handleSliderChange}
          min={range.min}
          max={range.max}
          step={range.step}
          className="flex-1"
        />
        <div className="w-14 text-center">
          <span className="text-lg font-bold text-white">{localLine.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Edge:</span>
        <span className={cn("font-medium", getEdgeColor())}>
          {edge > 0 ? "+" : ""}{edge.toFixed(1)} ({edgePercent > 0 ? "+" : ""}{edgePercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// GAME LINE CARD COMPONENT
// ============================================================================

interface GameLineCardProps {
  line: GameLine;
  onLineChange: (type: string, newLine: number) => void;
  homeTeam: string;
  awayTeam: string;
}

function GameLineCard({ line, onLineChange, homeTeam, awayTeam }: GameLineCardProps) {
  const [localLine, setLocalLine] = useState(line.line);

  useEffect(() => {
    setLocalLine(line.line);
  }, [line.line]);

  const handleSliderChange = (values: number[]) => {
    const newLine = values[0];
    setLocalLine(newLine);
    onLineChange(line.type, newLine);
  };

  // Get slider range based on line type
  const getRange = () => {
    switch (line.type) {
      case "spread": return { min: -25, max: 25, step: 0.5 };
      case "total": return { min: 180, max: 260, step: 0.5 };
      case "moneyline": return { min: -500, max: 500, step: 5 };
      case "1q_spread": return { min: -8, max: 8, step: 0.5 };
      case "1h_spread": return { min: -15, max: 15, step: 0.5 };
      case "1q_total": return { min: 45, max: 70, step: 0.5 };
      case "1h_total": return { min: 90, max: 135, step: 0.5 };
      default: return { min: -25, max: 25, step: 0.5 };
    }
  };

  const range = getRange();

  const getRecommendation = () => {
    const edge = line.projection - localLine;
    if (line.type === "spread") {
      if (edge > 2) return { text: homeTeam, color: "bg-green-500/20 text-green-400" };
      if (edge < -2) return { text: awayTeam, color: "bg-red-500/20 text-red-400" };
    } else if (line.type === "total") {
      if (edge > 3) return { text: "OVER", color: "bg-green-500/20 text-green-400" };
      if (edge < -3) return { text: "UNDER", color: "bg-red-500/20 text-red-400" };
    }
    return { text: "PASS", color: "bg-yellow-500/10 text-yellow-400" };
  };

  const rec = getRecommendation();
  const edge = line.projection - localLine;

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{line.label}</span>
          <Badge className={cn("text-xs", rec.color)}>{rec.text}</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Slider
            value={[localLine]}
            onValueChange={handleSliderChange}
            min={range.min}
            max={range.max}
            step={range.step}
            className="flex-1"
          />
          <div className="w-16 text-center">
            <span className="text-xl font-bold text-white">
              {line.type === "spread" && localLine > 0 ? "+" : ""}
              {localLine.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Projection: <span className="text-secondary">{line.projection.toFixed(1)}</span></span>
          <span className={edge > 0 ? "text-green-400" : edge < 0 ? "text-red-400" : "text-yellow-400"}>
            Edge: {edge > 0 ? "+" : ""}{edge.toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GameDashboard() {
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(null);
  const [activeTab, setActiveTab] = useState("roster");
  const [showOnlyValue, setShowOnlyValue] = useState(false);
  const [showFormulaPanel, setShowFormulaPanel] = useState(false);
  const [formulaVariables, setFormulaVariables] = useState<FormulaVariables>(DEFAULT_VARIABLES);

  // Fetch players by team
  const { data: allPlayers } = trpc.players.getAll.useQuery();

  // Update formula variables when game is selected
  useEffect(() => {
    if (selectedGame) {
      setFormulaVariables(prev => ({
        ...prev,
        spread: selectedGame.spread?.home || 0,
        gameTotal: selectedGame.total || 220,
        isFavorite: (selectedGame.spread?.home || 0) < 0
      }));
    }
  }, [selectedGame]);

  // Filter players by team
  const getTeamPlayers = useCallback((teamName: string) => {
    if (!allPlayers) return [];
    // Match team name (handle abbreviations and full names)
    return allPlayers.filter(p => {
      const team = p.team?.toLowerCase() || "";
      const searchTerm = teamName.toLowerCase();
      return team.includes(searchTerm) || searchTerm.includes(team);
    }).slice(0, 8); // Limit to top 8 players per team
  }, [allPlayers]);

  // Generate player props for a team
  const generatePlayerProps = useCallback((teamName: string, players: any[]): PlayerProp[] => {
    const props: PlayerProp[] = [];
    
    players.forEach(player => {
      const ppg = parseFloat(player.ppg || "0");
      const rpg = parseFloat(player.rpg || "0");
      const apg = parseFloat(player.apg || "0");
      
      // Only add props for players with meaningful stats
      if (ppg > 5) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          team: teamName,
          position: player.position || "G",
          stat: "points",
          statLabel: "Points",
          seasonAvg: ppg,
          line: Math.round(ppg * 2) / 2,
          projection: ppg * 1.02, // Slight adjustment
          edge: 0,
          recommendation: "PASS"
        });
      }
      
      if (rpg > 3) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          team: teamName,
          position: player.position || "G",
          stat: "rebounds",
          statLabel: "Rebounds",
          seasonAvg: rpg,
          line: Math.round(rpg * 2) / 2,
          projection: rpg * 1.02,
          edge: 0,
          recommendation: "PASS"
        });
      }
      
      if (apg > 2) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          team: teamName,
          position: player.position || "G",
          stat: "assists",
          statLabel: "Assists",
          seasonAvg: apg,
          line: Math.round(apg * 2) / 2,
          projection: apg * 1.02,
          edge: 0,
          recommendation: "PASS"
        });
      }

      // PRA for star players
      const pra = ppg + rpg + apg;
      if (pra > 20) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          team: teamName,
          position: player.position || "G",
          stat: "pra",
          statLabel: "PRA",
          seasonAvg: pra,
          line: Math.round(pra * 2) / 2,
          projection: pra * 1.02,
          edge: 0,
          recommendation: "PASS"
        });
      }
    });

    return props;
  }, []);

  // Generate game lines
  const generateGameLines = useCallback((game: SelectedGame): GameLine[] => {
    const lines: GameLine[] = [];
    
    // Main spread
    if (game.spread?.home !== null) {
      lines.push({
        type: "spread",
        label: `Spread (${game.homeTeam})`,
        line: game.spread?.home || 0,
        projection: (game.spread?.home || 0) - 0.5, // Slight edge to home
        edge: 0,
        recommendation: "PASS"
      });
    }

    // Main total
    if (game.total) {
      lines.push({
        type: "total",
        label: "Game Total (O/U)",
        line: game.total,
        projection: game.total + 2, // Slight over lean
        edge: 0,
        recommendation: "PASS"
      });
    }

    // 1st Quarter
    lines.push({
      type: "1q_spread",
      label: "1Q Spread",
      line: (game.spread?.home || 0) / 4,
      projection: ((game.spread?.home || 0) / 4) - 0.25,
      edge: 0,
      recommendation: "PASS"
    });

    lines.push({
      type: "1q_total",
      label: "1Q Total",
      line: (game.total || 220) / 4,
      projection: ((game.total || 220) / 4) + 0.5,
      edge: 0,
      recommendation: "PASS"
    });

    // 1st Half
    lines.push({
      type: "1h_spread",
      label: "1H Spread",
      line: (game.spread?.home || 0) / 2,
      projection: ((game.spread?.home || 0) / 2) - 0.5,
      edge: 0,
      recommendation: "PASS"
    });

    lines.push({
      type: "1h_total",
      label: "1H Total",
      line: (game.total || 220) / 2,
      projection: ((game.total || 220) / 2) + 1,
      edge: 0,
      recommendation: "PASS"
    });

    return lines;
  }, []);

  // State for props and lines
  const [homeProps, setHomeProps] = useState<PlayerProp[]>([]);
  const [awayProps, setAwayProps] = useState<PlayerProp[]>([]);
  const [gameLines, setGameLines] = useState<GameLine[]>([]);

  // Update props when game changes
  useEffect(() => {
    if (selectedGame && allPlayers) {
      const homePlayers = getTeamPlayers(selectedGame.homeTeam);
      const awayPlayers = getTeamPlayers(selectedGame.awayTeam);
      
      setHomeProps(generatePlayerProps(selectedGame.homeTeam, homePlayers));
      setAwayProps(generatePlayerProps(selectedGame.awayTeam, awayPlayers));
      setGameLines(generateGameLines(selectedGame));
    }
  }, [selectedGame, allPlayers, getTeamPlayers, generatePlayerProps, generateGameLines]);

  // Handle line changes
  const handlePlayerLineChange = (playerId: number, stat: string, newLine: number) => {
    setHomeProps(prev => prev.map(p => 
      p.playerId === playerId && p.stat === stat ? { ...p, line: newLine } : p
    ));
    setAwayProps(prev => prev.map(p => 
      p.playerId === playerId && p.stat === stat ? { ...p, line: newLine } : p
    ));
  };

  const handleGameLineChange = (type: string, newLine: number) => {
    setGameLines(prev => prev.map(l => 
      l.type === type ? { ...l, line: newLine } : l
    ));
  };

  // Filter props based on value
  const filterProps = (props: PlayerProp[]) => {
    if (!showOnlyValue) return props;
    return props.filter(p => Math.abs(p.seasonAvg - p.line) > 1);
  };

  // Count value plays
  const valueCount = [...homeProps, ...awayProps].filter(p => Math.abs(p.seasonAvg - p.line) > 1).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 max-w-7xl mx-auto px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-4 text-primary hover:text-primary/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Game Betting Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Select a game to see all player props and game lines with adjustable sliders
          </p>
        </div>

        {/* Game Selector */}
        <div className="mb-6">
          <GameSelector
            onGameSelect={(game) => setSelectedGame(game)}
            selectedGameId={selectedGame?.id}
            showOdds={true}
          />
        </div>

        {/* Dashboard Content */}
        {selectedGame && (
          <div className="space-y-6">
            {/* Game Header */}
            <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{selectedGame.awayTeam}</div>
                      <div className="text-xs text-gray-400">Away</div>
                    </div>
                    <div className="text-2xl text-gray-500">@</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{selectedGame.homeTeam}</div>
                      <div className="text-xs text-gray-400">Home</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{selectedGame.displayDate}</div>
                    <div className="text-lg font-medium text-secondary">{selectedGame.displayTime}</div>
                  </div>
                </div>

                {/* Quick Lines */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Spread</div>
                    <div className="text-lg font-bold text-white">
                      {selectedGame.spread?.home !== null ? (
                        selectedGame.spread.home > 0 ? `+${selectedGame.spread.home}` : selectedGame.spread.home
                      ) : "N/A"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Total</div>
                    <div className="text-lg font-bold text-white">{selectedGame.total || "N/A"}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">ML</div>
                    <div className="text-lg font-bold text-white">
                      {selectedGame.moneyline?.home || "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={showOnlyValue} onCheckedChange={setShowOnlyValue} />
                <Label className="text-sm text-gray-300">Show only value plays</Label>
                {valueCount > 0 && (
                  <Badge className="bg-primary/20 text-primary">{valueCount} found</Badge>
                )}
              </div>
            </div>

            {/* Formula Variables Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFormulaPanel(!showFormulaPanel)}
                className="border-slate-600 text-gray-300 hover:text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showFormulaPanel ? "Hide" : "Show"} Formula Variables
              </Button>
            </div>

            {/* Formula Variables Panel */}
            {showFormulaPanel && (
              <FormulaVariablesPanel
                variables={formulaVariables}
                onChange={setFormulaVariables}
                compact={false}
              />
            )}

            {/* Inline Variables (always visible) */}
            {!showFormulaPanel && (
              <InlineFormulaVariables
                variables={formulaVariables}
                onChange={setFormulaVariables}
              />
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="roster" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-1" />
                  Rosters
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  All Bets
                </TabsTrigger>
                <TabsTrigger value="game" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Game Lines
                </TabsTrigger>
                <TabsTrigger value="home" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  {selectedGame.homeTeam}
                </TabsTrigger>
                <TabsTrigger value="away" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  {selectedGame.awayTeam}
                </TabsTrigger>
              </TabsList>

              {/* Roster Tab - NEW */}
              <TabsContent value="roster" className="mt-4">
                <DualTeamRoster
                  homeTeam={selectedGame.homeTeam}
                  awayTeam={selectedGame.awayTeam}
                  showSliders={true}
                  maxPlayersPerTeam={8}
                  onPropLineChange={(playerId, stat, line) => {
                    // Update the prop line in state
                    handlePlayerLineChange(playerId, stat, line);
                  }}
                />
              </TabsContent>

              {/* All Bets Tab */}
              <TabsContent value="all" className="space-y-6 mt-4">
                {/* Game Lines Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-secondary" />
                    Game Lines
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gameLines.map(line => (
                      <GameLineCard
                        key={line.type}
                        line={line}
                        onLineChange={handleGameLineChange}
                        homeTeam={selectedGame.homeTeam}
                        awayTeam={selectedGame.awayTeam}
                      />
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                {/* Home Team Props */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {selectedGame.homeTeam} Player Props
                  </h3>
                  {filterProps(homeProps).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filterProps(homeProps).map((prop, idx) => (
                        <PlayerPropCard
                          key={`${prop.playerId}-${prop.stat}-${idx}`}
                          prop={prop}
                          onLineChange={handlePlayerLineChange}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No player props available for {selectedGame.homeTeam}
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-700" />

                {/* Away Team Props */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {selectedGame.awayTeam} Player Props
                  </h3>
                  {filterProps(awayProps).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filterProps(awayProps).map((prop, idx) => (
                        <PlayerPropCard
                          key={`${prop.playerId}-${prop.stat}-${idx}`}
                          prop={prop}
                          onLineChange={handlePlayerLineChange}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No player props available for {selectedGame.awayTeam}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Game Lines Tab */}
              <TabsContent value="game" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameLines.map(line => (
                    <GameLineCard
                      key={line.type}
                      line={line}
                      onLineChange={handleGameLineChange}
                      homeTeam={selectedGame.homeTeam}
                      awayTeam={selectedGame.awayTeam}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Home Team Tab */}
              <TabsContent value="home" className="mt-4">
                {filterProps(homeProps).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filterProps(homeProps).map((prop, idx) => (
                      <PlayerPropCard
                        key={`${prop.playerId}-${prop.stat}-${idx}`}
                        prop={prop}
                        onLineChange={handlePlayerLineChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No player props available for {selectedGame.homeTeam}</p>
                    <p className="text-sm mt-1">Player data may not be synced for this team</p>
                  </div>
                )}
              </TabsContent>

              {/* Away Team Tab */}
              <TabsContent value="away" className="mt-4">
                {filterProps(awayProps).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filterProps(awayProps).map((prop, idx) => (
                      <PlayerPropCard
                        key={`${prop.playerId}-${prop.stat}-${idx}`}
                        prop={prop}
                        onLineChange={handlePlayerLineChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No player props available for {selectedGame.awayTeam}</p>
                    <p className="text-sm mt-1">Player data may not be synced for this team</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* No Game Selected */}
        {!selectedGame && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-16 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary/50" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Game</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Choose a game above to see all available player props and game lines with adjustable sliders
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
