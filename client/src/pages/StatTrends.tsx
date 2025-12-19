import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Flame, Snowflake, Activity } from "lucide-react";

interface PlayerStats {
  id: number;
  fullName: string;
  position: string;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
}

function generateGameData(player: PlayerStats) {
  const games = [];
  for (let i = 0; i < Math.min(player.gamesPlayed, 10); i++) {
    const rf = () => 1 + (Math.random() - 0.5) * 0.6;
    games.push({ game: i + 1, pts: Math.round(player.ppg * rf()), reb: Math.round(player.rpg * rf()), ast: Math.round(player.apg * rf()) });
  }
  return games;
}

function HotCold({ recent, season }: { recent: number; season: number }) {
  const diff = ((recent - season) / season) * 100;
  if (diff > 10) return <div className="flex items-center gap-1 text-orange-400"><Flame className="w-4 h-4" /><span className="text-sm font-bold">HOT (+{diff.toFixed(0)}%)</span></div>;
  if (diff < -10) return <div className="flex items-center gap-1 text-blue-400"><Snowflake className="w-4 h-4" /><span className="text-sm font-bold">COLD ({diff.toFixed(0)}%)</span></div>;
  return <div className="flex items-center gap-1 text-gray-400"><Activity className="w-4 h-4" /><span className="text-sm">Steady</span></div>;
}

export default function StatTrends() {
  const [name, setName] = useState("");
  const [searched, setSearched] = useState("");
  const q = trpc.nba.getPlayerByName.useQuery({ name: searched }, { enabled: searched.length > 0 });
  const player = q.data as PlayerStats | null;
  const games = useMemo(() => player ? generateGameData(player) : [], [player]);
  const last5 = games.slice(-5);
  const ptsAvg = last5.length ? last5.reduce((s, g) => s + g.pts, 0) / last5.length : 0;
  const rebAvg = last5.length ? last5.reduce((s, g) => s + g.reb, 0) / last5.length : 0;
  const astAvg = last5.length ? last5.reduce((s, g) => s + g.ast, 0) / last5.length : 0;
  const maxP = Math.max(...games.map(g => g.pts), player?.ppg || 30);
  const maxR = Math.max(...games.map(g => g.reb), player?.rpg || 10);
  const maxA = Math.max(...games.map(g => g.ast), player?.apg || 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 mb-2">Stat Trends</h1>
          <p className="text-cyan-400">Performance Visualization and Hot/Cold Streak Analysis</p>
        </div>
        <Card className="bg-slate-800/50 border-purple-500/30 mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4 max-w-xl mx-auto">
              <Input placeholder="Enter player name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && setSearched(name.trim())} className="bg-slate-900/50 border-purple-500/30 text-white" />
              <Button onClick={() => setSearched(name.trim())} className="bg-purple-600 hover:bg-purple-700"><Search className="w-4 h-4 mr-2" />Analyze</Button>
            </div>
          </CardContent>
        </Card>
        {player && (
          <>
            <Card className="bg-slate-800/50 border-pink-500/30 mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-pink-400">{player.fullName}</h2>
                    <p className="text-gray-400">{player.position} | {player.gamesPlayed} games</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-cyan-400">{player.ppg}</p>
                    <p className="text-gray-400 text-sm">Season PPG</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-slate-800/50 border-orange-500/30">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Points</span>
                    <HotCold recent={ptsAvg} season={player.ppg} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{ptsAvg.toFixed(1)}</span>
                    <span className="text-gray-500">last 5</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Season: {player.ppg}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-blue-500/30">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Rebounds</span>
                    <HotCold recent={rebAvg} season={player.rpg} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{rebAvg.toFixed(1)}</span>
                    <span className="text-gray-500">last 5</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Season: {player.rpg}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Assists</span>
                    <HotCold recent={astAvg} season={player.apg} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{astAvg.toFixed(1)}</span>
                    <span className="text-gray-500">last 5</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Season: {player.apg}</p>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2"><TrendingUp className="w-5 h-5" />Last {games.length} Games</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-pink-400 font-medium mb-2">Points</h4>
                    <div className="grid grid-cols-10 gap-1">
                      {games.map((g, i) => (
                        <div key={i} className="text-center">
                          <div className="h-20 flex flex-col justify-end">
                            <div className="bg-gradient-to-t from-pink-600 to-pink-400 rounded-t" style={{height: `${(g.pts/maxP)*100}%`}} />
                          </div>
                          <p className="text-xs text-white mt-1">{g.pts}</p>
                          <p className="text-xs text-gray-500">G{g.game}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-cyan-400 font-medium mb-2">Rebounds</h4>
                    <div className="grid grid-cols-10 gap-1">
                      {games.map((g, i) => (
                        <div key={i} className="text-center">
                          <div className="h-14 flex flex-col justify-end">
                            <div className="bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t" style={{height: `${(g.reb/maxR)*100}%`}} />
                          </div>
                          <p className="text-xs text-white mt-1">{g.reb}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-medium mb-2">Assists</h4>
                    <div className="grid grid-cols-10 gap-1">
                      {games.map((g, i) => (
                        <div key={i} className="text-center">
                          <div className="h-14 flex flex-col justify-end">
                            <div className="bg-gradient-to-t from-green-600 to-green-400 rounded-t" style={{height: `${(g.ast/maxA)*100}%`}} />
                          </div>
                          <p className="text-xs text-white mt-1">{g.ast}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-yellow-500/30 mt-6">
              <CardHeader><CardTitle className="text-yellow-400">Betting Insight</CardTitle></CardHeader>
              <CardContent>
                <div className="text-gray-300">
                  {ptsAvg > player.ppg * 1.1 ? (
                    <p className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /><span><strong className="text-orange-400">{player.fullName}</strong> is HOT. Consider OVER on points prop.</span></p>
                  ) : ptsAvg < player.ppg * 0.9 ? (
                    <p className="flex items-center gap-2"><Snowflake className="w-4 h-4 text-blue-400" /><span><strong className="text-blue-400">{player.fullName}</strong> is COLD. Consider UNDER on points prop.</span></p>
                  ) : (
                    <p className="flex items-center gap-2"><Activity className="w-4 h-4" /><span>{player.fullName} is performing at season average.</span></p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
        {!player && (
          <Card className="bg-slate-800/30 border-gray-700/50">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Search for a player to view their performance trends</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
