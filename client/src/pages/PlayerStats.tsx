import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { PlayerSearchDropdown, Player } from "@/components/PlayerSearchDropdown";

export default function PlayerStats() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Auto-load random player on mount
  const { data: randomPlayer, isLoading: isLoadingRandom } = trpc.nba.getRandomPlayer.useQuery();

  // Set random player on load
  useEffect(() => {
    if (randomPlayer && !selectedPlayer) {
      setSelectedPlayer(randomPlayer as Player);
    }
  }, [randomPlayer, selectedPlayer]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
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

        {/* Player Search Dropdown */}
        <div className="mb-8 p-6 border border-cyan-500/30 rounded-lg bg-slate-900/50">
          <h3 className="text-cyan-400 font-semibold mb-4">Search Player</h3>
          <PlayerSearchDropdown
            onPlayerSelect={handlePlayerSelect}
            selectedPlayer={selectedPlayer}
            placeholder="Search for any NBA player..."
            showPositionFilter={true}
            accentColor="pink"
          />
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
              {/* Core Stats */}
              <StatCard label="PPG" value={displayPlayer.ppg} color="pink" />
              <StatCard label="RPG" value={displayPlayer.rpg} color="cyan" />
              <StatCard label="APG" value={displayPlayer.apg} color="pink" />
              <StatCard label="MPG" value={displayPlayer.minutesPerGame} color="cyan" />

              {/* Shooting Stats */}
              <StatCard label="FG%" value={displayPlayer.fgPct} color="pink" />
              <StatCard label="FGM" value={displayPlayer.fgm} color="cyan" />
              <StatCard label="FGA" value={displayPlayer.fga} color="pink" />
              <StatCard label="FT%" value={displayPlayer.ftPct} color="cyan" />

              {/* Free Throws & Three Point Stats */}
              <StatCard label="FTM" value={displayPlayer.ftm} color="pink" />
              <StatCard label="FTA" value={displayPlayer.fta} color="cyan" />
              <StatCard label="3P%" value={displayPlayer.tpPct} color="pink" />
              <StatCard label="3PM" value={displayPlayer.tpm} color="cyan" />
              <StatCard label="3PA" value={displayPlayer.tpa} color="pink" />

              {/* Rebounding Stats */}
              <StatCard label="ORPG" value={displayPlayer.orpg} color="cyan" />
              <StatCard label="DRPG" value={displayPlayer.drpg} color="pink" />

              {/* Defense Stats */}
              <StatCard label="SPG" value={displayPlayer.spg} color="cyan" />
              <StatCard label="BPG" value={displayPlayer.bpg} color="pink" />
              <StatCard label="TOPG" value={displayPlayer.topg} color="cyan" />

              {/* Efficiency Stats */}
              <StatCard label="TS%" value={displayPlayer.ts} color="pink" />
              <StatCard label="EFG%" value={displayPlayer.efg} color="cyan" />
              <StatCard label="PFPG" value={displayPlayer.pfpg} color="pink" />
            </div>
          </div>
        )}

        {/* No Player Found */}
        {!isLoadingRandom && !displayPlayer && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No player selected</p>
            <p className="text-gray-500 text-sm mt-2">Search for a player above</p>
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
