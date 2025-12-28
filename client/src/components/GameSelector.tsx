import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface Game {
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

interface GameSelectorProps {
  onGameSelect?: (game: Game) => void;
  selectedGameId?: string;
  showOdds?: boolean;
  compact?: boolean;
}

// Team abbreviation mapping
const teamAbbreviations: Record<string, string> = {
  "Atlanta Hawks": "ATL",
  "Boston Celtics": "BOS",
  "Brooklyn Nets": "BKN",
  "Charlotte Hornets": "CHA",
  "Chicago Bulls": "CHI",
  "Cleveland Cavaliers": "CLE",
  "Dallas Mavericks": "DAL",
  "Denver Nuggets": "DEN",
  "Detroit Pistons": "DET",
  "Golden State Warriors": "GSW",
  "Houston Rockets": "HOU",
  "Indiana Pacers": "IND",
  "Los Angeles Clippers": "LAC",
  "Los Angeles Lakers": "LAL",
  "Memphis Grizzlies": "MEM",
  "Miami Heat": "MIA",
  "Milwaukee Bucks": "MIL",
  "Minnesota Timberwolves": "MIN",
  "New Orleans Pelicans": "NOP",
  "New York Knicks": "NYK",
  "Oklahoma City Thunder": "OKC",
  "Orlando Magic": "ORL",
  "Philadelphia 76ers": "PHI",
  "Phoenix Suns": "PHX",
  "Portland Trail Blazers": "POR",
  "Sacramento Kings": "SAC",
  "San Antonio Spurs": "SAS",
  "Toronto Raptors": "TOR",
  "Utah Jazz": "UTA",
  "Washington Wizards": "WAS",
};

function getTeamAbbr(teamName: string): string {
  return teamAbbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
}

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatSpread(spread: number | null): string {
  if (spread === null) return "N/A";
  return spread > 0 ? `+${spread}` : `${spread}`;
}

export function GameSelector({ 
  onGameSelect, 
  selectedGameId, 
  showOdds = true,
  compact = false 
}: GameSelectorProps) {
  const [viewMode, setViewMode] = useState<"today" | "upcoming">("today");
  
  const { data: todaysGames, isLoading: loadingToday, refetch: refetchToday } = 
    trpc.odds.getTodaysGames.useQuery(undefined, {
      enabled: viewMode === "today",
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  const { data: upcomingGames, isLoading: loadingUpcoming, refetch: refetchUpcoming } = 
    trpc.odds.getUpcomingGames.useQuery(undefined, {
      enabled: viewMode === "upcoming",
      staleTime: 5 * 60 * 1000,
    });

  const games = viewMode === "today" ? todaysGames : upcomingGames;
  const isLoading = viewMode === "today" ? loadingToday : loadingUpcoming;
  const refetch = viewMode === "today" ? refetchToday : refetchUpcoming;

  const handleRefresh = () => {
    refetch();
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Select Game</span>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => onGameSelect?.(game)}
                className={`w-full p-2 rounded-lg text-left transition-all ${
                  selectedGameId === game.id
                    ? "bg-secondary/10 border-2 border-secondary"
                    : "bg-muted hover:bg-muted/80 border border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{getTeamAbbr(game.awayTeam)}</span>
                    <span className="text-muted-foreground text-xs">@</span>
                    <span className="font-semibold text-sm text-foreground">{getTeamAbbr(game.homeTeam)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{game.displayTime}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No games scheduled</p>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-secondary" />
            NBA Games
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("today")}
                className={`px-3 py-1 text-sm ${
                  viewMode === "today"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode("upcoming")}
                className={`px-3 py-1 text-sm ${
                  viewMode === "upcoming"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Upcoming
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="space-y-3">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => onGameSelect?.(game)}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedGameId === game.id
                    ? "bg-secondary/10 border-2 border-secondary shadow-md"
                    : "bg-muted hover:bg-muted/80 border border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{game.displayDate} • {game.displayTime}</span>
                  </div>
                  {selectedGameId === game.id && (
                    <Badge className="bg-secondary text-secondary-foreground">Selected</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  {/* Away Team */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-foreground">{getTeamAbbr(game.awayTeam)}</span>
                      <span className="text-sm text-muted-foreground hidden sm:inline">{game.awayTeam}</span>
                    </div>
                    {showOdds && game.moneyline && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-medium ${game.moneyline.away < 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          {formatOdds(game.moneyline.away)}
                        </span>
                        {game.spread && (
                          <span className="text-xs text-muted-foreground">
                            ({formatSpread(game.spread.away)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* VS / Total */}
                  <div className="px-4 text-center">
                    <span className="text-muted-foreground font-medium">@</span>
                    {showOdds && game.total && (
                      <div className="text-xs text-muted-foreground mt-1">
                        O/U {game.total}
                      </div>
                    )}
                  </div>

                  {/* Home Team */}
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground hidden sm:inline">{game.homeTeam}</span>
                      <span className="font-bold text-lg text-foreground">{getTeamAbbr(game.homeTeam)}</span>
                    </div>
                    {showOdds && game.moneyline && (
                      <div className="flex items-center justify-end gap-2 mt-1">
                        {game.spread && (
                          <span className="text-xs text-muted-foreground">
                            ({formatSpread(game.spread.home)})
                          </span>
                        )}
                        <span className={`text-sm font-medium ${game.moneyline.home < 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          {formatOdds(game.moneyline.home)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {viewMode === "today" 
                ? "No games scheduled for today" 
                : "No upcoming games found"}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Check back later for updated schedules
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GameSelector;
