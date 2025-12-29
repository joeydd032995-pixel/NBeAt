import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, ChevronDown } from "lucide-react";

export default function TeamAnalytics() {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const { data: teams, isLoading } = trpc.nba.getTeamAnalytics.useQuery({});

  // Sort teams alphabetically for dropdown
  const sortedTeams = useMemo(() => {
    if (!teams) return [];
    return [...teams].sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [teams]);

  // Get selected team data
  const selectedTeam = useMemo(() => {
    if (!teams || selectedTeamId === null) return null;
    return teams.find(t => t.teamId === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-secondary">Loading team analytics...</p>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">No team data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          Team Analytics
        </h1>
        <p className="text-sm text-secondary">
          Offensive/Defensive Ratings, Pace, and Team Trends
        </p>
      </div>

      {/* Team Selector */}
      <Card className="bg-card border-border p-4">
        <label className="text-xs text-muted-foreground mb-2 block">Select Team</label>
        <div className="relative">
          <select
            value={selectedTeamId ?? ""}
            onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="">-- Select a team --</option>
            {sortedTeams.map((team) => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName} ({team.teamAbbreviation.toUpperCase()})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        </div>
      </Card>

      {/* Selected Team Analytics */}
      {selectedTeam ? (
        <Card className="bg-card border-primary/30 p-6">
          {/* Team Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-primary">{selectedTeam.teamAbbreviation.toUpperCase()}</h2>
              <p className="text-muted-foreground">{selectedTeam.teamName}</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedTeam.trend === "hot" && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">HOT</span>
                </div>
              )}
              {selectedTeam.trend === "cold" && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm font-bold">COLD</span>
                </div>
              )}
              {selectedTeam.trend === "steady" && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-500/20 text-muted-foreground">
                  <Minus className="w-4 h-4" />
                  <span className="text-sm font-bold">STEADY</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics - Large Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-background rounded-lg p-4 text-center border border-secondary/30">
              <p className="text-xs text-muted-foreground mb-1">Offensive Rating</p>
              <p className="text-2xl font-bold text-secondary">{selectedTeam.offensiveRating}</p>
            </div>
            <div className="bg-background rounded-lg p-4 text-center border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">Defensive Rating</p>
              <p className="text-2xl font-bold text-primary">{selectedTeam.defensiveRating}</p>
            </div>
            <div className="bg-background rounded-lg p-4 text-center border border-border">
              <p className="text-xs text-muted-foreground mb-1">Pace</p>
              <p className="text-2xl font-bold text-foreground">{selectedTeam.pace}</p>
            </div>
            <div className="bg-background rounded-lg p-4 text-center border border-border">
              <p className="text-xs text-muted-foreground mb-1">Net Rating</p>
              <p className={`text-2xl font-bold ${
                selectedTeam.offensiveRating - selectedTeam.defensiveRating > 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}>
                {(selectedTeam.offensiveRating - selectedTeam.defensiveRating) > 0 ? "+" : ""}
                {(selectedTeam.offensiveRating - selectedTeam.defensiveRating).toFixed(1)}
              </p>
            </div>
          </div>

          {/* Team Averages */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Team Averages (Per Player)</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">PPG</p>
                <p className="text-lg font-bold text-foreground">{selectedTeam.avgPPG}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">RPG</p>
                <p className="text-lg font-bold text-foreground">{selectedTeam.avgRPG}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">APG</p>
                <p className="text-lg font-bold text-foreground">{selectedTeam.avgAPG}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">FG%</p>
                <p className="text-lg font-bold text-foreground">{selectedTeam.avgFGPct.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">3P%</p>
                <p className="text-lg font-bold text-foreground">{selectedTeam.avgTPPct.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">FT%</p>
                <p className="text-lg font-bold text-foreground">{selectedTeam.avgFTPct.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Games Played */}
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedTeam.gamesPlayed}</span> games played this season
            </p>
          </div>
        </Card>
      ) : (
        <Card className="bg-card border-border p-12">
          <div className="text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select a team to view analytics</p>
          </div>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-card border-border p-4">
        <h3 className="text-sm font-bold text-primary mb-3">Understanding the Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-secondary">Offensive Rating</p>
            <p className="text-muted-foreground">Points scored per 100 possessions. Higher is better.</p>
          </div>
          <div>
            <p className="font-semibold text-primary">Defensive Rating</p>
            <p className="text-muted-foreground">Points allowed per 100 possessions. Lower is better.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Pace</p>
            <p className="text-muted-foreground">Possessions per game. Indicates game tempo.</p>
          </div>
          <div>
            <p className="font-semibold text-green-400">Net Rating</p>
            <p className="text-muted-foreground">Offensive minus Defensive Rating. Positive is better.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
