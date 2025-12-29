import { useState, useEffect, useMemo } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Bell, BellOff, Plus, Trash2, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";

interface Alert {
  id: string;
  playerName: string;
  team: string;
  alertType: "points" | "rebounds" | "assists" | "steals" | "blocks" | "threes" | "pra";
  condition: "greater_than" | "less_than" | "equals";
  threshold: number;
  isActive: boolean;
  createdAt: string;
  lastChecked?: string;
  currentValue?: number;
  status?: "met" | "not_met" | "unknown";
}

const STORAGE_KEY = "manunb_alerts";

const loadAlerts = (): Alert[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load alerts:", e);
  }
  return [];
};

const saveAlerts = (alerts: Alert[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error("Failed to save alerts:", e);
  }
};

const STAT_LABELS: Record<string, string> = {
  points: "PPG",
  rebounds: "RPG",
  assists: "APG",
  steals: "SPG",
  blocks: "BPG",
  threes: "3PM",
  pra: "PRA"
};

const CONDITION_LABELS: Record<string, string> = {
  greater_than: ">",
  less_than: "<",
  equals: "="
};

export function CustomAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [alertType, setAlertType] = useState<Alert["alertType"]>("points");
  const [condition, setCondition] = useState<Alert["condition"]>("greater_than");
  const [threshold, setThreshold] = useState("");

  // Fetch all players for selection
  const { data: allPlayers } = trpc.players.getAll.useQuery();

  // Get unique teams
  const teams = useMemo(() => {
    if (!allPlayers) return [];
    const teamSet = new Set<string>();
    allPlayers.forEach(p => {
      if (p.team) teamSet.add(p.team);
    });
    return Array.from(teamSet).sort();
  }, [allPlayers]);

  // Get players for selected team
  const teamPlayers = useMemo(() => {
    if (!allPlayers || !selectedTeam) return [];
    return allPlayers
      .filter(p => p.team === selectedTeam)
      .sort((a, b) => parseFloat(b.ppg || "0") - parseFloat(a.ppg || "0"));
  }, [allPlayers, selectedTeam]);

  // Get selected player data
  const selectedPlayer = useMemo(() => {
    if (!allPlayers || !selectedPlayerId) return null;
    return allPlayers.find(p => p.id === selectedPlayerId) || null;
  }, [allPlayers, selectedPlayerId]);

  // Load alerts on mount
  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  // Check alerts against current player stats
  const alertsWithStatus = useMemo(() => {
    if (!allPlayers) return alerts;
    
    return alerts.map(alert => {
      const player = allPlayers.find(p => 
        p.fullName.toLowerCase() === alert.playerName.toLowerCase()
      );
      
      if (!player) return { ...alert, status: "unknown" as const };
      
      let currentValue = 0;
      switch (alert.alertType) {
        case "points": currentValue = parseFloat(player.ppg || "0"); break;
        case "rebounds": currentValue = parseFloat(player.rpg || "0"); break;
        case "assists": currentValue = parseFloat(player.apg || "0"); break;
        case "steals": currentValue = parseFloat(player.spg || "0"); break;
        case "blocks": currentValue = parseFloat(player.bpg || "0"); break;
        case "threes": currentValue = parseFloat(player.tpm || "0"); break;
        case "pra": 
          currentValue = parseFloat(player.ppg || "0") + 
                        parseFloat(player.rpg || "0") + 
                        parseFloat(player.apg || "0"); 
          break;
      }
      
      let met = false;
      switch (alert.condition) {
        case "greater_than": met = currentValue > alert.threshold; break;
        case "less_than": met = currentValue < alert.threshold; break;
        case "equals": met = Math.abs(currentValue - alert.threshold) < 0.1; break;
      }
      
      return {
        ...alert,
        currentValue,
        status: met ? "met" as const : "not_met" as const,
        lastChecked: new Date().toISOString()
      };
    });
  }, [alerts, allPlayers]);

  // Create new alert
  const handleCreateAlert = () => {
    if (!selectedPlayer || !threshold) return;
    
    const newAlert: Alert = {
      id: Date.now().toString(),
      playerName: selectedPlayer.fullName,
      team: selectedPlayer.team || "Unknown",
      alertType,
      condition,
      threshold: parseFloat(threshold),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    saveAlerts(updated);
    
    // Reset form
    setSelectedTeam("");
    setSelectedPlayerId(null);
    setThreshold("");
    setShowForm(false);
  };

  // Toggle alert active state
  const toggleAlert = (alertId: string) => {
    const updated = alerts.map(a => 
      a.id === alertId ? { ...a, isActive: !a.isActive } : a
    );
    setAlerts(updated);
    saveAlerts(updated);
  };

  // Delete alert
  const deleteAlert = (alertId: string) => {
    const updated = alerts.filter(a => a.id !== alertId);
    setAlerts(updated);
    saveAlerts(updated);
  };

  // Get current stat value for selected player
  const getCurrentStatValue = () => {
    if (!selectedPlayer) return null;
    switch (alertType) {
      case "points": return selectedPlayer.ppg;
      case "rebounds": return selectedPlayer.rpg;
      case "assists": return selectedPlayer.apg;
      case "steals": return selectedPlayer.spg;
      case "blocks": return selectedPlayer.bpg;
      case "threes": return selectedPlayer.tpm;
      case "pra": 
        return (parseFloat(selectedPlayer.ppg || "0") + 
                parseFloat(selectedPlayer.rpg || "0") + 
                parseFloat(selectedPlayer.apg || "0")).toFixed(1);
    }
  };

  const activeAlerts = alertsWithStatus.filter(a => a.isActive);
  const metAlerts = activeAlerts.filter(a => a.status === "met");

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-1">
            Custom Alerts
          </h1>
          <p className="text-sm text-secondary">
            Set thresholds and track when players hit your targets
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{activeAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{metAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Triggered</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Alert Button */}
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full mb-6 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New Alert
          </Button>
        )}

        {/* Create Alert Form */}
        {showForm && (
          <Card className="bg-card border-primary/30 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Create New Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Select Team</label>
                <div className="relative">
                  <select
                    value={selectedTeam}
                    onChange={(e) => {
                      setSelectedTeam(e.target.value);
                      setSelectedPlayerId(null);
                    }}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Select a team --</option>
                    {teams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Player Selection */}
              {selectedTeam && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Select Player</label>
                  <div className="relative">
                    <select
                      value={selectedPlayerId || ""}
                      onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Select a player --</option>
                      {teamPlayers.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.fullName} ({player.ppg} PPG)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Stat Type, Condition, Threshold */}
              {selectedPlayer && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Stat Type</label>
                      <select
                        value={alertType}
                        onChange={(e) => setAlertType(e.target.value as Alert["alertType"])}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="points">Points (PPG)</option>
                        <option value="rebounds">Rebounds (RPG)</option>
                        <option value="assists">Assists (APG)</option>
                        <option value="steals">Steals (SPG)</option>
                        <option value="blocks">Blocks (BPG)</option>
                        <option value="threes">3-Pointers (3PM)</option>
                        <option value="pra">PRA Combined</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Condition</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value as Alert["condition"])}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="greater_than">Greater Than (&gt;)</option>
                        <option value="less_than">Less Than (&lt;)</option>
                        <option value="equals">Equals (=)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Threshold</label>
                      <input
                        type="number"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        placeholder="e.g., 25"
                        step="0.1"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Current Value Preview */}
                  <div className="p-3 bg-background rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">{selectedPlayer.fullName}</span>'s current {STAT_LABELS[alertType]}:{" "}
                      <span className="text-primary font-bold">{getCurrentStatValue()}</span>
                    </p>
                    {threshold && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Alert will trigger when {STAT_LABELS[alertType]} {CONDITION_LABELS[condition]} {threshold}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateAlert}
                  disabled={!selectedPlayer || !threshold}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Create Alert
                </Button>
                <Button onClick={() => setShowForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts List */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              Your Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsWithStatus.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No alerts created yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create an alert to track player performance</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alertsWithStatus.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-lg border ${
                      alert.status === "met" && alert.isActive
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{alert.playerName}</span>
                          <Badge variant="outline" className={`text-xs px-2 py-0 ${
                            alert.isActive 
                              ? "bg-green-500/20 text-green-400 border-green-500/50"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                          }`}>
                            {alert.isActive ? "Active" : "Paused"}
                          </Badge>
                          {alert.status === "met" && alert.isActive && (
                            <Badge variant="outline" className="text-xs px-2 py-0 bg-primary/20 text-primary border-primary/50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Triggered
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {STAT_LABELS[alert.alertType]} {CONDITION_LABELS[alert.condition]} {alert.threshold}
                          {alert.currentValue !== undefined && (
                            <span className="ml-2 text-foreground">
                              (Current: <span className={alert.status === "met" ? "text-green-400" : ""}>{alert.currentValue.toFixed(1)}</span>)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          className={`p-2 rounded transition-colors ${
                            alert.isActive 
                              ? "text-green-400 hover:bg-green-500/20" 
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          title={alert.isActive ? "Pause alert" : "Activate alert"}
                        >
                          {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-4 bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Alerts are checked against current season averages. "Triggered" means the player's 
                current average meets your threshold. Data is stored locally in your browser.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
