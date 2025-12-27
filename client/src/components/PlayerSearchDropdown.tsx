import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Player {
  id: number;
  fullName: string;
  position: string;
  teamId: number;
  ppg: string;
  rpg: string;
  apg: string;
  minutesPerGame: string;
  gamesPlayed: number;
  fgPct: string;
  ftPct: string;
  tpPct: string;
  spg: string;
  bpg: string;
  topg: string;
  ts: string;
  efg: string;
}

interface PlayerSearchDropdownProps {
  onPlayerSelect: (player: Player) => void;
  selectedPlayer?: Player | null;
  placeholder?: string;
  className?: string;
  showPositionFilter?: boolean;
  accentColor?: "pink" | "cyan" | "purple";
}

const POSITIONS = ["All", "G", "F", "C", "G-F", "F-C", "F-G", "C-F"];

export function PlayerSearchDropdown({
  onPlayerSelect,
  selectedPlayer,
  placeholder = "Search for a player...",
  className = "",
  showPositionFilter = true,
  accentColor = "pink",
}: PlayerSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search players query
  const { data: searchResults, isLoading } = trpc.nba.searchPlayers.useQuery(
    { 
      search: debouncedQuery, 
      position: positionFilter === "All" ? undefined : positionFilter,
      limit: 20 
    },
    { enabled: debouncedQuery.length >= 2 || positionFilter !== "All" }
  );

  const handleSelect = useCallback((player: Player) => {
    onPlayerSelect(player);
    setOpen(false);
    setSearchQuery("");
  }, [onPlayerSelect]);

  const accentColors = {
    pink: {
      border: "border-pink-500/30",
      text: "text-pink-400",
      bg: "bg-pink-500/10",
      hover: "hover:bg-pink-500/20",
      badge: "bg-pink-500/20 text-pink-400 border-pink-500/50",
    },
    cyan: {
      border: "border-cyan-500/30",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      hover: "hover:bg-cyan-500/20",
      badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    },
    purple: {
      border: "border-purple-500/30",
      text: "text-purple-400",
      bg: "bg-purple-500/10",
      hover: "hover:bg-purple-500/20",
      badge: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    },
  };

  const colors = accentColors[accentColor];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Position Filter */}
      {showPositionFilter && (
        <div className="flex flex-wrap gap-2 mb-2">
          {POSITIONS.map((pos) => (
            <Button
              key={pos}
              variant="outline"
              size="sm"
              onClick={() => setPositionFilter(pos)}
              className={cn(
                "text-xs transition-all",
                positionFilter === pos
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : "bg-slate-800/50 text-gray-400 border-gray-700 hover:text-white"
              )}
            >
              {pos}
            </Button>
          ))}
        </div>
      )}

      {/* Player Search Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-slate-800/50 text-white",
              colors.border,
              colors.hover
            )}
          >
            {selectedPlayer ? (
              <div className="flex items-center gap-2">
                <User className={cn("h-4 w-4", colors.text)} />
                <span>{selectedPlayer.fullName}</span>
                <Badge variant="outline" className={cn("text-xs", colors.badge)}>
                  {selectedPlayer.position}
                </Badge>
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-slate-900 border-slate-700" align="start">
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Type player name..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="bg-transparent text-white"
            />
            <CommandList className="max-h-[300px]">
              {isLoading && (
                <div className="p-4 text-center text-gray-400">
                  <Search className="h-4 w-4 animate-pulse mx-auto mb-2" />
                  Searching...
                </div>
              )}
              {!isLoading && searchResults?.length === 0 && debouncedQuery.length >= 2 && (
                <CommandEmpty className="text-gray-400 py-6">
                  No players found for "{debouncedQuery}"
                </CommandEmpty>
              )}
              {!isLoading && (!debouncedQuery || debouncedQuery.length < 2) && positionFilter === "All" && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  Type at least 2 characters to search
                </div>
              )}
              {searchResults && searchResults.length > 0 && (
                <CommandGroup heading="Players" className="text-gray-400">
                  {searchResults.map((player: Player) => (
                    <CommandItem
                      key={player.id}
                      value={player.fullName}
                      onSelect={() => handleSelect(player)}
                      className={cn(
                        "cursor-pointer text-white",
                        colors.hover,
                        "data-[selected=true]:bg-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedPlayer?.id === player.id ? "opacity-100" : "opacity-0",
                              colors.text
                            )}
                          />
                          <span className="font-medium">{player.fullName}</span>
                          <Badge variant="outline" className="text-xs bg-slate-800 text-gray-300 border-gray-600">
                            {player.position}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{player.ppg} PPG</span>
                          <span>{player.minutesPerGame} MPG</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Player Stats Preview */}
      {selectedPlayer && (
        <div className={cn("p-3 rounded-lg border", colors.border, "bg-slate-800/30")}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn("font-semibold", colors.text)}>{selectedPlayer.fullName}</span>
            <Badge variant="outline" className={colors.badge}>{selectedPlayer.position}</Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-400">PPG</div>
              <div className="text-white font-bold">{selectedPlayer.ppg}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">RPG</div>
              <div className="text-white font-bold">{selectedPlayer.rpg}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">APG</div>
              <div className="text-white font-bold">{selectedPlayer.apg}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">MPG</div>
              <div className="text-white font-bold">{selectedPlayer.minutesPerGame}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerSearchDropdown;
