import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PlayerStats {
  id: number;
  fullName: string;
  position: string;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  fgm: number;
  fga: number;
  ftPct: number;
  ftm: number;
  fta: number;
  tpPct: number;
  tpm: number;
  tpa: number;
  orpg: number;
  drpg: number;
  spg: number;
  bpg: number;
  topg: number;
  pfpg: number;
  ts: number;
  efg: number;
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
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-700/50 items-center">
      <div className={`text-right font-bold text-lg ${p1Better ? 'text-green-400' : p2Better ? 'text-red-400' : 'text-gray-300'}`}>
        {v1.toFixed(1)}
      </div>
      <div className="text-center text-cyan-400 font-medium text-sm">{label}</div>
      <div className={`text-left font-bold text-lg ${p2Better ? 'text-green-400' : p1Better ? 'text-red-400' : 'text-gray-300'}`}>
        {v2.toFixed(1)}
      </div>
    </div>
  );
}

export default function PlayerComparison() {
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [searchedPlayer1, setSearchedPlayer1] = useState("");
  const [searchedPlayer2, setSearchedPlayer2] = useState("");

  const player1Query = trpc.nba.getPlayerByName.useQuery(
    { name: searchedPlayer1 },
    { enabled: searchedPlayer1.length > 0 }
  );

  const player2Query = trpc.nba.getPlayerByName.useQuery(
    { name: searchedPlayer2 },
    { enabled: searchedPlayer2.length > 0 }
  );

  const player1 = player1Query.data as PlayerStats | null;
  const player2 = player2Query.data as PlayerStats | null;

  const handleSearch1 = () => {
    if (player1Name.trim()) {
      setSearchedPlayer1(player1Name.trim());
    }
  };

  const handleSearch2 = () => {
    if (player2Name.trim()) {
      setSearchedPlayer2(player2Name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 mb-2">
            Player Comparison
          </h1>
          <p className="text-cyan-400">Side-by-Side Statistical Analysis</p>
        </div>

        {/* Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Player 1 Search */}
          <Card className="bg-slate-800/50 border-pink-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-pink-400 flex items-center gap-2">
                <Users className="w-5 h-5" /> Player 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter player name..."
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch1()}
                  className="bg-slate-900/50 border-pink-500/30 text-white"
                />
                <Button onClick={handleSearch1} className="bg-pink-600 hover:bg-pink-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {player1 && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-pink-500/20">
                  <p className="text-pink-400 font-bold text-lg">{player1.fullName}</p>
                  <p className="text-gray-400 text-sm">{player1.position} | {player1.gamesPlayed} games</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player 2 Search */}
          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <Users className="w-5 h-5" /> Player 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter player name..."
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch2()}
                  className="bg-slate-900/50 border-cyan-500/30 text-white"
                />
                <Button onClick={handleSearch2} className="bg-cyan-600 hover:bg-cyan-700">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {player2 && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                  <p className="text-cyan-400 font-bold text-lg">{player2.fullName}</p>
                  <p className="text-gray-400 text-sm">{player2.position} | {player2.gamesPlayed} games</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        {player1 && player2 && (
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
                {player1.fullName} vs {player2.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Player Headers */}
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b-2 border-purple-500/30">
                <div className="text-right">
                  <p className="text-pink-400 font-bold text-xl">{player1.fullName}</p>
                  <p className="text-gray-400 text-sm">{player1.position}</p>
                </div>
                <div className="text-center text-purple-400 font-bold">VS</div>
                <div className="text-left">
                  <p className="text-cyan-400 font-bold text-xl">{player2.fullName}</p>
                  <p className="text-gray-400 text-sm">{player2.position}</p>
                </div>
              </div>

              {/* Core Stats */}
              <div className="mb-6">
                <h3 className="text-purple-400 font-bold mb-3 text-center">Core Statistics</h3>
                <StatRow label="PPG" value1={player1.ppg} value2={player2.ppg} />
                <StatRow label="RPG" value1={player1.rpg} value2={player2.rpg} />
                <StatRow label="APG" value1={player1.apg} value2={player2.apg} />
                <StatRow label="SPG" value1={player1.spg} value2={player2.spg} />
                <StatRow label="BPG" value1={player1.bpg} value2={player2.bpg} />
                <StatRow label="TOPG" value1={player1.topg} value2={player2.topg} higherIsBetter={false} />
              </div>

              {/* Shooting Stats */}
              <div className="mb-6">
                <h3 className="text-purple-400 font-bold mb-3 text-center">Shooting Efficiency</h3>
                <StatRow label="FG%" value1={player1.fgPct} value2={player2.fgPct} />
                <StatRow label="3P%" value1={player1.tpPct} value2={player2.tpPct} />
                <StatRow label="FT%" value1={player1.ftPct} value2={player2.ftPct} />
                <StatRow label="TS%" value1={player1.ts} value2={player2.ts} />
                <StatRow label="eFG%" value1={player1.efg} value2={player2.efg} />
              </div>

              {/* Volume Stats */}
              <div className="mb-6">
                <h3 className="text-purple-400 font-bold mb-3 text-center">Volume Stats</h3>
                <StatRow label="FGM" value1={player1.fgm} value2={player2.fgm} />
                <StatRow label="FGA" value1={player1.fga} value2={player2.fga} />
                <StatRow label="3PM" value1={player1.tpm} value2={player2.tpm} />
                <StatRow label="3PA" value1={player1.tpa} value2={player2.tpa} />
                <StatRow label="FTM" value1={player1.ftm} value2={player2.ftm} />
                <StatRow label="FTA" value1={player1.fta} value2={player2.fta} />
              </div>

              {/* Rebounding */}
              <div>
                <h3 className="text-purple-400 font-bold mb-3 text-center">Rebounding</h3>
                <StatRow label="ORPG" value1={player1.orpg} value2={player2.orpg} />
                <StatRow label="DRPG" value1={player1.drpg} value2={player2.drpg} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!player1 || !player2) && (
          <Card className="bg-slate-800/30 border-gray-700/50">
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Search for two players to compare their statistics</p>
              <p className="text-gray-500 text-sm mt-2">Enter player names above and click search</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
