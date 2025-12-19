import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
// Auth check using trpc

export function CustomAlerts() {
  const { data: user } = trpc.auth.me.useQuery();
  const [playerName, setPlayerName] = useState("");
  const [alertType, setAlertType] = useState<"points" | "rebounds" | "assists">("points");
  const [condition, setCondition] = useState("greater_than");
  const [threshold, setThreshold] = useState("");
  const [consecutiveGames, setConsecutiveGames] = useState("1");
  
  const { data: alerts, refetch } = trpc.alerts.getUserAlerts.useQuery(undefined, {
    enabled: !!user
  });
  
  const createMutation = trpc.alerts.createAlert.useMutation({
    onSuccess: () => {
      refetch();
      // Reset form
      setPlayerName("");
      setThreshold("");
      setConsecutiveGames("1");
    }
  });
  
  const toggleMutation = trpc.alerts.toggleAlert.useMutation({
    onSuccess: () => refetch()
  });
  
  const deleteMutation = trpc.alerts.deleteAlert.useMutation({
    onSuccess: () => refetch()
  });
  
  const handleCreateAlert = () => {
    if (!playerName || !threshold) return;
    
    createMutation.mutate({
      playerName,
      alertType,
      condition,
      threshold,
      consecutiveGames: parseInt(consecutiveGames),
      description: `Notify when ${playerName} ${alertType} ${condition.replace("_", " ")} ${threshold}${parseInt(consecutiveGames) > 1 ? ` for ${consecutiveGames} consecutive games` : ""}`
    });
  };
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <Card className="max-w-md bg-slate-900/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Login Required</CardTitle>
            <CardDescription>You need to be logged in to create custom alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = "/api/oauth/login"}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
            >
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
            Custom Alerts
          </h1>
          <p className="text-cyan-400 text-lg">
            Set personalized thresholds and get notified of betting opportunities
          </p>
        </div>
        
        {/* Create Alert */}
        <Card className="mb-8 bg-slate-900/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Create New Alert</CardTitle>
            <CardDescription>Set up a custom alert for player performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Player Name</label>
                <Input
                  placeholder="e.g., Stephen Curry"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="bg-slate-800 border-cyan-500/30 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Stat Type</label>
                <Select value={alertType} onValueChange={(v: any) => setAlertType(v)}>
                  <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="rebounds">Rebounds</SelectItem>
                    <SelectItem value="assists">Assists</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Condition</label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="bg-slate-800 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Threshold</label>
                <Input
                  type="number"
                  placeholder="e.g., 35"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="bg-slate-800 border-cyan-500/30 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Consecutive Games</label>
                <Input
                  type="number"
                  min="1"
                  value={consecutiveGames}
                  onChange={(e) => setConsecutiveGames(e.target.value)}
                  className="bg-slate-800 border-cyan-500/30 text-white"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleCreateAlert}
              disabled={!playerName || !threshold || createMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createMutation.isPending ? "Creating..." : "Create Alert"}
            </Button>
          </CardContent>
        </Card>
        
        {/* Active Alerts */}
        <Card className="bg-slate-900/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Your Alerts</CardTitle>
            <CardDescription>
              {alerts ? `${alerts.length} active alert${alerts.length !== 1 ? "s" : ""}` : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                No alerts yet. Create your first alert above!
              </p>
            )}
            
            {alerts && alerts.length > 0 && (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{alert.playerName}</h3>
                        <p className="text-sm text-gray-400 capitalize">
                          {alert.alertType} {alert.condition.replace("_", " ")} {alert.threshold}
                          {alert.consecutiveGames && alert.consecutiveGames > 1 && (
                            <span> for {alert.consecutiveGames} consecutive games</span>
                          )}
                        </p>
                        {alert.description && (
                          <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          alert.isActive === 1 
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                        }>
                          {alert.isActive === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMutation.mutate({ alertId: alert.id })}
                        disabled={toggleMutation.isPending}
                        className="flex-1"
                      >
                        {alert.isActive === 1 ? (
                          <>
                            <BellOff className="w-3 h-3 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Bell className="w-3 h-3 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate({ alertId: alert.id })}
                        disabled={deleteMutation.isPending}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {alert.lastTriggered && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-gray-500">
                          Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
