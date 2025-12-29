import { useState, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, ChevronDown, Users } from "lucide-react";

export function InjuryReport() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
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

  // Get unique teams sorted alphabetically
  const teams = useMemo(() => {
    if (!injuries) return [];
    const teamSet = new Set<string>();
    injuries.forEach(injury => {
      if (injury.team) teamSet.add(injury.team);
    });
    return Array.from(teamSet).sort();
  }, [injuries]);

  // Group injuries by team
  const injuriesByTeam = useMemo(() => {
    if (!injuries) return new Map<string, typeof injuries>();
    
    const grouped = new Map<string, typeof injuries>();
    injuries.forEach(injury => {
      const team = injury.team || "Unknown";
      if (!grouped.has(team)) {
        grouped.set(team, []);
      }
      grouped.get(team)!.push(injury);
    });
    
    return grouped;
  }, [injuries]);

  // Filter injuries based on selected team
  const filteredInjuries = useMemo(() => {
    if (!injuries) return [];
    if (selectedTeam === "all") return injuries;
    return injuries.filter(injury => injury.team === selectedTeam);
  }, [injuries, selectedTeam]);

  // Get count per team for dropdown
  const getTeamCount = (team: string) => {
    return injuriesByTeam.get(team)?.length || 0;
  };
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-1">
            NBA Injury Report
          </h1>
          <p className="text-sm text-secondary">
            Real-time injury updates to factor into your betting decisions
          </p>
        </div>

        {/* Team Filter */}
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4">
            <label className="text-xs text-muted-foreground mb-2 block">Filter by Team</label>
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Teams ({injuries?.length || 0} injuries)</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team} ({getTeamCount(team)} {getTeamCount(team) === 1 ? "injury" : "injuries"})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </CardContent>
        </Card>
        
        {/* Injuries List */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-secondary text-lg flex items-center justify-between">
              <span>
                {selectedTeam === "all" ? "All Injuries" : selectedTeam}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {filteredInjuries.length} {filteredInjuries.length === 1 ? "player" : "players"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className="text-muted-foreground text-center py-8">Loading injury reports...</p>
            )}
            
            {!isLoading && filteredInjuries.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-semibold mb-1">No Injuries Reported</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTeam === "all" ? "All players are healthy!" : `No injuries for ${selectedTeam}`}
                </p>
              </div>
            )}
            
            {filteredInjuries.length > 0 && (
              <div className="space-y-2">
                {filteredInjuries.map((injury, idx) => {
                  const statusConfig = getStatusBadge(injury.status);
                  return (
                    <div key={idx} className="p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{injury.playerName}</span>
                            <Badge variant="outline" className={`${statusConfig.color} text-xs px-2 py-0`}>
                              <span className="flex items-center gap-1">
                                {statusConfig.icon}
                                {injury.status.replace("_", " ")}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{injury.team}</span>
                            <span>•</span>
                            <span>{injury.position}</span>
                            {injury.injuryType && injury.injuryType !== "Unknown" && (
                              <>
                                <span>•</span>
                                <span className="text-primary">{injury.injuryType}</span>
                              </>
                            )}
                          </div>
                          {injury.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{injury.description}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          {new Date(injury.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Compact Legend */}
        <Card className="mt-4 bg-card border-border">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted-foreground font-medium">Status:</span>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={`${getStatusBadge("OUT").color} text-xs px-1.5 py-0`}>
                  {getStatusBadge("OUT").icon}
                </Badge>
                <span className="text-muted-foreground">Out</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={`${getStatusBadge("DOUBTFUL").color} text-xs px-1.5 py-0`}>
                  {getStatusBadge("DOUBTFUL").icon}
                </Badge>
                <span className="text-muted-foreground">Doubtful</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={`${getStatusBadge("QUESTIONABLE").color} text-xs px-1.5 py-0`}>
                  {getStatusBadge("QUESTIONABLE").icon}
                </Badge>
                <span className="text-muted-foreground">Questionable</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={`${getStatusBadge("DAY_TO_DAY").color} text-xs px-1.5 py-0`}>
                  {getStatusBadge("DAY_TO_DAY").icon}
                </Badge>
                <span className="text-muted-foreground">Day-to-Day</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
