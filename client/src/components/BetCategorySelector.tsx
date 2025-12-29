import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Users, 
  Target, 
  Trophy,
  Zap,
  Shield,
  Timer,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// BET CATEGORY DEFINITIONS
// ============================================================================

export type PlayerPropType = 
  | "points"
  | "rebounds" 
  | "assists"
  | "steals"
  | "blocks"
  | "pra"           // Points + Rebounds + Assists
  | "double_double"
  | "pa"            // Points + Assists
  | "ra"            // Rebounds + Assists
  | "pr"            // Points + Rebounds
  | "combined_2"    // Total Points Any 2 Combined Players
  | "steals_blocks"
  | "two_pointers"
  | "three_pointers";

export type GameLineType =
  | "moneyline"
  | "spread"
  | "total"
  | "q1_ml"
  | "q1_spread"
  | "q1_total"
  | "h1_ml"
  | "h1_spread"
  | "h1_total"
  | "h2_ml"
  | "h2_spread"
  | "h2_total"
  | "alt_spread"
  | "alt_total";

export interface BetCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  subcategories: BetSubcategory[];
}

export interface BetSubcategory {
  id: PlayerPropType | GameLineType;
  name: string;
  shortName: string;
  description: string;
  formula: string;
  scriptsUsed: string[];
  dataRequired: string[];
  isAltAvailable?: boolean;
}

// Player Props Categories
export const PLAYER_PROP_CATEGORIES: BetSubcategory[] = [
  {
    id: "points",
    name: "Points",
    shortName: "PTS",
    description: "Total points scored by the player",
    formula: "Base PPG × Minutes Multiplier × Game Context × Rest Factor",
    scriptsUsed: ["Script1_BaseProjection", "Script4_GameContext", "Script12_RestImpact", "Script6_IntegratedModel"],
    dataRequired: ["Season PPG", "Minutes Per Game", "Home/Away", "Days Rest", "Opponent DRTG"],
    isAltAvailable: true
  },
  {
    id: "rebounds",
    name: "Rebounds",
    shortName: "REB",
    description: "Total rebounds (offensive + defensive)",
    formula: "Base RPG × Position Share × Opponent REB Rate × Pace Factor",
    scriptsUsed: ["Script23_ReboundingRate", "Script52_PropSpecific", "Script37_OpponentPace"],
    dataRequired: ["Season RPG", "Position", "Team REB Rate", "Opponent REB Allowed"],
    isAltAvailable: true
  },
  {
    id: "assists",
    name: "Assists",
    shortName: "AST",
    description: "Total assists recorded",
    formula: "Base APG × Usage Rate × Team Assist Rate × Matchup Factor",
    scriptsUsed: ["Script30_AssistsOpportunity", "Script7_UsageRateImpact", "Script52_PropSpecific"],
    dataRequired: ["Season APG", "Usage Rate", "Team AST Rate", "Opponent AST Allowed"],
    isAltAvailable: true
  },
  {
    id: "steals",
    name: "Steals",
    shortName: "STL",
    description: "Total steals recorded",
    formula: "Base SPG × Defensive Role × Opponent TO Rate × Minutes Factor",
    scriptsUsed: ["Script52_PropSpecific", "Script42_TurnoverRate", "Script8_MinutesDistribution"],
    dataRequired: ["Season SPG", "Position", "Opponent TO Rate"],
    isAltAvailable: true
  },
  {
    id: "blocks",
    name: "Blocks",
    shortName: "BLK",
    description: "Total blocks recorded",
    formula: "Base BPG × Position Factor × Opponent Shot Profile × Rim Protection",
    scriptsUsed: ["Script52_PropSpecific", "Script32_PositionMismatch", "Script35_ShotDifficulty"],
    dataRequired: ["Season BPG", "Position", "Opponent FGA at Rim"],
    isAltAvailable: true
  },
  {
    id: "pra",
    name: "Points + Rebounds + Assists",
    shortName: "PRA",
    description: "Combined total of points, rebounds, and assists",
    formula: "Points Proj + Rebounds Proj + Assists Proj ± Correlation Adjustment",
    scriptsUsed: ["Script1_BaseProjection", "Script23_ReboundingRate", "Script30_AssistsOpportunity", "Script55_ParlayCorrelation"],
    dataRequired: ["All individual stat requirements"],
    isAltAvailable: true
  },
  {
    id: "double_double",
    name: "Double Double",
    shortName: "DD",
    description: "Achieve 10+ in two statistical categories",
    formula: "P(PTS≥10) × P(REB≥10) + P(PTS≥10) × P(AST≥10) + P(REB≥10) × P(AST≥10)",
    scriptsUsed: ["Script53_MonteCarloRanges", "Script5_HitRate", "Script3_VarianceAnalysis"],
    dataRequired: ["Season averages", "Game logs", "Variance data"],
    isAltAvailable: false
  },
  {
    id: "pa",
    name: "Points + Assists",
    shortName: "P+A",
    description: "Combined points and assists total",
    formula: "Points Proj + Assists Proj ± Correlation Factor",
    scriptsUsed: ["Script1_BaseProjection", "Script30_AssistsOpportunity", "Script55_ParlayCorrelation"],
    dataRequired: ["Season PPG", "Season APG", "Usage Rate"],
    isAltAvailable: true
  },
  {
    id: "ra",
    name: "Rebounds + Assists",
    shortName: "R+A",
    description: "Combined rebounds and assists total",
    formula: "Rebounds Proj + Assists Proj ± Correlation Factor",
    scriptsUsed: ["Script23_ReboundingRate", "Script30_AssistsOpportunity", "Script55_ParlayCorrelation"],
    dataRequired: ["Season RPG", "Season APG", "Position"],
    isAltAvailable: true
  },
  {
    id: "pr",
    name: "Points + Rebounds",
    shortName: "P+R",
    description: "Combined points and rebounds total",
    formula: "Points Proj + Rebounds Proj ± Correlation Factor",
    scriptsUsed: ["Script1_BaseProjection", "Script23_ReboundingRate", "Script55_ParlayCorrelation"],
    dataRequired: ["Season PPG", "Season RPG", "Position"],
    isAltAvailable: true
  },
  {
    id: "combined_2",
    name: "Combined 2 Players Points",
    shortName: "2P PTS",
    description: "Total points from any two selected players",
    formula: "Player1 Proj + Player2 Proj ± Team Correlation ± Opponent Factor",
    scriptsUsed: ["Script1_BaseProjection", "Script55_ParlayCorrelation", "Script29_UsageRelationships"],
    dataRequired: ["Both players' stats", "Team context", "Minutes distribution"],
    isAltAvailable: true
  },
  {
    id: "steals_blocks",
    name: "Steals + Blocks",
    shortName: "S+B",
    description: "Combined steals and blocks total",
    formula: "Steals Proj + Blocks Proj ± Defensive Role Factor",
    scriptsUsed: ["Script52_PropSpecific", "Script31_DefensiveMatchup"],
    dataRequired: ["Season SPG", "Season BPG", "Defensive role"],
    isAltAvailable: true
  },
  {
    id: "two_pointers",
    name: "Two Pointers Made",
    shortName: "2PM",
    description: "Total two-point field goals made",
    formula: "(FGM - 3PM) × Minutes Factor × Shot Distribution",
    scriptsUsed: ["Script35_ShotDifficulty", "Script26_PickAndRoll", "Script8_MinutesDistribution"],
    dataRequired: ["FGM", "3PM", "Shot chart data"],
    isAltAvailable: true
  },
  {
    id: "three_pointers",
    name: "Three Pointers Made",
    shortName: "3PM",
    description: "Total three-point field goals made",
    formula: "3PA × 3P% × Game Context × Defensive Matchup",
    scriptsUsed: ["Script17_ThreePointRate", "Script36_ThreePAByPosition", "Script31_DefensiveMatchup"],
    dataRequired: ["3PA", "3P%", "Opponent 3P% Allowed"],
    isAltAvailable: true
  }
];

// Game Line Categories
export const GAME_LINE_CATEGORIES: BetSubcategory[] = [
  {
    id: "moneyline",
    name: "Moneyline",
    shortName: "ML",
    description: "Pick the winner of the game",
    formula: "Win Probability = f(Team Rating, Home Advantage, Recent Form, Injuries)",
    scriptsUsed: ["Script22_TeamOrtg", "Script19_HomeAwaySplits", "Script21_RecentForm", "Script15_InjurySeverity"],
    dataRequired: ["Team ratings", "Home/Away", "Injury report"],
    isAltAvailable: false
  },
  {
    id: "spread",
    name: "Point Spread",
    shortName: "SPR",
    description: "Win/lose by a certain margin",
    formula: "Projected Margin = Team Rating Diff + Home Advantage ± Adjustments",
    scriptsUsed: ["Script22_TeamOrtg", "Script19_HomeAwaySplits", "Script37_OpponentPace", "Script14_BlowoutGameScript"],
    dataRequired: ["Team ratings", "Pace", "Recent margins"],
    isAltAvailable: true
  },
  {
    id: "total",
    name: "Over/Under Total",
    shortName: "O/U",
    description: "Combined score over or under a line",
    formula: "Projected Total = (Team1 ORTG + Team2 ORTG) × Pace Factor × Context",
    scriptsUsed: ["Script22_TeamOrtg", "Script37_OpponentPace", "Script40_PossessionVariance"],
    dataRequired: ["Team ORTG/DRTG", "Pace", "Recent totals"],
    isAltAvailable: true
  },
  {
    id: "q1_ml",
    name: "1st Quarter ML",
    shortName: "Q1 ML",
    description: "First quarter winner",
    formula: "Q1 Win% = Full Game Win% × Starting Lineup Factor × Q1 Historical",
    scriptsUsed: ["Script22_TeamOrtg", "Script20_DepthChart", "Script21_RecentForm"],
    dataRequired: ["Q1 scoring data", "Starting lineup"],
    isAltAvailable: false
  },
  {
    id: "q1_spread",
    name: "1st Quarter Spread",
    shortName: "Q1 SPR",
    description: "First quarter point spread",
    formula: "Q1 Spread ≈ Full Game Spread / 4 × Q1 Adjustment Factor",
    scriptsUsed: ["Script22_TeamOrtg", "Script20_DepthChart"],
    dataRequired: ["Q1 margins", "Starting lineup strength"],
    isAltAvailable: true
  },
  {
    id: "q1_total",
    name: "1st Quarter Total",
    shortName: "Q1 O/U",
    description: "First quarter combined score",
    formula: "Q1 Total ≈ Full Game Total / 4 × Q1 Pace Factor",
    scriptsUsed: ["Script37_OpponentPace", "Script40_PossessionVariance"],
    dataRequired: ["Q1 scoring averages", "Pace data"],
    isAltAvailable: true
  },
  {
    id: "h1_ml",
    name: "1st Half ML",
    shortName: "H1 ML",
    description: "First half winner",
    formula: "H1 Win% = Full Game Win% × H1 Historical Performance",
    scriptsUsed: ["Script22_TeamOrtg", "Script21_RecentForm"],
    dataRequired: ["H1 win rates", "Team ratings"],
    isAltAvailable: false
  },
  {
    id: "h1_spread",
    name: "1st Half Spread",
    shortName: "H1 SPR",
    description: "First half point spread",
    formula: "H1 Spread ≈ Full Game Spread / 2 × H1 Adjustment",
    scriptsUsed: ["Script22_TeamOrtg", "Script14_BlowoutGameScript"],
    dataRequired: ["H1 margins", "Team ratings"],
    isAltAvailable: true
  },
  {
    id: "h1_total",
    name: "1st Half Total",
    shortName: "H1 O/U",
    description: "First half combined score",
    formula: "H1 Total ≈ Full Game Total / 2 × H1 Pace Factor",
    scriptsUsed: ["Script37_OpponentPace", "Script40_PossessionVariance"],
    dataRequired: ["H1 scoring averages"],
    isAltAvailable: true
  },
  {
    id: "h2_ml",
    name: "2nd Half ML",
    shortName: "H2 ML",
    description: "Second half winner",
    formula: "H2 Win% = f(H1 Result, Bench Depth, Fatigue, Adjustments)",
    scriptsUsed: ["Script25_BenchDepth", "Script43_FatigueEffect", "Script56_LiveAdjustment"],
    dataRequired: ["H2 performance data", "Bench ratings"],
    isAltAvailable: false
  },
  {
    id: "h2_spread",
    name: "2nd Half Spread",
    shortName: "H2 SPR",
    description: "Second half point spread",
    formula: "H2 Spread = Projected based on H1 result and team tendencies",
    scriptsUsed: ["Script25_BenchDepth", "Script43_FatigueEffect"],
    dataRequired: ["H2 margins", "Bench depth"],
    isAltAvailable: true
  },
  {
    id: "h2_total",
    name: "2nd Half Total",
    shortName: "H2 O/U",
    description: "Second half combined score",
    formula: "H2 Total = Full Total - H1 Actual ± Pace Adjustment",
    scriptsUsed: ["Script37_OpponentPace", "Script43_FatigueEffect"],
    dataRequired: ["H2 scoring data"],
    isAltAvailable: true
  },
  {
    id: "alt_spread",
    name: "Alternate Spread",
    shortName: "ALT SPR",
    description: "Non-standard point spreads",
    formula: "Alt Spread Value = Base Spread ± Adjustment × Probability Shift",
    scriptsUsed: ["Script51_OddsSimulator", "Script53_MonteCarloRanges"],
    dataRequired: ["Base spread", "Win probability distribution"],
    isAltAvailable: false
  },
  {
    id: "alt_total",
    name: "Alternate Total",
    shortName: "ALT O/U",
    description: "Non-standard over/under lines",
    formula: "Alt Total Value = Base Total ± Adjustment × Probability Shift",
    scriptsUsed: ["Script51_OddsSimulator", "Script53_MonteCarloRanges"],
    dataRequired: ["Base total", "Scoring distribution"],
    isAltAvailable: false
  }
];

// Main category groups
export const BET_CATEGORIES: BetCategory[] = [
  {
    id: "player_props",
    name: "Player Props",
    description: "Individual player performance bets",
    icon: <User className="w-5 h-5" />,
    color: "bg-primary",
    subcategories: PLAYER_PROP_CATEGORIES
  },
  {
    id: "game_lines",
    name: "Game Lines",
    description: "Team and game outcome bets",
    icon: <Trophy className="w-5 h-5" />,
    color: "bg-secondary",
    subcategories: GAME_LINE_CATEGORIES
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

interface BetCategorySelectorProps {
  onCategorySelect: (category: BetCategory) => void;
  onSubcategorySelect: (subcategory: BetSubcategory) => void;
  selectedCategory: BetCategory | null;
  selectedSubcategory: BetSubcategory | null;
}

export function BetCategorySelector({
  onCategorySelect,
  onSubcategorySelect,
  selectedCategory,
  selectedSubcategory
}: BetCategorySelectorProps) {
  const [showFormula, setShowFormula] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleBadgeClick = (e: React.MouseEvent, category: BetCategory, sub: BetSubcategory) => {
    e.stopPropagation();
    // For player props, navigate to game props page
    if (category.id === "player_props") {
      setLocation(`/game-props?prop=${sub.id}`);
    } else {
      // For game lines, select the category and subcategory
      onCategorySelect(category);
      onSubcategorySelect(sub);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BET_CATEGORIES.map((category) => {
          const isPlayerProps = category.id === "player_props";
          const borderColor = isPlayerProps ? "border-primary/20" : "border-secondary/20";
          const selectedBorderColor = isPlayerProps ? "ring-primary border-primary" : "ring-secondary border-secondary";
          const badgeBorderColor = isPlayerProps ? "border-primary/30 text-primary" : "border-secondary/30 text-secondary";
          const badgeHoverBg = isPlayerProps ? "hover:bg-primary/20" : "hover:bg-secondary/20";
          
          return (
            <Card
              key={category.id}
              className={`transition-all duration-200 ${borderColor} ${
                selectedCategory?.id === category.id
                  ? `ring-2 ${selectedBorderColor}`
                  : "hover:border-primary/50"
              }`}
            >
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => onCategorySelect(category)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="text-xs">{category.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {category.subcategories.map((sub) => (
                    <Badge 
                      key={sub.id} 
                      variant="outline" 
                      className={`justify-center cursor-pointer ${badgeBorderColor} ${badgeHoverBg} transition-colors`}
                      onClick={(e) => handleBadgeClick(e, category, sub)}
                    >
                      {sub.shortName}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subcategory Selection */}
      {selectedCategory && (
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Select Bet Type
            </CardTitle>
            <CardDescription>
              Choose a specific {selectedCategory.name.toLowerCase()} bet to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {selectedCategory.subcategories.map((sub) => (
                <TooltipProvider key={sub.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selectedSubcategory?.id === sub.id ? "default" : "outline"}
                        className={`h-auto py-3 px-3 flex flex-col items-center gap-1 ${
                          selectedSubcategory?.id === sub.id
                            ? selectedCategory.color + " text-white"
                            : ""
                        }`}
                        onClick={() => onSubcategorySelect(sub)}
                      >
                        <span className="font-bold text-sm">{sub.shortName}</span>
                        <span className="text-xs opacity-80 text-center leading-tight">
                          {sub.name.length > 15 ? sub.name.substring(0, 15) + "..." : sub.name}
                        </span>
                        {sub.isAltAvailable && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-1">
                            ALT
                          </Badge>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{sub.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formula Explanation */}
      {selectedSubcategory && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Info className="w-5 h-5" />
              How This Analysis Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formula */}
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Formula</h4>
              <div className="p-3 bg-muted rounded-lg font-mono text-sm text-foreground">
                {selectedSubcategory.formula}
              </div>
            </div>

            {/* Scripts Used */}
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">
                Analytics Scripts Used ({selectedSubcategory.scriptsUsed.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedSubcategory.scriptsUsed.map((script) => (
                  <Badge 
                    key={script} 
                    variant="outline" 
                    className="text-xs border-secondary/50 text-secondary"
                  >
                    {script}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Data Required */}
            <div>
              <h4 className="text-sm font-medium text-primary mb-2">Data Required</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSubcategory.dataRequired.map((data) => (
                  <Badge 
                    key={data} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {data}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedSubcategory.isAltAvailable && (
              <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-secondary text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Alternate lines available for this bet type</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BetCategorySelector;
