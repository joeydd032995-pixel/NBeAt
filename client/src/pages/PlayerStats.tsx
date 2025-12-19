import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PlayerStats() {
  const [playerName, setPlayerName] = useState("");
  const [searchedPlayer, setSearchedPlayer] = useState<string | null>(null);

  const { data: player, isLoading, refetch } = trpc.nba.getPlayerByName.useQuery(
    { name: searchedPlayer || "" },
    { enabled: !!searchedPlayer }
  );

  const handleSearch = () => {
    if (!playerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }
    setSearchedPlayer(playerName);
    refetch();
  };

  const statCategories = [
    { key: "ppg", label: "PPG", color: "text-primary neon-glow-pink" },
    { key: "rpg", label: "RPG", color: "text-secondary neon-glow-blue" },
    { key: "apg", label: "APG", color: "text-accent" },
    { key: "fgPct", label: "FG%", color: "text-primary" },
    { key: "fgm", label: "FGM", color: "text-secondary" },
    { key: "fga", label: "FGA", color: "text-accent" },
    { key: "ftPct", label: "FT%", color: "text-primary" },
    { key: "ftm", label: "FTM", color: "text-secondary" },
    { key: "fta", label: "FTA", color: "text-accent" },
    { key: "threePct", label: "3P%", color: "text-primary" },
    { key: "threepm", label: "3PM", color: "text-secondary" },
    { key: "threepa", label: "3PA", color: "text-accent" },
    { key: "orpg", label: "ORPG", color: "text-primary" },
    { key: "drpg", label: "DRPG", color: "text-secondary" },
    { key: "spg", label: "SPG", color: "text-accent" },
    { key: "bpg", label: "BPG", color: "text-primary" },
    { key: "topg", label: "TOPG", color: "text-secondary" },
    { key: "tsPct", label: "TS%", color: "text-accent" },
    { key: "efgPct", label: "EFG%", color: "text-primary" },
    { key: "gamesPlayed", label: "GP", color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary neon-glow-pink">
              PLAYER STATS ANALYSIS
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive 2025-26 NBA player statistics with 31 stat categories
            </p>
          </div>

          {/* Search Section */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Search Player</CardTitle>
              <CardDescription>Enter player's full name or partial name (e.g., "LeBron" or "LeBron James")</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Player name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {searchedPlayer && (
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">{searchedPlayer}</CardTitle>
                <CardDescription>2025-26 Season Statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : player ? (
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-border">
                      <div>
                        <span className="text-muted-foreground text-sm">Position</span>
                        <div className="text-xl font-bold text-primary">{player.position || "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Games Played</span>
                        <div className="text-xl font-bold text-secondary">{player.gamesPlayed || "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Last Updated</span>
                        <div className="text-xl font-bold text-accent">{new Date(player.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {statCategories.map((stat) => {
                        const value = (player as Record<string, any>)[stat.key];
                        const displayValue = value !== null && value !== undefined ? 
                          (typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value) 
                          : "N/A";
                        
                        return (
                          <div key={stat.key} className="text-center space-y-2 p-3 rounded-lg bg-background/50 border border-border">
                            <div className={`text-2xl font-bold ${stat.color}`}>
                              {displayValue}
                            </div>
                            <div className="text-xs text-muted-foreground tracking-wide uppercase">
                              {stat.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Player not found. Please check the spelling and try again.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
