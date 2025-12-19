import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PlayerStats() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Auto-load random player on mount
  const { data: randomPlayer, isLoading: isLoadingRandom } = trpc.nba.getRandomPlayer.useQuery();
  
  // Search player query
  const { data: searchResult, isLoading: isSearching } = trpc.nba.getPlayerByName.useQuery(
    { name: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Set random player on load
  useEffect(() => {
    if (randomPlayer && !selectedPlayer) {
      setSelectedPlayer(randomPlayer);
    }
  }, [randomPlayer, selectedPlayer]);

  // Update selected player when search result changes
  useEffect(() => {
    if (searchResult) {
      setSelectedPlayer(searchResult);
    }
  }, [searchResult]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a player name");
      return;
    }
  };

  const displayPlayer = selectedPlayer;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-pink-400" style={{ textShadow: "0 0 20px rgba(236, 72, 153, 0.8)" }}>
            Player Statistics
          </h1>
          <p className="text-cyan-400">2025-26 Season Statistics</p>
        </div>

        {/* Search Section */}
        <div className="mb-8 p-6 border border-cyan-500/30 rounded-lg bg-slate-900/50">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              type="text"
              placeholder="Enter player's full name (e.g., 'LeBron James')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-800 border-cyan-500/50 text-white placeholder-gray-400"
            />
            <Button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 text-white flex items-center gap-2"
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="animate-spin" /> : <Search size={20} />}
              Search
            </Button>
          </form>
        </div>

        {/* Loading State */}
        {isLoadingRandom && !displayPlayer && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-pink-500" size={40} />
              <p className="text-cyan-400">Loading player statistics...</p>
            </div>
          </div>
        )}

        {/* Player Stats Display */}
        {displayPlayer && (
          <div className="space-y-6">
            {/* Player Header */}
            <div className="p-6 border border-cyan-500/30 rounded-lg bg-slate-900/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-pink-400 mb-2">{displayPlayer.fullName}</h2>
                  <p className="text-cyan-400">Position: {displayPlayer.position || "N/A"}</p>
                </div>
                <div className="text-right">
                  <p className="text-cyan-400">Games Played: {displayPlayer.gamesPlayed || "N/A"}</p>
                  <p className="text-gray-400 text-sm">
                    Last Updated: {new Date(displayPlayer.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Scoring Stats */}
              <StatCard label="PPG" value={displayPlayer.ppg} color="pink" />
              <StatCard label="RPG" value={displayPlayer.rpg} color="cyan" />
              <StatCard label="APG" value={displayPlayer.apg} color="pink" />
              <StatCard label="FG%" value={displayPlayer.fgPct} color="cyan" />

              {/* Shooting Stats */}
              <StatCard label="FGM" value={displayPlayer.fgm} color="pink" />
              <StatCard label="FGA" value={displayPlayer.fga} color="cyan" />
              <StatCard label="FT%" value={displayPlayer.ftPct} color="pink" />
              <StatCard label="FTM" value={displayPlayer.ftm} color="cyan" />

              {/* Three Point Stats */}
              <StatCard label="FTA" value={displayPlayer.fta} color="pink" />
              <StatCard label="3P%" value={displayPlayer.tpPct} color="cyan" />
              <StatCard label="3PM" value={displayPlayer.tpm} color="pink" />
              <StatCard label="3PA" value={displayPlayer.tpa} color="cyan" />

              {/* Rebounding Stats */}
              <StatCard label="ORPG" value={displayPlayer.orpg} color="pink" />
              <StatCard label="DRPG" value={displayPlayer.drpg} color="cyan" />

              {/* Defense Stats */}
              <StatCard label="SPG" value={displayPlayer.spg} color="pink" />
              <StatCard label="BPG" value={displayPlayer.bpg} color="cyan" />
              <StatCard label="TOPG" value={displayPlayer.topg} color="pink" />

              {/* Efficiency Stats */}
              <StatCard label="TS%" value={displayPlayer.ts} color="cyan" />
              <StatCard label="EFG%" value={displayPlayer.efg} color="pink" />
              <StatCard label="PFPG" value={displayPlayer.pfpg} color="cyan" />
            </div>
          </div>
        )}

        {/* No Player Found */}
        {searchQuery && !isSearching && !displayPlayer && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No player found matching "{searchQuery}"</p>
            <p className="text-gray-500 text-sm mt-2">Try searching with the full name</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: any;
  color: "pink" | "cyan";
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClass = color === "pink" ? "text-pink-400" : "text-cyan-400";
  const borderClass = color === "pink" ? "border-pink-500/30" : "border-cyan-500/30";

  return (
    <div className={`p-4 border ${borderClass} rounded-lg bg-slate-800/50 text-center`}>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>
        {value !== null && value !== undefined ? value : "N/A"}
      </p>
    </div>
  );
}
