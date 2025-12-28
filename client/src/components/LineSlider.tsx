import { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LineSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  playerAverage?: number;
  showEdge?: boolean;
  className?: string;
  disabled?: boolean;
}

export function LineSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.5,
  playerAverage,
  showEdge = true,
  className,
  disabled = false
}: LineSliderProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleSliderChange = useCallback((values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
    setInputValue(newValue.toString());
  }, [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleInputBlur = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num < min) {
      onChange(min);
      setInputValue(min.toString());
    } else if (num > max) {
      onChange(max);
      setInputValue(max.toString());
    }
  };

  // Calculate edge if player average is provided
  const edge = playerAverage ? playerAverage - value : null;
  const edgePercent = playerAverage && value > 0 ? ((playerAverage - value) / value) * 100 : null;

  const getEdgeColor = () => {
    if (!edge) return "";
    if (edge > 2) return "text-green-400";
    if (edge > 0.5) return "text-green-300";
    if (edge < -2) return "text-red-400";
    if (edge < -0.5) return "text-red-300";
    return "text-yellow-400";
  };

  const getEdgeBadge = () => {
    if (!edge) return null;
    if (edge > 2) return { text: "STRONG OVER", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    if (edge > 0.5) return { text: "LEAN OVER", color: "bg-green-500/10 text-green-300 border-green-500/20" };
    if (edge < -2) return { text: "STRONG UNDER", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (edge < -0.5) return { text: "LEAN UNDER", color: "bg-red-500/10 text-red-300 border-red-500/20" };
    return { text: "NEUTRAL", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" };
  };

  const edgeBadge = getEdgeBadge();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-300">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            step={step}
            min={min}
            max={max}
            disabled={disabled}
            className="w-20 h-8 text-center bg-slate-800/50 border-slate-600 text-white"
          />
          {showEdge && edgeBadge && (
            <Badge variant="outline" className={cn("text-xs", edgeBadge.color)}>
              {edgeBadge.text}
            </Badge>
          )}
        </div>
      </div>

      <div className="relative pt-1">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />
        
        {/* Markers */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{min}</span>
          {playerAverage && (
            <span className="text-primary font-medium">
              Avg: {playerAverage.toFixed(1)}
            </span>
          )}
          <span>{max}</span>
        </div>
      </div>

      {/* Edge Display */}
      {showEdge && edge !== null && edgePercent !== null && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Edge vs Line:</span>
          <span className={cn("font-medium", getEdgeColor())}>
            {edge > 0 ? "+" : ""}{edge.toFixed(1)} ({edgePercent > 0 ? "+" : ""}{edgePercent.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  );
}

// Preset line slider for common bet types
interface PresetLineSliderProps {
  betType: string;
  playerStats: {
    ppg?: number;
    rpg?: number;
    apg?: number;
    spg?: number;
    bpg?: number;
    tpm?: number;
  };
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PresetLineSlider({
  betType,
  playerStats,
  value,
  onChange,
  disabled = false
}: PresetLineSliderProps) {
  // Get the appropriate stat and range based on bet type
  const getConfig = () => {
    switch (betType.toLowerCase()) {
      case "points":
        return {
          label: "Points Line",
          average: playerStats.ppg || 0,
          min: 0.5,
          max: 60,
          step: 0.5
        };
      case "rebounds":
        return {
          label: "Rebounds Line",
          average: playerStats.rpg || 0,
          min: 0.5,
          max: 20,
          step: 0.5
        };
      case "assists":
        return {
          label: "Assists Line",
          average: playerStats.apg || 0,
          min: 0.5,
          max: 20,
          step: 0.5
        };
      case "steals":
        return {
          label: "Steals Line",
          average: playerStats.spg || 0,
          min: 0.5,
          max: 5,
          step: 0.5
        };
      case "blocks":
        return {
          label: "Blocks Line",
          average: playerStats.bpg || 0,
          min: 0.5,
          max: 5,
          step: 0.5
        };
      case "three_pointers":
      case "3pm":
      case "threes":
        return {
          label: "3-Pointers Made Line",
          average: playerStats.tpm || 0,
          min: 0.5,
          max: 10,
          step: 0.5
        };
      case "pra":
        return {
          label: "PRA Line",
          average: (playerStats.ppg || 0) + (playerStats.rpg || 0) + (playerStats.apg || 0),
          min: 5,
          max: 80,
          step: 0.5
        };
      case "pa":
        return {
          label: "Points + Assists Line",
          average: (playerStats.ppg || 0) + (playerStats.apg || 0),
          min: 5,
          max: 60,
          step: 0.5
        };
      case "pr":
        return {
          label: "Points + Rebounds Line",
          average: (playerStats.ppg || 0) + (playerStats.rpg || 0),
          min: 5,
          max: 60,
          step: 0.5
        };
      case "ra":
        return {
          label: "Rebounds + Assists Line",
          average: (playerStats.rpg || 0) + (playerStats.apg || 0),
          min: 2,
          max: 30,
          step: 0.5
        };
      case "steals_blocks":
      case "s+b":
        return {
          label: "Steals + Blocks Line",
          average: (playerStats.spg || 0) + (playerStats.bpg || 0),
          min: 0.5,
          max: 8,
          step: 0.5
        };
      default:
        return {
          label: "Line",
          average: 0,
          min: 0.5,
          max: 50,
          step: 0.5
        };
    }
  };

  const config = getConfig();

  return (
    <LineSlider
      label={config.label}
      value={value}
      onChange={onChange}
      min={config.min}
      max={config.max}
      step={config.step}
      playerAverage={config.average}
      disabled={disabled}
    />
  );
}

// Game line slider for spreads and totals
interface GameLineSliderProps {
  lineType: "spread" | "total" | "moneyline";
  value: number;
  onChange: (value: number) => void;
  homeTeam?: string;
  awayTeam?: string;
  disabled?: boolean;
}

export function GameLineSlider({
  lineType,
  value,
  onChange,
  homeTeam = "Home",
  awayTeam = "Away",
  disabled = false
}: GameLineSliderProps) {
  const getConfig = () => {
    switch (lineType) {
      case "spread":
        return {
          label: `Spread (${homeTeam})`,
          min: -20,
          max: 20,
          step: 0.5
        };
      case "total":
        return {
          label: "Game Total (O/U)",
          min: 180,
          max: 260,
          step: 0.5
        };
      case "moneyline":
        return {
          label: `Moneyline (${homeTeam})`,
          min: -500,
          max: 500,
          step: 5
        };
      default:
        return {
          label: "Line",
          min: -20,
          max: 20,
          step: 0.5
        };
    }
  };

  const config = getConfig();

  return (
    <LineSlider
      label={config.label}
      value={value}
      onChange={onChange}
      min={config.min}
      max={config.max}
      step={config.step}
      showEdge={false}
      disabled={disabled}
    />
  );
}
