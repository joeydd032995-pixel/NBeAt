import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TeamAnalytics() {
  const { data: teams, isLoading } = trpc.nba.getTeamAnalytics.useQuery({});

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"></div>
          <p className="mt-4 text-cyan-400">Loading team analytics...</p>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-gray-400">No team data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
          Team Analytics
        </h1>
        <p className="text-xl text-cyan-400">
          Offensive/Defensive Ratings, Pace, and Team Trends
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card
            key={team.teamId}
            className="bg-slate-900/50 border-cyan-500/30 p-6 hover:border-pink-500/50 transition-all"
          >
            {/* Team Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-pink-500">{team.teamAbbreviation}</h3>
                <p className="text-sm text-gray-400">{team.teamName}</p>
              </div>
              <div className="flex items-center gap-2">
                {team.trend === "hot" && (
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-bold">HOT</span>
                  </div>
                )}
                {team.trend === "cold" && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-xs font-bold">COLD</span>
                  </div>
                )}
                {team.trend === "steady" && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Minus className="w-5 h-5" />
                    <span className="text-xs font-bold">STEADY</span>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              {/* Offensive Rating */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Offensive Rating</span>
                <span className="text-lg font-bold text-cyan-400">{team.offensiveRating}</span>
              </div>

              {/* Defensive Rating */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Defensive Rating</span>
                <span className="text-lg font-bold text-pink-400">{team.defensiveRating}</span>
              </div>

              {/* Pace */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Pace</span>
                <span className="text-lg font-bold text-purple-400">{team.pace}</span>
              </div>

              {/* Net Rating */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-sm text-gray-400">Net Rating</span>
                <span
                  className={`text-lg font-bold ${
                    team.offensiveRating - team.defensiveRating > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {(team.offensiveRating - team.defensiveRating).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-400">PPG</p>
                <p className="text-sm font-bold text-white">{team.avgPPG}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">RPG</p>
                <p className="text-sm font-bold text-white">{team.avgRPG}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">APG</p>
                <p className="text-sm font-bold text-white">{team.avgAPG}</p>
              </div>
            </div>

            {/* Shooting Stats */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-400">FG%</p>
                <p className="text-sm font-bold text-white">{team.avgFGPct.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">3P%</p>
                <p className="text-sm font-bold text-white">{team.avgTPPct.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">FT%</p>
                <p className="text-sm font-bold text-white">{team.avgFTPct.toFixed(1)}%</p>
              </div>
            </div>

            {/* Games Played */}
            <div className="mt-4 text-center text-xs text-gray-500">
              {team.gamesPlayed} games played
            </div>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card className="bg-slate-900/50 border-cyan-500/30 p-6">
        <h3 className="text-lg font-bold text-pink-500 mb-4">Understanding the Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-bold text-cyan-400">Offensive Rating</p>
            <p className="text-gray-400">Points scored per 100 possessions. Higher is better.</p>
          </div>
          <div>
            <p className="font-bold text-pink-400">Defensive Rating</p>
            <p className="text-gray-400">Points allowed per 100 possessions. Lower is better.</p>
          </div>
          <div>
            <p className="font-bold text-purple-400">Pace</p>
            <p className="text-gray-400">Possessions per game. Indicates game tempo.</p>
          </div>
          <div>
            <p className="font-bold text-green-400">Net Rating</p>
            <p className="text-gray-400">Offensive Rating minus Defensive Rating. Positive is better.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
