import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function LiveOdds() {
  const { data: games, isLoading, refetch } = trpc.odds.getNBAOdds.useQuery();

  const formatOdds = (odds: number) => {
    if (odds > 0) return `+${odds}`;
    return `${odds}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
          <p className="mt-4 text-cyan-400">Loading live odds...</p>
        </div>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            Live NBA Odds
          </h1>
          <p className="text-gray-400">No upcoming games available</p>
          <Button
            onClick={() => refetch()}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            Live NBA Odds
          </h1>
          <p className="text-xl text-cyan-400 mt-2">
            Real-time betting lines from major sportsbooks
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          className="bg-cyan-500 hover:bg-cyan-600 text-black"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Games List */}
      <div className="space-y-6">
        {games.map((game) => (
          <Card
            key={game.id}
            className="bg-slate-900/50 border-cyan-500/30 p-6 hover:border-pink-500/50 transition-all"
          >
            {/* Game Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400">
                  {formatDate(game.commence_time)}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                {game.bookmakers.length} bookmakers
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white">{game.away_team}</h3>
                <p className="text-xs text-gray-400 mt-1">Away</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white">{game.home_team}</h3>
                <p className="text-xs text-gray-400 mt-1">Home</p>
              </div>
            </div>

            {/* Odds from each bookmaker */}
            {game.bookmakers.map((bookmaker) => (
              <div
                key={bookmaker.key}
                className="border-t border-gray-700 pt-4 mt-4"
              >
                <p className="text-sm font-bold text-pink-500 mb-3">
                  {bookmaker.title}
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {/* Moneyline */}
                  {bookmaker.markets.find((m) => m.key === "h2h") && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Moneyline</p>
                      <div className="space-y-1">
                        {bookmaker.markets
                          .find((m) => m.key === "h2h")
                          ?.outcomes.map((outcome) => (
                            <div
                              key={outcome.name}
                              className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded"
                            >
                              <span className="text-xs text-gray-300">
                                {outcome.name === game.away_team ? "Away" : "Home"}
                              </span>
                              <span className="text-sm font-bold text-cyan-400">
                                {formatOdds(outcome.price)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Spreads */}
                  {bookmaker.markets.find((m) => m.key === "spreads") && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Spread</p>
                      <div className="space-y-1">
                        {bookmaker.markets
                          .find((m) => m.key === "spreads")
                          ?.outcomes.map((outcome) => (
                            <div
                              key={outcome.name}
                              className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded"
                            >
                              <span className="text-xs text-gray-300">
                                {outcome.name === game.away_team ? "Away" : "Home"}{" "}
                                {outcome.point !== undefined && (
                                  <span className="text-pink-400">
                                    {outcome.point > 0 ? "+" : ""}
                                    {outcome.point}
                                  </span>
                                )}
                              </span>
                              <span className="text-sm font-bold text-cyan-400">
                                {formatOdds(outcome.price)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  {bookmaker.markets.find((m) => m.key === "totals") && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Total</p>
                      <div className="space-y-1">
                        {bookmaker.markets
                          .find((m) => m.key === "totals")
                          ?.outcomes.map((outcome) => (
                            <div
                              key={outcome.name}
                              className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded"
                            >
                              <span className="text-xs text-gray-300">
                                {outcome.name}{" "}
                                {outcome.point !== undefined && (
                                  <span className="text-purple-400">{outcome.point}</span>
                                )}
                              </span>
                              <span className="text-sm font-bold text-cyan-400">
                                {formatOdds(outcome.price)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="bg-slate-900/50 border-cyan-500/30 p-6">
        <h3 className="text-lg font-bold text-pink-500 mb-4">How to Read the Odds</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-bold text-cyan-400">Moneyline</p>
            <p className="text-gray-400">
              Bet on which team wins. Negative odds = favorite, positive = underdog.
            </p>
          </div>
          <div>
            <p className="font-bold text-pink-400">Spread</p>
            <p className="text-gray-400">
              Bet on margin of victory. Favorite must win by more than the spread.
            </p>
          </div>
          <div>
            <p className="font-bold text-purple-400">Total (Over/Under)</p>
            <p className="text-gray-400">
              Bet on combined score. Over = more points, Under = fewer points.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
