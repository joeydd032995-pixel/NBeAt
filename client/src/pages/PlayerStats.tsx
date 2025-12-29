import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronDown, ChevronRight, Users, X } from "lucide-react";

interface Player {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  team: string | null;
  teamAbbr: string | null;
  position: string | null;
  ppg: string | null;
  rpg: string | null;
  apg: string | null;
  spg: string | null;
  bpg: string | null;
  fgPct: string | null;
  fgm: string | null;
  fga: string | null;
  ftPct: string | null;
  ftm: string | null;
  fta: string | null;
  tpPct: string | null;
  tpm: string | null;
  tpa: string | null;
  orpg: string | null;
  drpg: string | null;
  topg: string | null;
  pfpg: string | null;
  ts: string | null;
  efg: string | null;
  gamesPlayed: number | null;
  minutesPerGame: string | null;
  updatedAt: string;
}

export default function PlayerStats() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Fetch all players
  const { data: allPlayers, isLoading } = trpc.players.getAll.useQuery();

  // Get unique teams sorted alphabetically
  const teams = useMemo(() => {
    if (!allPlayers) return [];
    const teamSet = new Set<string>();
    allPlayers.forEach(p => {
      if (p.team) teamSet.add(p.team);
    });
    return Array.from(teamSet).sort();
  }, [allPlayers]);

  // Group players by team
  const playersByTeam = useMemo(() => {
    if (!allPlayers) return new Map<string, Player[]>();
    
    const grouped = new Map<string, Player[]>();
    
    // Filter by selected team if not "all"
    const filteredPlayers = selectedTeam === "all" 
      ? allPlayers 
      : allPlayers.filter(p => p.team === selectedTeam);
    
    filteredPlayers.forEach(player => {
      const team = player.team || "Unknown";
      if (!grouped.has(team)) {
        grouped.set(team, []);
      }
      grouped.get(team)!.push(player as Player);
    });
    
    // Sort players within each team by PPG descending
    grouped.forEach((players, team) => {
      players.sort((a, b) => parseFloat(b.ppg || "0") - parseFloat(a.ppg || "0"));
    });
    
    // Sort teams alphabetically
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [allPlayers, selectedTeam]);

  // Toggle team expansion
  const toggleTeam = (team: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(team)) {
      newExpanded.delete(team);
    } else {
      newExpanded.add(team);
    }
    setExpandedTeams(newExpanded);
  };

  // Expand all teams when filtering to a specific team
  useMemo(() => {
    if (selectedTeam !== "all") {
      setExpandedTeams(new Set([selectedTeam]));
    }
  }, [selectedTeam]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary">
            Player Statistics
          </h1>
          <p className="text-secondary text-sm">2025-26 Season Statistics • Click a player to view details</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Player List */}
          <div className="lg:w-1/3 xl:w-1/4">
            <div className="sticky top-4 border border-border rounded-lg bg-card overflow-hidden">
              {/* Team Filter */}
              <div className="p-3 border-b border-border bg-muted/30">
                <label className="text-xs text-muted-foreground mb-1 block">Filter by Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Teams ({allPlayers?.length || 0} players)</option>
                  {teams.map(team => {
                    const count = allPlayers?.filter(p => p.team === team).length || 0;
                    return (
                      <option key={team} value={team}>
                        {team} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Player List */}
              <div className="max-h-[70vh] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : (
                  Array.from(playersByTeam.entries()).map(([team, players]) => (
                    <div key={team} className="border-b border-border last:border-b-0">
                      {/* Team Header */}
                      <button
                        onClick={() => toggleTeam(team)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-secondary" />
                          <span className="font-medium text-sm text-foreground">{team}</span>
                          <span className="text-xs text-muted-foreground">({players.length})</span>
                        </div>
                        {expandedTeams.has(team) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* Players in Team */}
                      {expandedTeams.has(team) && (
                        <div className="bg-background">
                          {players.map(player => (
                            <button
                              key={player.id}
                              onClick={() => setSelectedPlayer(player)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors border-l-2 ${
                                selectedPlayer?.id === player.id 
                                  ? "border-l-primary bg-primary/10 text-primary" 
                                  : "border-l-transparent text-foreground"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{player.fullName}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {player.ppg || "0"} PPG
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Player Details */}
          <div className="lg:w-2/3 xl:w-3/4">
            {selectedPlayer ? (
              <div className="space-y-4">
                {/* Player Header */}
                <div className="p-4 md:p-6 border border-border rounded-lg bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-1">{selectedPlayer.fullName}</h2>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-secondary">{selectedPlayer.team || "Unknown Team"}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{selectedPlayer.position || "N/A"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Games: {selectedPlayer.gamesPlayed || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated: {new Date(selectedPlayer.updatedAt).toLocaleDateString()}
                      </p>
                      <button 
                        onClick={() => setSelectedPlayer(null)}
                        className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* Core Stats */}
                  <StatCard label="PPG" value={selectedPlayer.ppg} color="primary" />
                  <StatCard label="RPG" value={selectedPlayer.rpg} color="secondary" />
                  <StatCard label="APG" value={selectedPlayer.apg} color="primary" />
                  <StatCard label="SPG" value={selectedPlayer.spg} color="secondary" />
                  <StatCard label="BPG" value={selectedPlayer.bpg} color="primary" />

                  {/* Shooting Stats */}
                  <StatCard label="FG%" value={selectedPlayer.fgPct} color="secondary" />
                  <StatCard label="FGM" value={selectedPlayer.fgm} color="primary" />
                  <StatCard label="FGA" value={selectedPlayer.fga} color="secondary" />
                  <StatCard label="FT%" value={selectedPlayer.ftPct} color="primary" />
                  <StatCard label="FTM" value={selectedPlayer.ftm} color="secondary" />

                  {/* Three Point Stats */}
                  <StatCard label="FTA" value={selectedPlayer.fta} color="primary" />
                  <StatCard label="3P%" value={selectedPlayer.tpPct} color="secondary" />
                  <StatCard label="3PM" value={selectedPlayer.tpm} color="primary" />
                  <StatCard label="3PA" value={selectedPlayer.tpa} color="secondary" />
                  <StatCard label="MPG" value={selectedPlayer.minutesPerGame} color="primary" />

                  {/* Rebounding Stats */}
                  <StatCard label="ORPG" value={selectedPlayer.orpg} color="secondary" />
                  <StatCard label="DRPG" value={selectedPlayer.drpg} color="primary" />
                  <StatCard label="TOPG" value={selectedPlayer.topg} color="secondary" />
                  <StatCard label="PFPG" value={selectedPlayer.pfpg} color="primary" />

                  {/* Efficiency Stats */}
                  <StatCard label="TS%" value={selectedPlayer.ts} color="secondary" />
                  <StatCard label="EFG%" value={selectedPlayer.efg} color="primary" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border border-border rounded-lg bg-card">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Select a player from the list</p>
                  <p className="text-xs text-muted-foreground mt-1">Click on a team to expand, then click a player</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | null;
  color: "primary" | "secondary";
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClass = color === "primary" ? "text-primary" : "text-secondary";
  const borderClass = color === "primary" ? "border-primary/30" : "border-secondary/30";

  return (
    <div className={`p-3 border ${borderClass} rounded-lg bg-card text-center`}>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className={`text-lg md:text-xl font-bold ${colorClass}`}>
        {value !== null && value !== undefined ? value : "N/A"}
      </p>
    </div>
  );
}
