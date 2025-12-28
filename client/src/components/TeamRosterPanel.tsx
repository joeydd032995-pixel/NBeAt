import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Loader2,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  team: string;
  position: string;
  ppg: string;
  rpg: string;
  apg: string;
  spg: string;
  bpg: string;
  tpm: string;
  minutesPerGame: string;
}

interface PlayerPropLine {
  playerId: number;
  playerName: string;
  position: string;
  stat: string;
  statLabel: string;
  seasonAvg: number;
  line: number;
  edge: number;
}

interface TeamRosterPanelProps {
  teamName: string;
  teamAbbr?: string;
  onPlayerSelect?: (player: Player) => void;
  onPropLineChange?: (playerId: number, stat: string, line: number) => void;
  showSliders?: boolean;
  maxPlayers?: number;
  className?: string;
}

// ============================================================================
// PLAYER PROP ROW COMPONENT
// ============================================================================

interface PlayerPropRowProps {
  prop: PlayerPropLine;
  onLineChange: (line: number) => void;
  showSlider: boolean;
}

function PlayerPropRow({ prop, onLineChange, showSlider }: PlayerPropRowProps) {
  const [localLine, setLocalLine] = useState(prop.line);

  useEffect(() => {
    setLocalLine(prop.line);
  }, [prop.line]);

  const handleSliderChange = (values: number[]) => {
    const newLine = values[0];
    setLocalLine(newLine);
    onLineChange(newLine);
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
    if (edge > 2) return { text: "O", color: "bg-green-500/20 text-green-400" };
    if (edge > 0.5) return { text: "o", color: "bg-green-500/10 text-green-300" };
    if (edge < -2) return { text: "U", color: "bg-red-500/20 text-red-400" };
    if (edge < -0.5) return { text: "u", color: "bg-red-500/10 text-red-300" };
    return { text: "-", color: "bg-slate-700 text-gray-400" };
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
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-gray-400 w-8">{prop.statLabel}</span>
      <span className="text-xs text-primary w-10 text-right">{prop.seasonAvg.toFixed(1)}</span>
      
      {showSlider ? (
        <>
          <Slider
            value={[localLine]}
            onValueChange={handleSliderChange}
            min={range.min}
            max={range.max}
            step={range.step}
            className="flex-1 mx-2"
          />
          <span className="text-xs font-medium text-white w-10 text-right">{localLine.toFixed(1)}</span>
        </>
      ) : (
        <span className="text-xs font-medium text-white flex-1 text-center">{localLine.toFixed(1)}</span>
      )}
      
      <Badge className={cn("text-xs w-6 h-5 flex items-center justify-center p-0", rec.color)}>
        {rec.text}
      </Badge>
    </div>
  );
}

// ============================================================================
// PLAYER CARD COMPONENT
// ============================================================================

interface PlayerCardProps {
  player: Player;
  props: PlayerPropLine[];
  onPropLineChange: (stat: string, line: number) => void;
  onSelect?: () => void;
  showSliders: boolean;
  isSelected?: boolean;
}

function PlayerCard({ 
  player, 
  props, 
  onPropLineChange, 
  onSelect, 
  showSliders,
  isSelected 
}: PlayerCardProps) {
  const ppg = parseFloat(player.ppg || "0");
  const rpg = parseFloat(player.rpg || "0");
  const apg = parseFloat(player.apg || "0");
  const pra = ppg + rpg + apg;

  return (
    <Card className={cn(
      "bg-slate-800/50 border-slate-700 transition-all",
      isSelected && "border-primary ring-1 ring-primary",
      onSelect && "cursor-pointer hover:border-primary/50"
    )} onClick={onSelect}>
      <CardContent className="p-3">
        {/* Player Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm">
              {player.firstName} {player.lastName}
            </span>
            <Badge variant="outline" className="text-xs border-slate-600 text-gray-400">
              {player.position}
            </Badge>
          </div>
          {ppg >= 20 && <Star className="w-4 h-4 text-secondary" />}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 mb-3 text-xs">
          <span className="text-gray-400">
            <span className="text-primary font-medium">{ppg.toFixed(1)}</span> PPG
          </span>
          <span className="text-gray-400">
            <span className="text-secondary font-medium">{rpg.toFixed(1)}</span> RPG
          </span>
          <span className="text-gray-400">
            <span className="text-primary font-medium">{apg.toFixed(1)}</span> APG
          </span>
          <span className="text-gray-400 ml-auto">
            <span className="text-white font-medium">{pra.toFixed(1)}</span> PRA
          </span>
        </div>

        {/* Props with Sliders */}
        <div className="space-y-1 border-t border-slate-700 pt-2">
          {props.map(prop => (
            <PlayerPropRow
              key={`${player.id}-${prop.stat}`}
              prop={prop}
              onLineChange={(line) => onPropLineChange(prop.stat, line)}
              showSlider={showSliders}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TeamRosterPanel({
  teamName,
  teamAbbr,
  onPlayerSelect,
  onPropLineChange,
  showSliders = true,
  maxPlayers = 8,
  className
}: TeamRosterPanelProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [playerProps, setPlayerProps] = useState<Map<number, PlayerPropLine[]>>(new Map());

  // Fetch all players
  const { data: allPlayers, isLoading } = trpc.players.getAll.useQuery();

  // Filter players by team
  const teamPlayers = useMemo(() => {
    if (!allPlayers) return [];
    
    const searchTerms = [
      teamName.toLowerCase(),
      teamAbbr?.toLowerCase() || ""
    ].filter(Boolean);

    return allPlayers
      .filter(p => {
        const playerTeam = (p.team || "").toLowerCase();
        return searchTerms.some(term => 
          playerTeam.includes(term) || term.includes(playerTeam)
        );
      })
      .sort((a, b) => {
        // Sort by PPG descending
        const ppgA = parseFloat(a.ppg || "0");
        const ppgB = parseFloat(b.ppg || "0");
        return ppgB - ppgA;
      })
      .slice(0, maxPlayers);
  }, [allPlayers, teamName, teamAbbr, maxPlayers]);

  // Initialize player props when team players change
  useEffect(() => {
    const newProps = new Map<number, PlayerPropLine[]>();
    
    teamPlayers.forEach(player => {
      const ppg = parseFloat(player.ppg || "0");
      const rpg = parseFloat(player.rpg || "0");
      const apg = parseFloat(player.apg || "0");
      const spg = parseFloat(player.spg || "0");
      const bpg = parseFloat(player.bpg || "0");
      const tpm = parseFloat(player.tpm || "0");
      const pra = ppg + rpg + apg;

      const props: PlayerPropLine[] = [];

      // Only add props for meaningful stats
      if (ppg > 5) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          position: player.position || "G",
          stat: "points",
          statLabel: "PTS",
          seasonAvg: ppg,
          line: Math.round(ppg * 2) / 2,
          edge: 0
        });
      }

      if (rpg > 3) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          position: player.position || "G",
          stat: "rebounds",
          statLabel: "REB",
          seasonAvg: rpg,
          line: Math.round(rpg * 2) / 2,
          edge: 0
        });
      }

      if (apg > 2) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          position: player.position || "G",
          stat: "assists",
          statLabel: "AST",
          seasonAvg: apg,
          line: Math.round(apg * 2) / 2,
          edge: 0
        });
      }

      if (pra > 15) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          position: player.position || "G",
          stat: "pra",
          statLabel: "PRA",
          seasonAvg: pra,
          line: Math.round(pra * 2) / 2,
          edge: 0
        });
      }

      if (tpm > 1) {
        props.push({
          playerId: player.id,
          playerName: `${player.firstName} ${player.lastName}`,
          position: player.position || "G",
          stat: "threes",
          statLabel: "3PM",
          seasonAvg: tpm,
          line: Math.round(tpm * 2) / 2,
          edge: 0
        });
      }

      newProps.set(player.id, props);
    });

    setPlayerProps(newProps);
  }, [teamPlayers]);

  // Handle prop line change
  const handlePropLineChange = (playerId: number, stat: string, line: number) => {
    setPlayerProps(prev => {
      const newProps = new Map(prev);
      const playerPropsList = newProps.get(playerId);
      if (playerPropsList) {
        const updated = playerPropsList.map(p => 
          p.stat === stat ? { ...p, line } : p
        );
        newProps.set(playerId, updated);
      }
      return newProps;
    });
    
    onPropLineChange?.(playerId, stat, line);
  };

  // Handle player selection
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayerId(player.id);
    onPlayerSelect?.(player);
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-slate-800/50 border-slate-700", className)}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-400">Loading roster...</span>
        </CardContent>
      </Card>
    );
  }

  if (teamPlayers.length === 0) {
    return (
      <Card className={cn("bg-slate-800/50 border-slate-700", className)}>
        <CardContent className="py-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400">No players found for {teamName}</p>
          <p className="text-xs text-gray-500 mt-1">Player data may not be synced</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-slate-800/50 border-slate-700", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {teamName} Roster
          <Badge variant="outline" className="ml-auto text-xs border-slate-600 text-gray-400">
            {teamPlayers.length} players
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {teamPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            props={playerProps.get(player.id) || []}
            onPropLineChange={(stat, line) => handlePropLineChange(player.id, stat, line)}
            onSelect={onPlayerSelect ? () => handlePlayerSelect(player) : undefined}
            showSliders={showSliders}
            isSelected={selectedPlayerId === player.id}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DUAL TEAM ROSTER (FOR GAME SELECTION)
// ============================================================================

interface DualTeamRosterProps {
  homeTeam: string;
  awayTeam: string;
  homeAbbr?: string;
  awayAbbr?: string;
  onPlayerSelect?: (player: Player, team: "home" | "away") => void;
  onPropLineChange?: (playerId: number, stat: string, line: number) => void;
  showSliders?: boolean;
  maxPlayersPerTeam?: number;
}

export function DualTeamRoster({
  homeTeam,
  awayTeam,
  homeAbbr,
  awayAbbr,
  onPlayerSelect,
  onPropLineChange,
  showSliders = true,
  maxPlayersPerTeam = 6
}: DualTeamRosterProps) {
  const [activeTab, setActiveTab] = useState<"home" | "away" | "all">("all");

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
      <TabsList className="bg-slate-800 border-slate-700 mb-4">
        <TabsTrigger 
          value="all" 
          className="data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          All Players
        </TabsTrigger>
        <TabsTrigger 
          value="home" 
          className="data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          {homeTeam}
        </TabsTrigger>
        <TabsTrigger 
          value="away" 
          className="data-[state=active]:bg-secondary data-[state=active]:text-black"
        >
          {awayTeam}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TeamRosterPanel
            teamName={homeTeam}
            teamAbbr={homeAbbr}
            onPlayerSelect={onPlayerSelect ? (p) => onPlayerSelect(p, "home") : undefined}
            onPropLineChange={onPropLineChange}
            showSliders={showSliders}
            maxPlayers={maxPlayersPerTeam}
          />
          <TeamRosterPanel
            teamName={awayTeam}
            teamAbbr={awayAbbr}
            onPlayerSelect={onPlayerSelect ? (p) => onPlayerSelect(p, "away") : undefined}
            onPropLineChange={onPropLineChange}
            showSliders={showSliders}
            maxPlayers={maxPlayersPerTeam}
          />
        </div>
      </TabsContent>

      <TabsContent value="home">
        <TeamRosterPanel
          teamName={homeTeam}
          teamAbbr={homeAbbr}
          onPlayerSelect={onPlayerSelect ? (p) => onPlayerSelect(p, "home") : undefined}
          onPropLineChange={onPropLineChange}
          showSliders={showSliders}
          maxPlayers={maxPlayersPerTeam * 2}
        />
      </TabsContent>

      <TabsContent value="away">
        <TeamRosterPanel
          teamName={awayTeam}
          teamAbbr={awayAbbr}
          onPlayerSelect={onPlayerSelect ? (p) => onPlayerSelect(p, "away") : undefined}
          onPropLineChange={onPropLineChange}
          showSliders={showSliders}
          maxPlayers={maxPlayersPerTeam * 2}
        />
      </TabsContent>
    </Tabs>
  );
}
