import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "../lib/trpc";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Star,
  StarOff,
  Info,
  X,
  Settings2,
  Sliders,
  Home,
  Radio,
  Gift,
  Menu,
  Lock,
  User,
  ChevronsUpDown
} from "lucide-react";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabType = "game_lines" | "player_props" | "team_props";
type FilterType = "All" | "Points" | "Rebounds" | "Assists" | "Combos";

const PROP_TYPES = [
  { id: "points", name: "POINTS", shortName: "PTS", statKey: "ppg" },
  { id: "rebounds", name: "REBOUNDS", shortName: "REB", statKey: "rpg" },
  { id: "assists", name: "ASSISTS", shortName: "AST", statKey: "apg" },
  { id: "steals", name: "STEALS", shortName: "STL", statKey: "spg" },
  { id: "blocks", name: "BLOCKS", shortName: "BLK", statKey: "bpg" },
  { id: "turnovers", name: "TURNOVERS", shortName: "TO", statKey: "tov" },
  { id: "dd", name: "DOUBLE DOUBLE", shortName: "DD", statKey: "dd" },
  { id: "td", name: "TRIPLE DOUBLE", shortName: "TD", statKey: "td" },
  { id: "pa", name: "POINTS AND ASSISTS", shortName: "P+A", statKey: "pa" },
  { id: "pr", name: "POINTS AND REBOUNDS", shortName: "P+R", statKey: "pr" },
  { id: "pra", name: "POINTS AND REBOUNDS AND ASSISTS", shortName: "PRA", statKey: "pra" },
  { id: "threes", name: "THREE POINTERS MADE", shortName: "3PM", statKey: "tpm" },
  { id: "ra", name: "REBOUNDS AND ASSISTS", shortName: "R+A", statKey: "ra" },
  { id: "q1_points", name: "1ST QUARTER POINTS", shortName: "Q1", statKey: "q1" },
];

const FILTER_OPTIONS: FilterType[] = ["All", "Points", "Rebounds", "Assists", "Combos"];

// Team abbreviations mapping
const TEAM_ABBR: Record<string, string> = {
  "Atlanta Hawks": "ATL", "Boston Celtics": "BOS", "Brooklyn Nets": "BKN",
  "Charlotte Hornets": "CHA", "Chicago Bulls": "CHI", "Cleveland Cavaliers": "CLE",
  "Dallas Mavericks": "DAL", "Denver Nuggets": "DEN", "Detroit Pistons": "DET",
  "Golden State Warriors": "GSW", "Houston Rockets": "HOU", "Indiana Pacers": "IND",
  "LA Clippers": "LAC", "Los Angeles Lakers": "LAL", "Memphis Grizzlies": "MEM",
  "Miami Heat": "MIA", "Milwaukee Bucks": "MIL", "Minnesota Timberwolves": "MIN",
  "New Orleans Pelicans": "NOP", "New York Knicks": "NYK", "Oklahoma City Thunder": "OKC",
  "Orlando Magic": "ORL", "Philadelphia 76ers": "PHI", "Phoenix Suns": "PHX",
  "Portland Trail Blazers": "POR", "Sacramento Kings": "SAC", "San Antonio Spurs": "SAS",
  "Toronto Raptors": "TOR", "Utah Jazz": "UTA", "Washington Wizards": "WAS",
};



// ============================================================================
// FORMULA TOOLS CONFIGURATION
// ============================================================================

interface FormulaConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: "slider" | "dropdown" | "both";
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    default: number;
    unit: string;
  };
  dropdownConfig?: {
    options: { value: string; label: string }[];
    default: string;
  };
}

const DEFAULT_FORMULAS: FormulaConfig[] = [
  {
    id: "home_court",
    name: "Home Court Advantage",
    description: "Adjusts projected score based on home court advantage",
    enabled: true,
    type: "slider",
    sliderConfig: { min: 0, max: 8, step: 0.5, default: 3.5, unit: "pts" }
  },
  {
    id: "rest_days",
    name: "Rest Days Factor",
    description: "Adjusts for team fatigue based on rest between games",
    enabled: true,
    type: "dropdown",
    dropdownConfig: {
      options: [
        { value: "b2b", label: "Back-to-Back (-3 pts)" },
        { value: "1day", label: "1 Day Rest (0 pts)" },
        { value: "2day", label: "2+ Days Rest (+1.5 pts)" },
      ],
      default: "1day"
    }
  },
  {
    id: "pace_adjust",
    name: "Pace Adjustment",
    description: "Adjusts totals based on team pace factors",
    enabled: true,
    type: "slider",
    sliderConfig: { min: 0.8, max: 1.2, step: 0.02, default: 1.0, unit: "x" }
  },
  {
    id: "recent_form",
    name: "Recent Form Weight",
    description: "Weight given to last N games vs season average",
    enabled: false,
    type: "both",
    sliderConfig: { min: 0, max: 100, step: 5, default: 30, unit: "%" },
    dropdownConfig: {
      options: [
        { value: "5", label: "Last 5 Games" },
        { value: "10", label: "Last 10 Games" },
        { value: "15", label: "Last 15 Games" },
      ],
      default: "10"
    }
  },
  {
    id: "injury_impact",
    name: "Injury Impact",
    description: "Adjusts lines when key players are out",
    enabled: false,
    type: "dropdown",
    dropdownConfig: {
      options: [
        { value: "none", label: "No Key Injuries" },
        { value: "star_out", label: "Star Player Out (-5 to +5 pts)" },
        { value: "multiple", label: "Multiple Starters Out (-8 to +8 pts)" },
      ],
      default: "none"
    }
  },
  {
    id: "h2h_history",
    name: "Head-to-Head History",
    description: "Factors in historical matchup performance",
    enabled: false,
    type: "slider",
    sliderConfig: { min: 0, max: 50, step: 5, default: 15, unit: "%" }
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTeamAbbr = (teamName: string): string => {
  return TEAM_ABBR[teamName] || teamName.substring(0, 3).toUpperCase();
};

const generateOdds = (isOver: boolean, variance: number = 0): number => {
  const base = isOver ? -115 : -105;
  return base + Math.floor(variance * 10);
};

const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : odds.toString();
};

const getPlayerPropLine = (player: any, propType: string): number | null => {
  // First check if player has propsData from Odds API
  if (player.propsData && player.propsData[propType]) {
    return player.propsData[propType].line;
  }
  
  // Fallback to calculated lines from stats
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
    case "turnovers": return 2.5; // Default turnover line
    case "threes": return tpm > 0 ? Math.round(tpm * 2) / 2 : null;
    case "pra": return (ppg + rpg + apg) > 0 ? Math.round((ppg + rpg + apg) * 2) / 2 : null;
    case "pa": return (ppg + apg) > 0 ? Math.round((ppg + apg) * 2) / 2 : null;
    case "pr": return (ppg + rpg) > 0 ? Math.round((ppg + rpg) * 2) / 2 : null;
    case "ra": return (rpg + apg) > 0 ? Math.round((rpg + apg) * 2) / 2 : null;
    default: return null;
  }
};

// Get player prop odds from Odds API data
const getPlayerPropOdds = (player: any, propType: string): { overOdds: number; underOdds: number } | null => {
  if (player.propsData && player.propsData[propType]) {
    return {
      overOdds: player.propsData[propType].overOdds,
      underOdds: player.propsData[propType].underOdds
    };
  }
  return null;
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Team Logo Badge Component
function TeamBadge({ teamName, size = "md" }: { teamName: string; size?: "sm" | "md" }) {
  const abbr = getTeamAbbr(teamName);
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  
  // Team colors (simplified)
  const getTeamColor = (abbr: string) => {
    const colors: Record<string, string> = {
      MIL: "bg-green-700", CHA: "bg-teal-600", PHX: "bg-purple-700",
      WAS: "bg-red-700", DEN: "bg-yellow-600", MIA: "bg-red-600",
      LAL: "bg-purple-600", BOS: "bg-green-600", GSW: "bg-blue-600",
      // Add more as needed
    };
    return colors[abbr] || "bg-slate-600";
  };

  return (
    <div className={`${sizeClasses} ${getTeamColor(abbr)} rounded-lg flex items-center justify-center font-bold text-white`}>
      {abbr}
    </div>
  );
}

// Odds Button Component
function OddsButton({ 
  label, 
  odds, 
  subLabel,
  onClick,
  variant = "default",
  locked = false
}: { 
  label: string; 
  odds: number; 
  subLabel?: string;
  onClick?: () => void;
  variant?: "default" | "wide";
  locked?: boolean;
}) {
  if (locked) {
    return (
      <div className={`flex-1 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center ${
        variant === "wide" ? "min-w-[140px]" : ""
      }`}>
        <Lock className="w-4 h-4 text-slate-500 mx-auto" />
      </div>
    );
  }
  
  return (
    <button 
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-colors text-center ${
        variant === "wide" ? "min-w-[140px]" : ""
      }`}
    >
      <p className="text-sm font-medium text-white">{label}</p>
      {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
      <p className="text-sm font-semibold text-primary mt-1">{formatOdds(odds)}</p>
    </button>
  );
}

// Generate alternate lines for a player
function generateAltLines(baseLine: number, propType: string): { line: number; overOdds: number; underOdds: number | null }[] {
  const lines: { line: number; overOdds: number; underOdds: number | null }[] = [];
  
  // Generate lines below the base (heavy favorites for over)
  const step = propType === "threes" ? 0.5 : propType === "steals" || propType === "blocks" ? 0.5 : 2.5;
  const minLine = Math.max(0.5, baseLine - step * 4);
  const maxLine = baseLine + step * 3;
  
  for (let line = minLine; line <= maxLine; line += step) {
    const diff = line - baseLine;
    let overOdds: number;
    let underOdds: number | null;
    
    if (diff < -step * 2) {
      // Very low line - heavy over favorite
      overOdds = Math.round(-3000 + diff * 500);
      underOdds = null; // Locked
    } else if (diff < -step) {
      // Low line - over favorite
      overOdds = Math.round(-1000 + diff * 300);
      underOdds = null;
    } else if (diff < 0) {
      // Slightly below base
      overOdds = Math.round(-300 + diff * 100);
      underOdds = null;
    } else if (diff === 0) {
      // Base line
      overOdds = -115;
      underOdds = -125;
    } else if (diff <= step) {
      // Slightly above base
      overOdds = Math.round(100 + diff * 50);
      underOdds = null;
    } else {
      // High line - over underdog
      overOdds = Math.round(200 + diff * 40);
      underOdds = null;
    }
    
    lines.push({ line: Math.round(line * 2) / 2, overOdds, underOdds });
  }
  
  return lines;
}

// Player Detail Panel Component
function PlayerDetailPanel({ 
  player, 
  propType,
  onClose 
}: { 
  player: any; 
  propType: { id: string; name: string };
  onClose: () => void;
}) {
  const [activeStatTab, setActiveStatTab] = useState(propType.id);
  const baseLine = getPlayerPropLine(player, activeStatTab) || 0;
  const altLines = generateAltLines(baseLine, activeStatTab);
  
  // Available stat tabs for this player
  const statTabs = [
    { id: propType.id, name: propType.name },
    { id: "pa", name: "POINTS AND ASSISTS" },
    { id: "pr", name: "POINTS AND REBOUNDS" },
    { id: "pra", name: "PTS + REB + AST" },
  ].filter(tab => {
    const line = getPlayerPropLine(player, tab.id);
    return line !== null && line > 0;
  });

  return (
    <div className="bg-gradient-to-b from-green-900/80 to-slate-900 border-t border-green-700/50">
      {/* Player Header */}
      <div className="p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-white">{player.fullName}</p>
          <p className="text-sm text-slate-300">{player.team} • {player.position}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Stat Type Tabs */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
        {statTabs.map(tab => (
          <Badge
            key={tab.id}
            variant={activeStatTab === tab.id ? "default" : "outline"}
            className={`cursor-pointer whitespace-nowrap px-3 py-1.5 ${
              activeStatTab === tab.id 
                ? "bg-white text-slate-900" 
                : "bg-transparent border-slate-500 text-slate-300 hover:bg-slate-800"
            }`}
            onClick={() => setActiveStatTab(tab.id)}
          >
            {tab.name}
          </Badge>
        ))}
      </div>
      
      {/* Alt Lines Grid */}
      <div className="px-4 pb-4 space-y-2">
        {altLines.map((alt, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-12 text-sm font-medium text-white">{alt.line}</div>
            <OddsButton 
              label={`Over ${alt.line}`}
              odds={alt.overOdds}
            />
            <OddsButton 
              label={alt.underOdds ? `Under ${alt.line}` : ""}
              odds={alt.underOdds || 0}
              locked={alt.underOdds === null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Formula Tool Component
function FormulaTool({ 
  formula, 
  onToggle, 
  onSliderChange, 
  onDropdownChange,
  sliderValue,
  dropdownValue
}: { 
  formula: FormulaConfig;
  onToggle: (enabled: boolean) => void;
  onSliderChange?: (value: number) => void;
  onDropdownChange?: (value: string) => void;
  sliderValue?: number;
  dropdownValue?: string;
}) {
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      formula.enabled 
        ? "bg-slate-800/50 border-primary/30" 
        : "bg-slate-900/30 border-slate-800/50 opacity-60"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{formula.name}</p>
          <p className="text-xs text-slate-400">{formula.description}</p>
        </div>
        <Switch 
          checked={formula.enabled} 
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />
      </div>
      
      {formula.enabled && (
        <div className="mt-3 space-y-3">
          {/* Slider */}
          {formula.sliderConfig && (formula.type === "slider" || formula.type === "both") && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{formula.sliderConfig.min}{formula.sliderConfig.unit}</span>
                <span className="text-primary font-medium">
                  {sliderValue ?? formula.sliderConfig.default}{formula.sliderConfig.unit}
                </span>
                <span>{formula.sliderConfig.max}{formula.sliderConfig.unit}</span>
              </div>
              <Slider
                value={[sliderValue ?? formula.sliderConfig.default]}
                min={formula.sliderConfig.min}
                max={formula.sliderConfig.max}
                step={formula.sliderConfig.step}
                onValueChange={(v) => onSliderChange?.(v[0])}
                className="[&_[role=slider]]:bg-primary"
              />
            </div>
          )}
          
          {/* Dropdown */}
          {formula.dropdownConfig && (formula.type === "dropdown" || formula.type === "both") && (
            <Select 
              value={dropdownValue ?? formula.dropdownConfig.default}
              onValueChange={onDropdownChange}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {formula.dropdownConfig.options.map(opt => (
                  <SelectItem 
                    key={opt.value} 
                    value={opt.value}
                    className="text-white hover:bg-slate-700"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GamePropsNew() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // State
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("game_lines");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["moneyline", "spread", "total"]));
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["points", "assists", "steals"]));
  const [showFormulas, setShowFormulas] = useState(false);
  const [formulas, setFormulas] = useState<FormulaConfig[]>(DEFAULT_FORMULAS);
  const [formulaValues, setFormulaValues] = useState<Record<string, { slider?: number; dropdown?: string }>>({});
  const [showSGPInfo, setShowSGPInfo] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState<{ player: any; propType: { id: string; name: string } } | null>(null);

  // Parse query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return { prop: params.get("prop") };
  }, [searchString]);

  // Fetch data
  const { data: games, isLoading: gamesLoading } = trpc.odds.getUpcomingGames.useQuery();
  const { data: allPlayersFromDb } = trpc.nba.getAllPlayers.useQuery();
  
  // Fetch player props from Odds API when a game is selected
  const { data: playerPropsData, isLoading: propsLoading } = trpc.odds.getAllPlayerProps.useQuery(
    { eventId: selectedGame?.id || "" },
    { enabled: !!selectedGame?.id }
  );

  // Auto-expand prop from query param
  useEffect(() => {
    if (queryParams.prop && selectedGame) {
      setActiveTab("player_props");
      setExpandedSections(new Set([queryParams.prop]));
    }
  }, [queryParams.prop, selectedGame]);

  // Parse player props from Odds API into a usable format
  const parsedPlayerProps = useMemo(() => {
    if (!playerPropsData?.bookmakers?.length) return {};
    
    const propsMap: Record<string, { 
      name: string; 
      team: string;
      props: Record<string, { line: number; overOdds: number; underOdds: number }> 
    }> = {};
    
    // Get first bookmaker's data
    const bookmaker = playerPropsData.bookmakers[0];
    
    for (const market of bookmaker.markets || []) {
      // Map market keys to our prop type IDs
      const propTypeMap: Record<string, string> = {
        "player_points": "points",
        "player_rebounds": "rebounds",
        "player_assists": "assists",
        "player_threes": "threes",
        "player_points_rebounds_assists": "pra",
        "player_steals": "steals",
        "player_blocks": "blocks",
      };
      
      const propType = propTypeMap[market.key] || market.key;
      
      for (const outcome of market.outcomes || []) {
        const playerName = outcome.description || outcome.name;
        if (!playerName) continue;
        
        if (!propsMap[playerName]) {
          // Determine team based on player name matching
          const isHomeTeam = playerPropsData.home_team && 
            (outcome.description?.includes(playerPropsData.home_team) || false);
          propsMap[playerName] = {
            name: playerName,
            team: isHomeTeam ? playerPropsData.home_team : playerPropsData.away_team,
            props: {}
          };
        }
        
        const isOver = outcome.name === "Over";
        const line = outcome.point || 0;
        
        if (!propsMap[playerName].props[propType]) {
          propsMap[playerName].props[propType] = { line, overOdds: 0, underOdds: 0 };
        }
        
        if (isOver) {
          propsMap[playerName].props[propType].overOdds = outcome.price;
          propsMap[playerName].props[propType].line = line;
        } else {
          propsMap[playerName].props[propType].underOdds = outcome.price;
        }
      }
    }
    
    return propsMap;
  }, [playerPropsData]);

  // Get players for selected game - combine DB players with Odds API props
  const gamePlayers = useMemo(() => {
    if (!selectedGame) return { home: [], away: [] };
    
    // If we have props from Odds API, use those players
    if (Object.keys(parsedPlayerProps).length > 0) {
      const players = Object.entries(parsedPlayerProps).map(([name, data]) => ({
        id: name,
        fullName: name,
        team: data.team,
        position: "",
        ppg: data.props.points?.line?.toString() || "0",
        rpg: data.props.rebounds?.line?.toString() || "0",
        apg: data.props.assists?.line?.toString() || "0",
        spg: "0",
        bpg: "0",
        tpm: data.props.threes?.line?.toString() || "0",
        propsData: data.props
      }));
      
      return {
        home: players.filter(p => p.team === selectedGame.homeTeam)
          .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg)),
        away: players.filter(p => p.team === selectedGame.awayTeam)
          .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg)),
      };
    }
    
    // Fallback to DB players if no Odds API data
    if (!allPlayersFromDb) return { home: [], away: [] };
    
    const matchTeam = (playerTeam: string, teamName: string) => {
      if (!playerTeam || !teamName) return false;
      const pTeam = playerTeam.toLowerCase();
      const tName = teamName.toLowerCase();
      return pTeam.includes(tName) || tName.includes(pTeam) ||
             pTeam.split(' ').some((w: string) => tName.includes(w)) ||
             tName.split(' ').some((w: string) => pTeam.includes(w));
    };

    return {
      home: allPlayersFromDb.filter(p => matchTeam(p.team || "", selectedGame.homeTeam))
        .sort((a, b) => parseFloat(b.ppg || "0") - parseFloat(a.ppg || "0")),
      away: allPlayersFromDb.filter(p => matchTeam(p.team || "", selectedGame.awayTeam))
        .sort((a, b) => parseFloat(b.ppg || "0") - parseFloat(a.ppg || "0")),
    };
  }, [selectedGame, allPlayersFromDb, parsedPlayerProps]);

  // Filter prop types
  const filteredPropTypes = useMemo(() => {
    if (activeFilter === "All") return PROP_TYPES;
    if (activeFilter === "Points") return PROP_TYPES.filter(p => p.id === "points" || p.id === "q1_points");
    if (activeFilter === "Rebounds") return PROP_TYPES.filter(p => p.id === "rebounds");
    if (activeFilter === "Assists") return PROP_TYPES.filter(p => p.id === "assists");
    if (activeFilter === "Combos") return PROP_TYPES.filter(p => ["pra", "pa", "pr", "ra"].includes(p.id));
    return PROP_TYPES;
  }, [activeFilter]);

  // Handlers
  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFormula = (id: string, enabled: boolean) => {
    setFormulas(prev => prev.map(f => f.id === id ? { ...f, enabled } : f));
  };

  const updateFormulaValue = (id: string, type: "slider" | "dropdown", value: number | string) => {
    setFormulaValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [type]: value }
    }));
  };

  // Generate game lines (mock data based on team stats)
  const getGameLines = () => {
    if (!selectedGame) return null;
    
    // Mock lines - in production these would come from odds API
    const homeSpread = -3.5;
    const total = 227.5;
    const homeML = -165;
    const awayML = 130;
    
    return { homeSpread, total, homeML, awayML };
  };

  const gameLines = getGameLines();

  // ============================================================================
  // RENDER: GAMES LIST VIEW
  // ============================================================================
  
  if (!selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-white">NBA Games</h1>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowFormulas(!showFormulas)}
              >
                <Settings2 className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Sport Icons Row */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <button 
                onClick={() => setLocation("/")}
                className="flex flex-col items-center gap-1 min-w-[50px] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <Home className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">Home</span>
              </button>
              <button 
                onClick={() => setLocation("/live-odds")}
                className="flex flex-col items-center gap-1 min-w-[50px] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <Radio className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">In Play</span>
              </button>
              <button 
                onClick={() => setLocation("/betting-analyzer")}
                className="flex flex-col items-center gap-1 min-w-[50px] relative cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <Gift className="w-5 h-5 text-slate-400" />
                </div>
                <Badge className="absolute -top-1 -right-1 bg-primary text-xs px-1.5 py-0">10</Badge>
                <span className="text-xs text-slate-400">Offers</span>
              </button>
              <div className="flex flex-col items-center gap-1 min-w-[50px]">
                <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <span className="text-lg">🏀</span>
                </div>
                <span className="text-xs text-primary font-medium">NBA</span>
              </div>
              <button 
                onClick={() => setLocation("/player-stats")}
                className="flex flex-col items-center gap-1 min-w-[50px] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <Menu className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs text-slate-400">More</span>
              </button>
            </div>
          </div>
        </div>

        {/* Formula Tools Panel */}
        {showFormulas && (
          <div className="p-4 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-white">Analysis Tools</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowFormulas(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {formulas.map(formula => (
                <FormulaTool
                  key={formula.id}
                  formula={formula}
                  onToggle={(enabled) => toggleFormula(formula.id, enabled)}
                  onSliderChange={(v) => updateFormulaValue(formula.id, "slider", v)}
                  onDropdownChange={(v) => updateFormulaValue(formula.id, "dropdown", v)}
                  sliderValue={formulaValues[formula.id]?.slider}
                  dropdownValue={formulaValues[formula.id]?.dropdown}
                />
              ))}
            </div>
          </div>
        )}

        {/* Games List */}
        <div className="p-4 space-y-4">
          {gamesLoading ? (
            <div className="text-center py-12 text-slate-400">Loading games...</div>
          ) : !games || games.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No upcoming games</div>
          ) : (
            games.map((game) => {
              // Use displayTime and displayDate from API, or format from gameTime
              const timeStr = game.displayTime || (game.gameTime ? new Date(game.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD');
              const dateStr = game.displayDate || (game.gameTime ? new Date(game.gameTime).toLocaleDateString('en-US', { weekday: 'short' }) : 'TBD');
              
              // Use real odds from API only - no fallback to generated values
              const homeML = game.moneyline?.home;
              const awayML = game.moneyline?.away;
              const spreadHome = game.spread?.home;
              const spreadAway = game.spread?.away;
              const total = game.total;
              
              return (
                <Card 
                  key={game.id}
                  className="bg-slate-800/50 border-slate-700/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => setSelectedGame(game)}
                >
                  <CardContent className="p-0">
                    {/* Time Header */}
                    <div className="px-4 py-2 border-b border-slate-700/50">
                      <p className="text-xs text-slate-400">{dateStr} at {timeStr}</p>
                    </div>
                    
                    {/* Column Headers */}
                    <div className="px-4 py-2 grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs text-slate-400">
                      <div></div>
                      <div className="text-center">Moneyline</div>
                      <div className="text-center">Spread</div>
                      <div className="text-center">Total</div>
                    </div>
                    
                    {/* Away Team Row */}
                    <div className="px-4 py-2 grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <TeamBadge teamName={game.awayTeam} size="sm" />
                        <span className="text-sm font-medium text-white truncate">
                          {getTeamAbbr(game.awayTeam)} {game.awayTeam.split(' ').pop()}
                        </span>
                      </div>
                      <div className="text-center">
                        {awayML !== undefined && awayML !== null ? (
                          <span className={`text-sm font-semibold ${awayML > 0 ? 'text-green-400' : 'text-primary'}`}>
                            {formatOdds(awayML)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </div>
                      <div className="text-center">
                        {spreadAway !== undefined && spreadAway !== null ? (
                          <>
                            <div className="text-sm font-medium text-white">{spreadAway > 0 ? '+' : ''}{spreadAway}</div>
                            <div className="text-xs text-slate-400">-110</div>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </div>
                      <div className="text-center">
                        {total !== undefined && total !== null ? (
                          <>
                            <div className="text-sm font-medium text-white">U {total}</div>
                            <div className="text-xs text-slate-400">-105</div>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Home Team Row */}
                    <div className="px-4 py-2 grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <TeamBadge teamName={game.homeTeam} size="sm" />
                        <span className="text-sm font-medium text-white truncate">
                          {getTeamAbbr(game.homeTeam)} {game.homeTeam.split(' ').pop()}
                        </span>
                      </div>
                      <div className="text-center">
                        {homeML !== undefined && homeML !== null ? (
                          <span className={`text-sm font-semibold ${homeML > 0 ? 'text-green-400' : 'text-primary'}`}>
                            {formatOdds(homeML)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </div>
                      <div className="text-center">
                        {spreadHome !== undefined && spreadHome !== null ? (
                          <>
                            <div className="text-sm font-medium text-white">{spreadHome > 0 ? '+' : ''}{spreadHome}</div>
                            <div className="text-xs text-slate-400">-110</div>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </div>
                      <div className="text-center">
                        {total !== undefined && total !== null ? (
                          <>
                            <div className="text-sm font-medium text-white">O {total}</div>
                            <div className="text-xs text-slate-400">-115</div>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-slate-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <span>🏀</span>
                        <span>NBA</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: GAME DETAIL VIEW
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="p-4">
          {/* Back & Game Info */}
          <div className="flex items-center gap-3 mb-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedGame(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <p className="text-xs text-slate-400">NBA</p>
              <p className="text-sm font-semibold text-white">
                {getTeamAbbr(selectedGame.awayTeam)} {selectedGame.awayTeam.split(' ').pop()} vs {getTeamAbbr(selectedGame.homeTeam)} {selectedGame.homeTeam.split(' ').pop()}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowFormulas(!showFormulas)}
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {(["game_lines", "player_props", "team_props"] as TabType[]).map(tab => (
              <Badge
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap px-4 py-1.5 ${
                  activeTab === tab 
                    ? "bg-slate-700 text-white border-slate-600" 
                    : "bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "game_lines" ? "Game Lines" : tab === "player_props" ? "Player Props" : "Team Props"}
              </Badge>
            ))}
          </div>

          {/* Filter Pills (Player Props only) */}
          {activeTab === "player_props" && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTER_OPTIONS.map(filter => (
                <Badge
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap ${
                    activeFilter === filter 
                      ? "bg-white text-slate-900" 
                      : "bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800"
                  }`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formula Tools Panel */}
      {showFormulas && (
        <div className="p-4 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white">Analysis Tools</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowFormulas(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {formulas.map(formula => (
              <FormulaTool
                key={formula.id}
                formula={formula}
                onToggle={(enabled) => toggleFormula(formula.id, enabled)}
                onSliderChange={(v) => updateFormulaValue(formula.id, "slider", v)}
                onDropdownChange={(v) => updateFormulaValue(formula.id, "dropdown", v)}
                sliderValue={formulaValues[formula.id]?.slider}
                dropdownValue={formulaValues[formula.id]?.dropdown}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* SGP Info Banner */}
        {showSGPInfo && (
          <Card className="bg-slate-800/30 border-slate-700/50 mb-4">
            <CardContent className="p-3 flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-300">
                  Markets denoted with <Badge variant="outline" className="text-xs mx-1 border-slate-600">SGP</Badge> icon can be combined into a single game parlay.
                </p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowSGPInfo(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* GAME LINES TAB */}
        {activeTab === "game_lines" && gameLines && (
          <div className="space-y-2">
            {/* Moneyline */}
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between"
                onClick={() => toggleSection("moneyline")}
              >
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite("moneyline"); }}>
                    {favorites.has("moneyline") ? (
                      <Star className="w-5 h-5 text-secondary fill-secondary" />
                    ) : (
                      <StarOff className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <span className="font-semibold text-white uppercase tracking-wide">MONEYLINE</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                {expandedSections.has("moneyline") ? (
                  <ChevronUp className="w-5 h-5 text-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-secondary" />
                )}
              </button>
              {expandedSections.has("moneyline") && (
                <div className="px-4 pb-4 flex gap-3">
                  <OddsButton 
                    label={`${getTeamAbbr(selectedGame.awayTeam)} ${selectedGame.awayTeam.split(' ').pop()}`}
                    odds={gameLines.awayML}
                    variant="wide"
                  />
                  <OddsButton 
                    label={`${getTeamAbbr(selectedGame.homeTeam)} ${selectedGame.homeTeam.split(' ').pop()}`}
                    odds={gameLines.homeML}
                    variant="wide"
                  />
                </div>
              )}
            </Card>

            {/* Point Spread */}
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between"
                onClick={() => toggleSection("spread")}
              >
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite("spread"); }}>
                    {favorites.has("spread") ? (
                      <Star className="w-5 h-5 text-secondary fill-secondary" />
                    ) : (
                      <StarOff className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <span className="font-semibold text-white uppercase tracking-wide">POINT SPREAD</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                {expandedSections.has("spread") ? (
                  <ChevronUp className="w-5 h-5 text-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-secondary" />
                )}
              </button>
              {expandedSections.has("spread") && (
                <div className="px-4 pb-4 flex gap-3">
                  <OddsButton 
                    label={`${getTeamAbbr(selectedGame.awayTeam)} ${selectedGame.awayTeam.split(' ').pop()} +${Math.abs(gameLines.homeSpread)}`}
                    odds={-110}
                    variant="wide"
                  />
                  <OddsButton 
                    label={`${getTeamAbbr(selectedGame.homeTeam)} ${selectedGame.homeTeam.split(' ').pop()} ${gameLines.homeSpread}`}
                    odds={-110}
                    variant="wide"
                  />
                </div>
              )}
            </Card>

            {/* Total Score */}
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between"
                onClick={() => toggleSection("total")}
              >
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite("total"); }}>
                    {favorites.has("total") ? (
                      <Star className="w-5 h-5 text-secondary fill-secondary" />
                    ) : (
                      <StarOff className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <span className="font-semibold text-white uppercase tracking-wide">TOTAL SCORE</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                {expandedSections.has("total") ? (
                  <ChevronUp className="w-5 h-5 text-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-secondary" />
                )}
              </button>
              {expandedSections.has("total") && (
                <div className="px-4 pb-4 flex gap-3">
                  <OddsButton 
                    label={`Over ${gameLines.total}`}
                    odds={-115}
                    variant="wide"
                  />
                  <OddsButton 
                    label={`Under ${gameLines.total}`}
                    odds={-105}
                    variant="wide"
                  />
                </div>
              )}
            </Card>

            {/* Alternative Spreads */}
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between"
                onClick={() => toggleSection("alt_spread")}
              >
                <div className="flex items-center gap-3">
                  <StarOff className="w-5 h-5 text-slate-500" />
                  <span className="font-semibold text-white uppercase tracking-wide">ALTERNATIVE POINT SPREAD</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                <ChevronDown className="w-5 h-5 text-secondary" />
              </button>
            </Card>

            {/* Alternative Totals */}
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between"
                onClick={() => toggleSection("alt_total")}
              >
                <div className="flex items-center gap-3">
                  <StarOff className="w-5 h-5 text-slate-500" />
                  <span className="font-semibold text-white uppercase tracking-wide">ALTERNATIVE TOTAL SCORE</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                <ChevronDown className="w-5 h-5 text-secondary" />
              </button>
            </Card>
          </div>
        )}

        {/* PLAYER PROPS TAB */}
        {activeTab === "player_props" && (
          <div className="space-y-2">
            {/* Expanded Player Detail Panel */}
            {expandedPlayer && (
              <PlayerDetailPanel
                player={expandedPlayer.player}
                propType={expandedPlayer.propType}
                onClose={() => setExpandedPlayer(null)}
              />
            )}
            
            {filteredPropTypes.map(propType => {
              const isExpanded = expandedSections.has(propType.id);
              const isFavorite = favorites.has(propType.id);
              
              // Get players with this prop
              const allGamePlayers = [...gamePlayers.away, ...gamePlayers.home];
              const playersWithProp = allGamePlayers
                .map(player => ({
                  ...player,
                  line: getPlayerPropLine(player, propType.id),
                }))
                .filter(p => p.line !== null && p.line > 0)
                .sort((a, b) => (b.line || 0) - (a.line || 0));

              return (
                <Card key={propType.id} className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
                  <button
                    className="w-full p-4 flex items-center justify-between"
                    onClick={() => toggleSection(propType.id)}
                  >
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(propType.id); }}>
                        {isFavorite ? (
                          <Star className="w-5 h-5 text-secondary fill-secondary" />
                        ) : (
                          <StarOff className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                      <span className="font-semibold text-white uppercase tracking-wide">{propType.name}</span>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-secondary" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-secondary" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-slate-700/50">
                      {propsLoading ? (
                        <div className="p-4 text-center text-slate-400 text-sm">
                          Loading player props...
                        </div>
                      ) : playersWithProp.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">
                          No players with {propType.name.toLowerCase()} data
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-700/30">
                          {playersWithProp.slice(0, 10).map((player) => {
                            const propOdds = getPlayerPropOdds(player, propType.id);
                            return (
                              <div key={player.id} className="p-3 flex items-center gap-3">
                                {/* Player Name with Expand Button */}
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-primary truncate">{player.fullName}</p>
                                  </div>
                                  <button 
                                    onClick={() => setExpandedPlayer({ player, propType: { id: propType.id, name: propType.name } })}
                                    className="p-1 rounded bg-green-600/20 hover:bg-green-600/40 transition-colors"
                                  >
                                    <ChevronsUpDown className="w-4 h-4 text-green-400" />
                                  </button>
                                </div>
                                
                                {/* Over/Under Buttons - Use real odds from API only */}
                                {propOdds?.overOdds ? (
                                  <OddsButton 
                                    label={`Over ${player.line}`}
                                    odds={propOdds.overOdds}
                                  />
                                ) : (
                                  <div className="flex-1 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                                    <p className="text-sm text-slate-500">N/A</p>
                                  </div>
                                )}
                                {propOdds?.underOdds ? (
                                  <OddsButton 
                                    label={`Under ${player.line}`}
                                    odds={propOdds.underOdds}
                                  />
                                ) : (
                                  <div className="flex-1 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                                    <p className="text-sm text-slate-500">N/A</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* TEAM PROPS TAB */}
        {activeTab === "team_props" && (
          <div className="space-y-2">
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button className="w-full p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StarOff className="w-5 h-5 text-slate-500" />
                  <span className="font-semibold text-white uppercase tracking-wide">TEAM TOTAL POINTS</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                <ChevronDown className="w-5 h-5 text-secondary" />
              </button>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button className="w-full p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StarOff className="w-5 h-5 text-slate-500" />
                  <span className="font-semibold text-white uppercase tracking-wide">1ST HALF SPREAD</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                <ChevronDown className="w-5 h-5 text-secondary" />
              </button>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
              <button className="w-full p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StarOff className="w-5 h-5 text-slate-500" />
                  <span className="font-semibold text-white uppercase tracking-wide">1ST HALF TOTAL</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">SGP</Badge>
                </div>
                <ChevronDown className="w-5 h-5 text-secondary" />
              </button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
