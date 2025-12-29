import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PlayerStats {
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
  topg: string | null;
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
  ts: string | null;
  efg: string | null;
}

function StatRow({ label, value1, value2, higherIsBetter = true }: { label: string; value1: unknown; value2: unknown; higherIsBetter?: boolean }) {
  const toNum = (val: unknown): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
  };
  const v1 = toNum(value1);
  const v2 = toNum(value2);
  const p1Better = higherIsBetter ? v1 > v2 : v1 < v2;
  const p2Better = higherIsBetter ? v2 > v1 : v2 < v1;
  
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/50 items-center">
      <div className={`text-right font-bold ${p1Better ? 'text-green-400' : p2Better ? 'text-red-400' : 'text-foreground'}`}>
        {v1.toFixed(1)}
      </div>
      <div className="text-center text-muted-foreground text-sm">{label}</div>
      <div className={`text-left font-bold ${p2Better ? 'text-green-400' : p1Better ? 'text-red-400' : 'text-foreground'}`}>
        {v2.toFixed(1)}
      </div>
    </div>
  );
}

interface PlayerSelectorProps {
  label: string;
  selectedTeam: string;
  onTeamChange: (team: string) => void;
  selectedPlayer: PlayerStats | null;
  onPlayerChange: (player: PlayerStats | null) => void;
  teams: string[];
  playersByTeam: Map<string, PlayerStats[]>;
  accentColor: "primary" | "secondary";
}

function PlayerSelector({ 
  label, 
  selectedTeam, 
  onTeamChange, 
  selectedPlayer, 
  onPlayerChange, 
  teams, 
  playersByTeam,
  accentColor 
}: PlayerSelectorProps) {
  const teamPlayers = selectedTeam ? playersByTeam.get(selectedTeam) || [] : [];
  const borderColor = accentColor === "primary" ? "border-primary/30" : "border-secondary/30";
  const textColor = accentColor === "primary" ? "text-primary" : "text-secondary";

  return (
    <Card className={`bg-card ${borderColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`${textColor} flex items-center gap-2 text-lg`}>
          <Users className="w-5 h-5" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Team Selector */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Select Team</label>
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => {
                onTeamChange(e.target.value);
                onPlayerChange(null); // Reset player when team changes
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">-- Select a team --</option>
              {teams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Player Selector (only shows when team is selected) */}
        {selectedTeam && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Select Player</label>
            <div className="relative">
              <select
                value={selectedPlayer?.id || ""}
                onChange={(e) => {
                  const playerId = Number(e.target.value);
                  const player = teamPlayers.find(p => p.id === playerId) || null;
                  onPlayerChange(player);
                }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">-- Select a player --</option>
                {teamPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.fullName} ({player.ppg || "0"} PPG)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

        {/* Selected Player Preview */}
        {selectedPlayer && (
          <div className={`p-3 rounded-lg bg-background border ${borderColor}`}>
            <p className={`font-bold ${textColor}`}>{selectedPlayer.fullName}</p>
            <p className="text-xs text-muted-foreground">{selectedPlayer.team} • {selectedPlayer.position || "N/A"}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span><span className="text-muted-foreground">PPG:</span> <span className="font-semibold">{selectedPlayer.ppg || "0"}</span></span>
              <span><span className="text-muted-foreground">RPG:</span> <span className="font-semibold">{selectedPlayer.rpg || "0"}</span></span>
              <span><span className="text-muted-foreground">APG:</span> <span className="font-semibold">{selectedPlayer.apg || "0"}</span></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlayerComparison() {
  const [team1, setTeam1] = useState<string>("");
  const [team2, setTeam2] = useState<string>("");
  const [player1, setPlayer1] = useState<PlayerStats | null>(null);
  const [player2, setPlayer2] = useState<PlayerStats | null>(null);

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

  // Group players by team, sorted by PPG
  const playersByTeam = useMemo(() => {
    if (!allPlayers) return new Map<string, PlayerStats[]>();
    
    const grouped = new Map<string, PlayerStats[]>();
    allPlayers.forEach(player => {
      const team = player.team || "Unknown";
      if (!grouped.has(team)) {
        grouped.set(team, []);
      }
      grouped.get(team)!.push(player as PlayerStats);
    });
    
    // Sort players within each team by PPG descending
    grouped.forEach((players) => {
      players.sort((a, b) => parseFloat(b.ppg || "0") - parseFloat(a.ppg || "0"));
    });
    
    return grouped;
  }, [allPlayers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-1">
            Player Comparison
          </h1>
          <p className="text-sm text-secondary">Side-by-Side Statistical Analysis</p>
        </div>

        {/* Player Selection Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <PlayerSelector
            label="Player 1"
            selectedTeam={team1}
            onTeamChange={setTeam1}
            selectedPlayer={player1}
            onPlayerChange={setPlayer1}
            teams={teams}
            playersByTeam={playersByTeam}
            accentColor="primary"
          />
          <PlayerSelector
            label="Player 2"
            selectedTeam={team2}
            onTeamChange={setTeam2}
            selectedPlayer={player2}
            onPlayerChange={setPlayer2}
            teams={teams}
            playersByTeam={playersByTeam}
            accentColor="secondary"
          />
        </div>

        {/* Comparison Table */}
        {player1 && player2 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg">
                <span className="text-primary">{player1.fullName}</span>
                <span className="text-muted-foreground mx-2">vs</span>
                <span className="text-secondary">{player2.fullName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Player Headers */}
              <div className="grid grid-cols-3 gap-4 mb-4 pb-3 border-b border-border">
                <div className="text-right">
                  <p className="text-primary font-bold">{player1.fullName}</p>
                  <p className="text-xs text-muted-foreground">{player1.team} • {player1.position}</p>
                </div>
                <div className="text-center text-muted-foreground font-bold text-sm self-center">VS</div>
                <div className="text-left">
                  <p className="text-secondary font-bold">{player2.fullName}</p>
                  <p className="text-xs text-muted-foreground">{player2.team} • {player2.position}</p>
                </div>
              </div>

              {/* Core Stats */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 text-center uppercase tracking-wide">Core Statistics</h3>
                <StatRow label="PPG" value1={player1.ppg} value2={player2.ppg} />
                <StatRow label="RPG" value1={player1.rpg} value2={player2.rpg} />
                <StatRow label="APG" value1={player1.apg} value2={player2.apg} />
                <StatRow label="SPG" value1={player1.spg} value2={player2.spg} />
                <StatRow label="BPG" value1={player1.bpg} value2={player2.bpg} />
                <StatRow label="TOPG" value1={player1.topg} value2={player2.topg} higherIsBetter={false} />
              </div>

              {/* Shooting Stats */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 text-center uppercase tracking-wide">Shooting Efficiency</h3>
                <StatRow label="FG%" value1={player1.fgPct} value2={player2.fgPct} />
                <StatRow label="3P%" value1={player1.tpPct} value2={player2.tpPct} />
                <StatRow label="FT%" value1={player1.ftPct} value2={player2.ftPct} />
                <StatRow label="TS%" value1={player1.ts} value2={player2.ts} />
                <StatRow label="eFG%" value1={player1.efg} value2={player2.efg} />
              </div>

              {/* Volume Stats */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 text-center uppercase tracking-wide">Volume Stats</h3>
                <StatRow label="FGM" value1={player1.fgm} value2={player2.fgm} />
                <StatRow label="FGA" value1={player1.fga} value2={player2.fga} />
                <StatRow label="3PM" value1={player1.tpm} value2={player2.tpm} />
                <StatRow label="3PA" value1={player1.tpa} value2={player2.tpa} />
                <StatRow label="FTM" value1={player1.ftm} value2={player2.ftm} />
                <StatRow label="FTA" value1={player1.fta} value2={player2.fta} />
              </div>

              {/* Rebounding */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-2 text-center uppercase tracking-wide">Rebounding</h3>
                <StatRow label="ORPG" value1={player1.orpg} value2={player2.orpg} />
                <StatRow label="DRPG" value1={player1.drpg} value2={player2.drpg} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!player1 || !player2) && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select two players to compare their statistics</p>
              <p className="text-xs text-muted-foreground mt-1">Choose a team first, then select a player from the roster</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
