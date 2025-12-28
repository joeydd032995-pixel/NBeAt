import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Home,
  Trophy,
  Clock,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface FormulaVariables {
  // Game Context
  isHome: boolean;
  isFavorite: boolean;
  spread: number;
  gameTotal: number;
  
  // Rest & Fatigue
  daysRest: number;
  isBackToBack: boolean;
  
  // Opponent Factors
  opponentDrtg: number;  // Defensive rating (lower = better defense)
  opponentPace: number;  // Pace factor
  
  // Player Adjustments
  minutesAdjustment: number;  // % adjustment to expected minutes
  usageBoost: number;  // % boost for increased usage
  
  // Advanced Factors
  homeCourtBoost: number;  // % boost for home games (default 2%)
  favoriteBoost: number;  // % boost for favorites (default 1.5%)
  underdogBoost: number;  // % boost for underdogs (default -1%)
  b2bPenalty: number;  // % penalty for back-to-back (default -8%)
  restBonus: number;  // % bonus for 3+ days rest (default 2%)
}

export const DEFAULT_VARIABLES: FormulaVariables = {
  isHome: true,
  isFavorite: true,
  spread: -3,
  gameTotal: 220,
  daysRest: 2,
  isBackToBack: false,
  opponentDrtg: 110,
  opponentPace: 100,
  minutesAdjustment: 0,
  usageBoost: 0,
  homeCourtBoost: 2,
  favoriteBoost: 1.5,
  underdogBoost: -1,
  b2bPenalty: -8,
  restBonus: 2
};

interface FormulaVariablesPanelProps {
  variables: FormulaVariables;
  onChange: (variables: FormulaVariables) => void;
  showAdvanced?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// SLIDER ROW COMPONENT
// ============================================================================

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon?: React.ReactNode;
  description?: string;
  showValue?: boolean;
}

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  icon,
  description,
  showValue = true
}: SliderRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="text-sm text-gray-300">{label}</Label>
        </div>
        {showValue && (
          <span className="text-sm font-medium text-primary">
            {value > 0 && unit !== "%" ? "+" : ""}{value}{unit}
          </span>
        )}
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FormulaVariablesPanel({
  variables,
  onChange,
  showAdvanced = false,
  compact = false,
  className
}: FormulaVariablesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showAdvancedSection, setShowAdvancedSection] = useState(showAdvanced);

  const updateVariable = <K extends keyof FormulaVariables>(
    key: K,
    value: FormulaVariables[K]
  ) => {
    onChange({ ...variables, [key]: value });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_VARIABLES);
  };

  // Calculate total adjustment preview
  const calculateTotalAdjustment = () => {
    let adjustment = 100;
    
    // Home/Away
    adjustment += variables.isHome ? variables.homeCourtBoost : -variables.homeCourtBoost;
    
    // Favorite/Underdog
    if (variables.isFavorite) {
      if (Math.abs(variables.spread) > 10) {
        adjustment -= 5; // Heavy favorites rest
      } else {
        adjustment += variables.favoriteBoost;
      }
    } else {
      if (Math.abs(variables.spread) > 10) {
        adjustment += 3; // Heavy underdogs play harder
      } else {
        adjustment += variables.underdogBoost;
      }
    }
    
    // Pace
    adjustment += ((variables.gameTotal / 220) - 1) * 100;
    
    // Rest
    if (variables.isBackToBack) {
      adjustment += variables.b2bPenalty;
    } else if (variables.daysRest >= 3) {
      adjustment += variables.restBonus;
    } else if (variables.daysRest === 0) {
      adjustment -= 5;
    } else if (variables.daysRest === 1) {
      adjustment -= 2;
    }
    
    // Opponent DRTG
    adjustment += ((variables.opponentDrtg / 110) - 1) * 100;
    
    // Minutes & Usage
    adjustment += variables.minutesAdjustment;
    adjustment += variables.usageBoost;
    
    return adjustment;
  };

  const totalAdjustment = calculateTotalAdjustment();

  if (compact && !isExpanded) {
    return (
      <Card className={cn("bg-slate-800/50 border-slate-700", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn(
                "text-xs",
                totalAdjustment > 100 ? "border-green-500 text-green-400" :
                totalAdjustment < 100 ? "border-red-500 text-red-400" :
                "border-yellow-500 text-yellow-400"
              )}>
                {totalAdjustment.toFixed(1)}% Projection
              </Badge>
              <span className="text-xs text-gray-400">
                {variables.isHome ? "Home" : "Away"} • 
                {variables.isFavorite ? " Fav" : " Dog"} • 
                {variables.daysRest}d rest
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-primary"
            >
              Adjust <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-slate-800/50 border-slate-700", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-secondary" />
            Formula Variables
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              "text-xs",
              totalAdjustment > 100 ? "border-green-500 text-green-400" :
              totalAdjustment < 100 ? "border-red-500 text-red-400" :
              "border-yellow-500 text-yellow-400"
            )}>
              {totalAdjustment > 100 ? "+" : ""}{(totalAdjustment - 100).toFixed(1)}% Total
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="text-gray-400 hover:text-white h-7 px-2"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white h-7 px-2"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Context Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
            <Trophy className="w-3 h-3" />
            Game Context
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
              <Switch
                checked={variables.isHome}
                onCheckedChange={(v) => updateVariable("isHome", v)}
              />
              <Label className="text-sm text-gray-300">
                {variables.isHome ? "Home" : "Away"}
              </Label>
              <Home className={cn("w-4 h-4 ml-auto", variables.isHome ? "text-primary" : "text-gray-500")} />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
              <Switch
                checked={variables.isFavorite}
                onCheckedChange={(v) => updateVariable("isFavorite", v)}
              />
              <Label className="text-sm text-gray-300">
                {variables.isFavorite ? "Favorite" : "Underdog"}
              </Label>
              <TrendingUp className={cn("w-4 h-4 ml-auto", variables.isFavorite ? "text-green-400" : "text-red-400")} />
            </div>
          </div>

          <SliderRow
            label="Spread"
            value={variables.spread}
            onChange={(v) => updateVariable("spread", v)}
            min={-20}
            max={20}
            step={0.5}
            unit=""
            description="Negative = favorite, Positive = underdog"
          />

          <SliderRow
            label="Game Total"
            value={variables.gameTotal}
            onChange={(v) => updateVariable("gameTotal", v)}
            min={190}
            max={250}
            step={0.5}
            description="Higher total = faster pace = more stats"
          />
        </div>

        <Separator className="bg-slate-700" />

        {/* Rest & Fatigue Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            Rest & Fatigue
          </div>

          <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-3">
            <Switch
              checked={variables.isBackToBack}
              onCheckedChange={(v) => updateVariable("isBackToBack", v)}
            />
            <Label className="text-sm text-gray-300">Back-to-Back</Label>
            <Badge variant="outline" className={cn(
              "ml-auto text-xs",
              variables.isBackToBack ? "border-red-500 text-red-400" : "border-gray-600 text-gray-400"
            )}>
              {variables.isBackToBack ? `${variables.b2bPenalty}%` : "No"}
            </Badge>
          </div>

          <SliderRow
            label="Days Rest"
            value={variables.daysRest}
            onChange={(v) => updateVariable("daysRest", v)}
            min={0}
            max={7}
            step={1}
            unit=" days"
            description="0-1 = tired, 2 = normal, 3+ = rested"
          />
        </div>

        <Separator className="bg-slate-700" />

        {/* Opponent Factors Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
            <Shield className="w-3 h-3" />
            Opponent Factors
          </div>

          <SliderRow
            label="Opponent DRTG"
            value={variables.opponentDrtg}
            onChange={(v) => updateVariable("opponentDrtg", v)}
            min={100}
            max={120}
            step={0.5}
            description="Lower = better defense (harder matchup)"
          />

          <SliderRow
            label="Opponent Pace"
            value={variables.opponentPace}
            onChange={(v) => updateVariable("opponentPace", v)}
            min={95}
            max={105}
            step={0.5}
            description="Higher pace = more possessions"
          />
        </div>

        <Separator className="bg-slate-700" />

        {/* Player Adjustments Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
            <TrendingUp className="w-3 h-3" />
            Player Adjustments
          </div>

          <SliderRow
            label="Minutes Adjustment"
            value={variables.minutesAdjustment}
            onChange={(v) => updateVariable("minutesAdjustment", v)}
            min={-20}
            max={20}
            step={1}
            unit="%"
            description="Adjust for expected minutes change"
          />

          <SliderRow
            label="Usage Boost"
            value={variables.usageBoost}
            onChange={(v) => updateVariable("usageBoost", v)}
            min={-10}
            max={15}
            step={1}
            unit="%"
            description="Boost for injuries/absences on team"
          />
        </div>

        {/* Advanced Section (Collapsible) */}
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSection(!showAdvancedSection)}
            className="w-full text-gray-400 hover:text-white"
          >
            {showAdvancedSection ? "Hide" : "Show"} Advanced Factors
            {showAdvancedSection ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>

          {showAdvancedSection && (
            <div className="space-y-3 mt-3 pt-3 border-t border-slate-700">
              <SliderRow
                label="Home Court Boost"
                value={variables.homeCourtBoost}
                onChange={(v) => updateVariable("homeCourtBoost", v)}
                min={0}
                max={5}
                step={0.5}
                unit="%"
                description="Default: 2%"
              />

              <SliderRow
                label="Favorite Boost"
                value={variables.favoriteBoost}
                onChange={(v) => updateVariable("favoriteBoost", v)}
                min={0}
                max={5}
                step={0.5}
                unit="%"
                description="Default: 1.5%"
              />

              <SliderRow
                label="Underdog Penalty"
                value={variables.underdogBoost}
                onChange={(v) => updateVariable("underdogBoost", v)}
                min={-5}
                max={0}
                step={0.5}
                unit="%"
                description="Default: -1%"
              />

              <SliderRow
                label="B2B Penalty"
                value={variables.b2bPenalty}
                onChange={(v) => updateVariable("b2bPenalty", v)}
                min={-15}
                max={0}
                step={1}
                unit="%"
                description="Default: -8%"
              />

              <SliderRow
                label="Rest Bonus (3+ days)"
                value={variables.restBonus}
                onChange={(v) => updateVariable("restBonus", v)}
                min={0}
                max={5}
                step={0.5}
                unit="%"
                description="Default: 2%"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT INLINE VERSION
// ============================================================================

interface InlineVariablesProps {
  variables: FormulaVariables;
  onChange: (variables: FormulaVariables) => void;
}

export function InlineFormulaVariables({ variables, onChange }: InlineVariablesProps) {
  const updateVariable = <K extends keyof FormulaVariables>(
    key: K,
    value: FormulaVariables[K]
  ) => {
    onChange({ ...variables, [key]: value });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-slate-800/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-gray-400">Location</Label>
          <Switch
            checked={variables.isHome}
            onCheckedChange={(v) => updateVariable("isHome", v)}
          />
        </div>
        <div className="text-sm font-medium text-white">
          {variables.isHome ? "Home" : "Away"}
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-gray-400">Status</Label>
          <Switch
            checked={variables.isFavorite}
            onCheckedChange={(v) => updateVariable("isFavorite", v)}
          />
        </div>
        <div className="text-sm font-medium text-white">
          {variables.isFavorite ? "Favorite" : "Underdog"}
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-gray-400">B2B</Label>
          <Switch
            checked={variables.isBackToBack}
            onCheckedChange={(v) => updateVariable("isBackToBack", v)}
          />
        </div>
        <div className="text-sm font-medium text-white">
          {variables.isBackToBack ? "Yes (-8%)" : "No"}
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-lg p-3">
        <Label className="text-xs text-gray-400 mb-2 block">Rest Days</Label>
        <Slider
          value={[variables.daysRest]}
          onValueChange={(v) => updateVariable("daysRest", v[0])}
          min={0}
          max={7}
          step={1}
          className="w-full"
        />
        <div className="text-center text-sm font-medium text-white mt-1">
          {variables.daysRest} days
        </div>
      </div>
    </div>
  );
}
