import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, HelpCircle } from "lucide-react";

export function InjuryReport() {
  const { data: injuries, isLoading } = trpc.injuries.getAllInjuries.useQuery();
  
  const getStatusBadge = (status: string) => {
    const configs = {
      OUT: { color: "bg-red-500/20 text-red-400 border-red-500/50", icon: <XCircle className="w-3 h-3" /> },
      QUESTIONABLE: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", icon: <HelpCircle className="w-3 h-3" /> },
      DOUBTFUL: { color: "bg-orange-500/20 text-orange-400 border-orange-500/50", icon: <AlertTriangle className="w-3 h-3" /> },
      DAY_TO_DAY: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", icon: <AlertTriangle className="w-3 h-3" /> },
      HEALTHY: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: <CheckCircle className="w-3 h-3" /> }
    };
    return configs[status as keyof typeof configs] || configs.HEALTHY;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
            NBA Injury Report
          </h1>
          <p className="text-cyan-400 text-lg">
            Real-time injury updates to factor into your betting decisions
          </p>
        </div>
        
        {/* Injuries List */}
        <Card className="bg-slate-900/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Current Injuries</CardTitle>
            <CardDescription>
              {injuries ? `${injuries.length} player${injuries.length !== 1 ? "s" : ""} with injury status` : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className="text-gray-400 text-center py-8">Loading injury reports...</p>
            )}
            
            {injuries && injuries.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-xl text-green-400 font-semibold mb-2">No Injuries Reported</p>
                <p className="text-gray-400">All players are healthy!</p>
              </div>
            )}
            
            {injuries && injuries.length > 0 && (
              <div className="space-y-3">
                {injuries.map((injury, idx) => {
                  const statusConfig = getStatusBadge(injury.status);
                  return (
                    <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{injury.playerName}</h3>
                          <p className="text-sm text-gray-400">
                            {injury.team} • {injury.position}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusConfig.color}>
                          <span className="flex items-center gap-1">
                            {statusConfig.icon}
                            {injury.status.replace("_", " ")}
                          </span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-gray-400 min-w-[80px]">Injury:</span>
                          <span className="text-sm text-white">{injury.injuryType}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-gray-400 min-w-[80px]">Details:</span>
                          <span className="text-sm text-white">{injury.description}</span>
                        </div>
                        {injury.expectedReturn && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm text-gray-400 min-w-[80px]">Return:</span>
                            <span className="text-sm text-cyan-400">{injury.expectedReturn}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-gray-400 min-w-[80px]">Updated:</span>
                          <span className="text-sm text-gray-500">
                            {new Date(injury.lastUpdated).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Legend */}
        <Card className="mt-6 bg-slate-900/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-sm text-cyan-400">Status Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadge("OUT").color}>
                  <span className="flex items-center gap-1">
                    {getStatusBadge("OUT").icon}
                    OUT
                  </span>
                </Badge>
                <span className="text-xs text-gray-400">Will not play</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadge("DOUBTFUL").color}>
                  <span className="flex items-center gap-1">
                    {getStatusBadge("DOUBTFUL").icon}
                    DOUBTFUL
                  </span>
                </Badge>
                <span className="text-xs text-gray-400">Unlikely to play</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadge("QUESTIONABLE").color}>
                  <span className="flex items-center gap-1">
                    {getStatusBadge("QUESTIONABLE").icon}
                    QUESTIONABLE
                  </span>
                </Badge>
                <span className="text-xs text-gray-400">May play</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadge("DAY_TO_DAY").color}>
                  <span className="flex items-center gap-1">
                    {getStatusBadge("DAY_TO_DAY").icon}
                    DAY TO DAY
                  </span>
                </Badge>
                <span className="text-xs text-gray-400">Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadge("HEALTHY").color}>
                  <span className="flex items-center gap-1">
                    {getStatusBadge("HEALTHY").icon}
                    HEALTHY
                  </span>
                </Badge>
                <span className="text-xs text-gray-400">No issues</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
