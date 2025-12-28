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
  tpm?: string;
}

interface PlayerSearchDropdownProps {
  onPlayerSelect: (player: Player) => void;
  selectedPlayer?: Player | null;
  placeholder?: string;
  className?: string;
  showPositionFilter?: boolean;
  accentColor?: "primary" | "secondary";
}

const POSITIONS = ["All", "G", "F", "C", "G-F", "F-C", "F-G", "C-F"];

export function PlayerSearchDropdown({
  onPlayerSelect,
  selectedPlayer,
  placeholder = "Search for a player...",
  className = "",
  showPositionFilter = true,
  accentColor = "primary",
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

  // Use theme colors based on accent
  const isPrimary = accentColor === "primary";

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
                  ? isPrimary 
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-secondary/10 text-secondary border-secondary/30"
                  : "bg-muted text-muted-foreground border-border hover:text-foreground"
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
              "w-full justify-between bg-input text-foreground",
              isPrimary ? "border-primary/30 hover:bg-primary/10" : "border-secondary/30 hover:bg-secondary/10"
            )}
          >
            {selectedPlayer ? (
              <div className="flex items-center gap-2">
                <User className={cn("h-4 w-4", isPrimary ? "text-primary" : "text-secondary")} />
                <span>{selectedPlayer.fullName}</span>
                <Badge variant="outline" className={cn(
                  "text-xs",
                  isPrimary 
                    ? "bg-primary/20 text-primary border-primary/50"
                    : "bg-secondary/20 text-secondary border-secondary/50"
                )}>
                  {selectedPlayer.position}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-popover border-border" align="start">
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Type player name..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="bg-transparent text-foreground"
            />
            <CommandList className="max-h-[300px]">
              {isLoading && (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="h-4 w-4 animate-pulse mx-auto mb-2" />
                  Searching...
                </div>
              )}
              {!isLoading && searchResults?.length === 0 && debouncedQuery.length >= 2 && (
                <CommandEmpty className="text-muted-foreground py-6">
                  No players found for "{debouncedQuery}"
                </CommandEmpty>
              )}
              {!isLoading && (!debouncedQuery || debouncedQuery.length < 2) && positionFilter === "All" && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Type at least 2 characters to search
                </div>
              )}
              {searchResults && searchResults.length > 0 && (
                <CommandGroup heading="Players" className="text-muted-foreground">
                  {searchResults.map((player: Player) => (
                    <CommandItem
                      key={player.id}
                      value={player.fullName}
                      onSelect={() => handleSelect(player)}
                      className={cn(
                        "cursor-pointer text-foreground",
                        isPrimary ? "hover:bg-primary/10" : "hover:bg-secondary/10",
                        "data-[selected=true]:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedPlayer?.id === player.id ? "opacity-100" : "opacity-0",
                              isPrimary ? "text-primary" : "text-secondary"
                            )}
                          />
                          <span className="font-medium">{player.fullName}</span>
                          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                            {player.position}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        <div className={cn(
          "p-3 rounded-lg border",
          isPrimary ? "border-primary/30" : "border-secondary/30",
          "bg-card"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn("font-semibold", isPrimary ? "text-primary" : "text-secondary")}>
              {selectedPlayer.fullName}
            </span>
            <Badge variant="outline" className={cn(
              isPrimary 
                ? "bg-primary/20 text-primary border-primary/50"
                : "bg-secondary/20 text-secondary border-secondary/50"
            )}>
              {selectedPlayer.position}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">PPG</div>
              <div className="text-foreground font-bold">{selectedPlayer.ppg}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">RPG</div>
              <div className="text-foreground font-bold">{selectedPlayer.rpg}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">APG</div>
              <div className="text-foreground font-bold">{selectedPlayer.apg}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">MPG</div>
              <div className="text-foreground font-bold">{selectedPlayer.minutesPerGame}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerSearchDropdown;
