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

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary neon-glow-pink">
              PLAYER STATS ANALYSIS
            </h1>
            <p className="text-lg text-muted-foreground">
              Live 2025-26 NBA player statistics from balldontlie API
            </p>
          </div>

          {/* Search Section */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Search Player</CardTitle>
              <CardDescription>Enter player's full name (e.g., "LeBron James")</CardDescription>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-primary neon-glow-pink">
                        {player.ppg || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground tracking-wide">PPG</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-secondary neon-glow-blue">
                        {player.rpg || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground tracking-wide">RPG</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-accent">
                        {player.apg || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground tracking-wide">APG</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-primary">
                        {player.fgPct || "N/A"}%
                      </div>
                      <div className="text-sm text-muted-foreground tracking-wide">FG%</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Player not found. Please check the spelling and try again.
                  </div>
                )}

                {player && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Position:</span>{" "}
                        <span className="font-semibold">{player.position || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Games Played:</span>{" "}
                        <span className="font-semibold">{player.gamesPlayed || "N/A"}</span>
                      </div>
                    </div>
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
