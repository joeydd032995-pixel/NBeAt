import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PlayerSearchDropdown, Player } from "../components/PlayerSearchDropdown";

export function PropAnalyzer() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  const { data: analysis, isLoading } = trpc.props.analyzePlayerProps.useQuery(
    { playerName: selectedPlayer?.fullName || "" },
    { enabled: !!selectedPlayer?.fullName }
  );
  
  const { data: topOpportunities } = trpc.props.getTopOpportunities.useQuery({ limit: 10 });
  
  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };
  
  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      HIGH: "bg-green-500/20 text-green-400 border-green-500/50",
      MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      LOW: "bg-gray-500/20 text-gray-400 border-gray-500/50"
    };
    return colors[confidence as keyof typeof colors] || colors.LOW;
  };
  
  const getRecommendationIcon = (rec: string) => {
    if (rec === "OVER") return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (rec === "UNDER") return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
            Player Prop Analyzer
          </h1>
          <p className="text-cyan-400 text-lg">
            Analyze prop bets with historical hit rates and AI-powered recommendations
          </p>
        </div>
        
        {/* Search */}
        <Card className="mb-8 bg-slate-900/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Search Player</CardTitle>
            <CardDescription>Select a player to analyze prop betting opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerSearchDropdown
              onPlayerSelect={handlePlayerSelect}
              selectedPlayer={selectedPlayer}
              placeholder="Search for any NBA player..."
              showPositionFilter={true}
              accentColor="cyan"
            />
          </CardContent>
        </Card>
        
        {/* Player Analysis */}
        {isLoading && (
          <Card className="mb-8 bg-slate-900/50 border-cyan-500/30">
            <CardContent className="p-8 text-center">
              <p className="text-cyan-400">Analyzing props...</p>
            </CardContent>
          </Card>
        )}
        
        {analysis && (
          <div className="mb-8">
            <Card className="bg-slate-900/50 border-pink-500/30 mb-4">
              <CardHeader>
                <CardTitle className="text-2xl text-pink-400">{analysis.player.fullName}</CardTitle>
                <CardDescription>{analysis.overallRecommendation}</CardDescription>
              </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.props.map((prop, idx) => (
                <Card key={idx} className="bg-slate-900/50 border-cyan-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-cyan-400 capitalize">{prop.propType}</CardTitle>
                      {getRecommendationIcon(prop.recommendation)}
                    </div>
                    <CardDescription>{prop.bookmaker}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-white mb-2">
                        O/U {prop.line}
                      </p>
                      <div className="flex gap-2 text-sm">
                        <span className="text-gray-400">Over {prop.overOdds}</span>
                        <span className="text-gray-400">Under {prop.underOdds}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Season Avg:</span>
                        <span className="text-white font-semibold">{prop.seasonAverage.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Last 10 Avg:</span>
                        <span className="text-white font-semibold">{prop.last10Average}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Hit Rate:</span>
                        <span className="text-green-400 font-semibold">{prop.hitRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Season Hit Rate:</span>
                        <span className="text-green-400 font-semibold">{prop.seasonHitRate}%</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={getConfidenceBadge(prop.confidence)}>
                          {prop.confidence}
                        </Badge>
                        <Badge variant="outline" className={
                          prop.recommendation === "OVER" ? "bg-green-500/20 text-green-400 border-green-500/50" :
                          prop.recommendation === "UNDER" ? "bg-red-500/20 text-red-400 border-red-500/50" :
                          "bg-gray-500/20 text-gray-400 border-gray-500/50"
                        }>
                          {prop.recommendation}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Top Opportunities */}
        <Card className="bg-slate-900/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Top Prop Opportunities</CardTitle>
            <CardDescription>High-confidence prop bets across all players</CardDescription>
          </CardHeader>
          <CardContent>
            {topOpportunities && topOpportunities.length > 0 ? (
              <div className="space-y-3">
                {topOpportunities.map((opp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{opp.playerName}</p>
                      <p className="text-sm text-gray-400 capitalize">
                        {opp.propType} {opp.recommendation} {opp.line} ({opp.bookmaker})
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Hit Rate</p>
                        <p className="text-lg font-bold text-green-400">{opp.hitRate}%</p>
                      </div>
                      <Badge variant="outline" className={getConfidenceBadge(opp.confidence)}>
                        {opp.confidence}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Loading top opportunities...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
