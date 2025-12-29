import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Star,
  StarOff,
  Users,
  Trophy,
  Target
} from "lucide-react";

// Prop type definitions
const PROP_TYPES = [
  { id: "points", name: "POINTS", shortName: "PTS", statKey: "ppg" },
  { id: "rebounds", name: "REBOUNDS", shortName: "REB", statKey: "rpg" },
  { id: "assists", name: "ASSISTS", shortName: "AST", statKey: "apg" },
  { id: "steals", name: "STEALS", shortName: "STL", statKey: "spg" },
  { id: "blocks", name: "BLOCKS", shortName: "BLK", statKey: "bpg" },
  { id: "threes", name: "THREE POINTERS MADE", shortName: "3PM", statKey: "tpm" },
  { id: "pra", name: "PTS + REB + AST", shortName: "PRA", statKey: "pra" },
  { id: "pa", name: "POINTS AND ASSISTS", shortName: "P+A", statKey: "pa" },
  { id: "pr", name: "POINTS AND REBOUNDS", shortName: "P+R", statKey: "pr" },
  { id: "ra", name: "REBOUNDS AND ASSISTS", shortName: "R+A", statKey: "ra" },
  { id: "sb", name: "STEALS AND BLOCKS", shortName: "S+B", statKey: "sb" },
  { id: "dd", name: "DOUBLE DOUBLE", shortName: "DD", statKey: "dd" },
];

const FILTER_OPTIONS = ["All", "Points", "Rebounds", "Assists", "Combos"];

// Generate mock odds based on line value
const generateOdds = (line: number, isOver: boolean): number => {
  // Simulate slight juice variation
  const base = isOver ? -115 : -105;
  const variance = Math.floor(Math.random() * 20) - 10;
  return base + variance;
};

// Calculate prop line from player stats
const getPlayerPropLine = (player: any, propType: string): number | null => {
  const ppg = parseFloat(player.ppg || "0");
  const rpg = parseFloat(player.rpg || "0");
  const apg = parseFloat(player.apg || "0");
  const spg = parseFloat(player.spg || "0");
  const bpg = parseFloat(player.bpg || "0");
  const tpm = parseFloat(player.tpm || "0");

  switch (propType) {
    case "points": return ppg > 0 ? Math.round(ppg * 2) / 2 : null;
    case "rebounds": return rpg > 0 ? Math.round(rpg * 2) / 2 : null;
    case "assists": return apg > 0 ? Math.round(apg * 2) / 2 : null;
    case "steals": return spg > 0 ? Math.round(spg * 2) / 2 : null;
    case "blocks": return bpg > 0 ? Math.round(bpg * 2) / 2 : null;
    case "threes": return tpm > 0 ? Math.round(tpm * 2) / 2 : null;
    case "pra": return (ppg + rpg + apg) > 0 ? Math.round((ppg + rpg + apg) * 2) / 2 : null;
    case "pa": return (ppg + apg) > 0 ? Math.round((ppg + apg) * 2) / 2 : null;
    case "pr": return (ppg + rpg) > 0 ? Math.round((ppg + rpg) * 2) / 2 : null;
    case "ra": return (rpg + apg) > 0 ? Math.round((rpg + apg) * 2) / 2 : null;
    case "sb": return (spg + bpg) > 0 ? Math.round((spg + bpg) * 2) / 2 : null;
    case "dd": return null; // Double double is Yes/No, not a line
    default: return null;
  }
};

// Format odds display
const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : odds.toString();
};

interface GamePropsProps {
  gameId?: string;
}

export default function GameProps({ gameId }: GamePropsProps) {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set(["points"]));
  const [activeFilter, setActiveFilter] = useState("All");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Parse query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return {
      prop: params.get("prop"),
    };
  }, [searchString]);

  // Fetch games
  const { data: games, isLoading: gamesLoading } = trpc.games.getUpcoming.useQuery();
  
  // Fetch all players
  const { data: allPlayers } = trpc.players.getAll.useQuery();

  // Auto-select game if gameId provided
  useEffect(() => {
    if (gameId && games) {
      const game = games.find(g => g.id.toString() === gameId);
      if (game) setSelectedGame(game);
    }
  }, [gameId, games]);

  // Auto-expand prop type from query param
  useEffect(() => {
    if (queryParams.prop) {
      setExpandedProps(new Set([queryParams.prop]));
      // Set appropriate filter
      if (queryParams.prop === "points") setActiveFilter("Points");
      else if (queryParams.prop === "rebounds") setActiveFilter("Rebounds");
      else if (queryParams.prop === "assists") setActiveFilter("Assists");
      else if (["pra", "pa", "pr", "ra", "sb"].includes(queryParams.prop)) setActiveFilter("Combos");
      else setActiveFilter("All");
    }
  }, [queryParams.prop]);

  // Get players for selected game's teams
  const gamePlayers = useMemo(() => {
    if (!selectedGame || !allPlayers) return { home: [], away: [] };
    
    const homeTeam = selectedGame.homeTeam;
    const awayTeam = selectedGame.awayTeam;
    
    // Match players to teams (flexible matching)
    const matchTeam = (playerTeam: string, teamName: string) => {
      if (!playerTeam || !teamName) return false;
      const pTeam = playerTeam.toLowerCase();
      const tName = teamName.toLowerCase();
      return pTeam.includes(tName) || tName.includes(pTeam) ||
             pTeam.split(' ').some(w => tName.includes(w)) ||
             tName.split(' ').some(w => pTeam.includes(w));
    };

    const homePlayers = allPlayers
      .filter(p => matchTeam(p.team || "", homeTeam))
      .sort((a, b) => parseFloat(b.ppg || "0") - parseFloat(a.ppg || "0"));
    
    const awayPlayers = allPlayers
      .filter(p => matchTeam(p.team || "", awayTeam))
      .sort((a, b) => parseFloat(b.ppg || "0") - parseFloat(a.ppg || "0"));

    return { home: homePlayers, away: awayPlayers };
  }, [selectedGame, allPlayers]);

  // Combined and sorted players for props display
  const getPlayersForProp = (propType: string) => {
    const allGamePlayers = [...gamePlayers.home, ...gamePlayers.away];
    return allGamePlayers
      .map(player => ({
        ...player,
        line: getPlayerPropLine(player, propType),
        overOdds: generateOdds(getPlayerPropLine(player, propType) || 0, true),
        underOdds: generateOdds(getPlayerPropLine(player, propType) || 0, false),
      }))
      .filter(p => p.line !== null && p.line > 0)
      .sort((a, b) => (b.line || 0) - (a.line || 0));
  };

  // Filter prop types based on active filter
  const filteredPropTypes = useMemo(() => {
    if (activeFilter === "All") return PROP_TYPES;
    if (activeFilter === "Points") return PROP_TYPES.filter(p => p.id === "points");
    if (activeFilter === "Rebounds") return PROP_TYPES.filter(p => p.id === "rebounds");
    if (activeFilter === "Assists") return PROP_TYPES.filter(p => p.id === "assists");
    if (activeFilter === "Combos") return PROP_TYPES.filter(p => ["pra", "pa", "pr", "ra", "sb"].includes(p.id));
    return PROP_TYPES;
  }, [activeFilter]);

  const toggleProp = (propId: string) => {
    setExpandedProps(prev => {
      const next = new Set(prev);
      if (next.has(propId)) {
        next.delete(propId);
      } else {
        next.add(propId);
      }
      return next;
    });
  };

  const toggleFavorite = (propId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(propId)) {
        next.delete(propId);
      } else {
        next.add(propId);
      }
      return next;
    });
  };

  // Get selected prop type name
  const selectedPropType = queryParams.prop 
    ? PROP_TYPES.find(p => p.id === queryParams.prop)
    : null;

  // Game selection view
  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/betting-analyzer")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {selectedPropType ? `${selectedPropType.name} Props` : "Game Props"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Select a game to view {selectedPropType ? selectedPropType.name.toLowerCase() : "player"} props
              </p>
            </div>
          </div>

          {/* Selected Prop Badge */}
          {selectedPropType && (
            <div className="mb-4">
              <Badge className="bg-primary text-primary-foreground">
                {selectedPropType.shortName} - {selectedPropType.name}
              </Badge>
            </div>
          )}

          {/* Games List */}
          {gamesLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading games...</div>
          ) : !games || games.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming games available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <Card 
                  key={game.id}
                  className="bg-card border-border hover:border-primary/50 cursor-pointer transition-all"
                  onClick={() => setSelectedGame(game)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {game.awayTeam} @ {game.homeTeam}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(game.gameDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Props view for selected game
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedGame(null)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">NBA</p>
              <p className="font-semibold text-foreground">
                {selectedGame.awayTeam} vs {selectedGame.homeTeam}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedGame(null)}
            >
              Change Game
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            <Badge 
              variant="outline" 
              className="bg-muted text-muted-foreground border-muted cursor-pointer whitespace-nowrap"
            >
              Game Lines
            </Badge>
            <Badge 
              className="bg-primary text-primary-foreground cursor-pointer whitespace-nowrap"
            >
              Player Props
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-muted text-muted-foreground border-muted cursor-pointer whitespace-nowrap"
            >
              Team Props
            </Badge>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTER_OPTIONS.map(filter => (
              <Badge
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap ${
                  activeFilter === filter 
                    ? "bg-foreground text-background" 
                    : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Props List */}
      <div className="p-4 max-w-2xl mx-auto">
        {/* Info Banner */}
        <Card className="bg-card/50 border-border mb-4">
          <CardContent className="p-3 flex items-start gap-3">
            <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Lines are based on season averages. Click a player to analyze in detail.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Prop Sections */}
        <div className="space-y-2">
          {filteredPropTypes.map(propType => {
            const isExpanded = expandedProps.has(propType.id);
            const isFavorite = favorites.has(propType.id);
            const players = isExpanded ? getPlayersForProp(propType.id) : [];

            return (
              <Card key={propType.id} className="bg-card border-border overflow-hidden">
                {/* Prop Header */}
                <button
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => toggleProp(propType.id)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(propType.id);
                      }}
                      className="text-secondary hover:text-secondary/80"
                    >
                      {isFavorite ? (
                        <Star className="w-5 h-5 fill-secondary" />
                      ) : (
                        <StarOff className="w-5 h-5" />
                      )}
                    </button>
                    <span className="font-semibold text-foreground uppercase tracking-wide">
                      {propType.name}
                    </span>
                    <Badge variant="outline" className="text-xs bg-muted/50 border-muted text-muted-foreground">
                      SGP
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-secondary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-secondary" />
                  )}
                </button>

                {/* Players List */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {players.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No players with {propType.name.toLowerCase()} data available
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {players.map((player) => (
                          <div 
                            key={player.id} 
                            className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                          >
                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">
                                  {player.fullName}
                                </p>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                  <ChevronDown className="w-4 h-4 text-secondary" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {player.team} • {player.position}
                              </p>
                            </div>

                            {/* Over Button */}
                            <button 
                              className="flex-1 max-w-[120px] p-2 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors text-center"
                              onClick={() => setLocation(`/betting-analyzer?player=${player.id}&prop=${propType.id}&side=over`)}
                            >
                              <p className="text-sm font-medium text-foreground">
                                Over {player.line}
                              </p>
                              <p className="text-xs text-primary font-semibold">
                                {formatOdds(player.overOdds)}
                              </p>
                            </button>

                            {/* Under Button */}
                            <button 
                              className="flex-1 max-w-[120px] p-2 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-colors text-center"
                              onClick={() => setLocation(`/betting-analyzer?player=${player.id}&prop=${propType.id}&side=under`)}
                            >
                              <p className="text-sm font-medium text-foreground">
                                Under {player.line}
                              </p>
                              <p className="text-xs text-primary font-semibold">
                                {formatOdds(player.underOdds)}
                              </p>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Team Rosters Summary */}
        <Card className="bg-card border-border mt-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Team Rosters</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-primary mb-2">{selectedGame.awayTeam}</p>
                <p className="text-xs text-muted-foreground">
                  {gamePlayers.away.length} players
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary mb-2">{selectedGame.homeTeam}</p>
                <p className="text-xs text-muted-foreground">
                  {gamePlayers.home.length} players
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
