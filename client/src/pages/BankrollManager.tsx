import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  DollarSign,
  Target,
  BarChart3,
  History
} from "lucide-react";

interface Bet {
  id: string;
  date: string;
  description: string;
  amount: number;
  odds: number;
  result: "win" | "loss" | "push" | "pending";
  payout: number;
}

interface BankrollData {
  initialBankroll: number;
  currentBankroll: number;
  unitSize: number;
  riskPercentage: number;
  bets: Bet[];
}

const STORAGE_KEY = "manunb_bankroll";

const getDefaultData = (): BankrollData => ({
  initialBankroll: 1000,
  currentBankroll: 1000,
  unitSize: 10,
  riskPercentage: 1,
  bets: []
});

const loadData = (): BankrollData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load bankroll data:", e);
  }
  return getDefaultData();
};

const saveData = (data: BankrollData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save bankroll data:", e);
  }
};

export default function BankrollManager() {
  const [data, setData] = useState<BankrollData>(getDefaultData);
  const [showAddBet, setShowAddBet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // New bet form state
  const [newBet, setNewBet] = useState({
    description: "",
    amount: "",
    odds: "",
    result: "pending" as Bet["result"]
  });

  // Settings form state
  const [settings, setSettings] = useState({
    initialBankroll: "",
    riskPercentage: ""
  });

  // Load data on mount
  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    setSettings({
      initialBankroll: loaded.initialBankroll.toString(),
      riskPercentage: loaded.riskPercentage.toString()
    });
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Calculate stats
  const stats = useMemo(() => {
    const completedBets = data.bets.filter(b => b.result !== "pending");
    const wins = completedBets.filter(b => b.result === "win").length;
    const losses = completedBets.filter(b => b.result === "loss").length;
    const pushes = completedBets.filter(b => b.result === "push").length;
    const totalBets = completedBets.length;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    
    const totalWagered = completedBets.reduce((sum, b) => sum + b.amount, 0);
    const totalReturned = completedBets.reduce((sum, b) => sum + b.payout, 0);
    const netProfit = totalReturned - totalWagered;
    const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;
    
    return { wins, losses, pushes, totalBets, winRate, totalWagered, totalReturned, netProfit, roi };
  }, [data.bets]);

  // Calculate payout based on American odds
  const calculatePayout = (amount: number, odds: number, result: Bet["result"]): number => {
    if (result === "loss") return 0;
    if (result === "push") return amount;
    if (result === "pending") return 0;
    // Win
    if (odds > 0) {
      return amount + (amount * odds / 100);
    } else {
      return amount + (amount * 100 / Math.abs(odds));
    }
  };

  // Add new bet
  const handleAddBet = () => {
    const amount = parseFloat(newBet.amount);
    const odds = parseFloat(newBet.odds);
    
    if (!newBet.description || isNaN(amount) || isNaN(odds) || amount <= 0) {
      return;
    }

    const payout = calculatePayout(amount, odds, newBet.result);
    
    const bet: Bet = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: newBet.description,
      amount,
      odds,
      result: newBet.result,
      payout
    };

    // Update bankroll based on result
    let newBankroll = data.currentBankroll;
    if (newBet.result === "win") {
      newBankroll = data.currentBankroll + (payout - amount);
    } else if (newBet.result === "loss") {
      newBankroll = data.currentBankroll - amount;
    }
    // Push = no change

    setData(prev => ({
      ...prev,
      currentBankroll: newBankroll,
      unitSize: newBankroll * (prev.riskPercentage / 100),
      bets: [bet, ...prev.bets]
    }));

    setNewBet({ description: "", amount: "", odds: "", result: "pending" });
    setShowAddBet(false);
  };

  // Update bet result
  const updateBetResult = (betId: string, result: Bet["result"]) => {
    setData(prev => {
      const betIndex = prev.bets.findIndex(b => b.id === betId);
      if (betIndex === -1) return prev;
      
      const bet = prev.bets[betIndex];
      const oldResult = bet.result;
      const newPayout = calculatePayout(bet.amount, bet.odds, result);
      
      // Calculate bankroll adjustment
      let bankrollChange = 0;
      
      // Reverse old result
      if (oldResult === "win") {
        bankrollChange -= (bet.payout - bet.amount);
      } else if (oldResult === "loss") {
        bankrollChange += bet.amount;
      }
      
      // Apply new result
      if (result === "win") {
        bankrollChange += (newPayout - bet.amount);
      } else if (result === "loss") {
        bankrollChange -= bet.amount;
      }
      
      const newBankroll = prev.currentBankroll + bankrollChange;
      const updatedBets = [...prev.bets];
      updatedBets[betIndex] = { ...bet, result, payout: newPayout };
      
      return {
        ...prev,
        currentBankroll: newBankroll,
        unitSize: newBankroll * (prev.riskPercentage / 100),
        bets: updatedBets
      };
    });
  };

  // Delete bet
  const deleteBet = (betId: string) => {
    setData(prev => {
      const bet = prev.bets.find(b => b.id === betId);
      if (!bet) return prev;
      
      // Reverse the bet's effect on bankroll
      let bankrollChange = 0;
      if (bet.result === "win") {
        bankrollChange = -(bet.payout - bet.amount);
      } else if (bet.result === "loss") {
        bankrollChange = bet.amount;
      }
      
      const newBankroll = prev.currentBankroll + bankrollChange;
      
      return {
        ...prev,
        currentBankroll: newBankroll,
        unitSize: newBankroll * (prev.riskPercentage / 100),
        bets: prev.bets.filter(b => b.id !== betId)
      };
    });
  };

  // Save settings
  const handleSaveSettings = () => {
    const initial = parseFloat(settings.initialBankroll);
    const risk = parseFloat(settings.riskPercentage);
    
    if (isNaN(initial) || initial <= 0 || isNaN(risk) || risk <= 0 || risk > 100) {
      return;
    }

    setData(prev => ({
      ...prev,
      initialBankroll: initial,
      currentBankroll: initial,
      riskPercentage: risk,
      unitSize: initial * (risk / 100),
      bets: [] // Reset bets when changing initial bankroll
    }));
    
    setShowSettings(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-1">
            Bankroll Manager
          </h1>
          <p className="text-sm text-secondary">Track your betting bankroll and performance</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Current</span>
              </div>
              <p className={`text-xl font-bold ${data.currentBankroll >= data.initialBankroll ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(data.currentBankroll)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-secondary" />
                <span className="text-xs text-muted-foreground">Unit Size</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(data.unitSize)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {stats.netProfit >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className="text-xs text-muted-foreground">Profit/Loss</span>
              </div>
              <p className={`text-xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">ROI</span>
              </div>
              <p className={`text-xl font-bold ${stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Record Stats */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.wins}</p>
                  <p className="text-xs text-muted-foreground">Wins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
                  <p className="text-xs text-muted-foreground">Losses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{stats.pushes}</p>
                  <p className="text-xs text-muted-foreground">Pushes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowAddBet(true)}
                  className="bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Bet
                </Button>
                <Button 
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                >
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Bet Form */}
        {showAddBet && (
          <Card className="bg-card border-primary/30 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary">Add New Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  value={newBet.description}
                  onChange={(e) => setNewBet(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Lakers ML vs Celtics"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount ($)</label>
                  <input
                    type="number"
                    value={newBet.amount}
                    onChange={(e) => setNewBet(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="100"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Odds (American)</label>
                  <input
                    type="number"
                    value={newBet.odds}
                    onChange={(e) => setNewBet(prev => ({ ...prev, odds: e.target.value }))}
                    placeholder="-110"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Result</label>
                  <select
                    value={newBet.result}
                    onChange={(e) => setNewBet(prev => ({ ...prev, result: e.target.value as Bet["result"] }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="push">Push</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddBet} className="bg-primary hover:bg-primary/90">
                  Add Bet
                </Button>
                <Button onClick={() => setShowAddBet(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Form */}
        {showSettings && (
          <Card className="bg-card border-secondary/30 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-secondary">Bankroll Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Initial Bankroll ($)</label>
                  <input
                    type="number"
                    value={settings.initialBankroll}
                    onChange={(e) => setSettings(prev => ({ ...prev, initialBankroll: e.target.value }))}
                    placeholder="1000"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Risk % per Bet (Unit Size)</label>
                  <input
                    type="number"
                    value={settings.riskPercentage}
                    onChange={(e) => setSettings(prev => ({ ...prev, riskPercentage: e.target.value }))}
                    placeholder="1"
                    min="0.1"
                    max="100"
                    step="0.1"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Changing settings will reset your bankroll and clear all bets.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSaveSettings} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  Save & Reset
                </Button>
                <Button onClick={() => setShowSettings(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bet History */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Bet History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.bets.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No bets recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Add Bet" to start tracking</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.bets.map((bet) => (
                  <div key={bet.id} className="p-3 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{bet.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{formatCurrency(bet.amount)}</span>
                          <span>•</span>
                          <span>{formatOdds(bet.odds)}</span>
                          <span>•</span>
                          <span>{new Date(bet.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={bet.result}
                          onChange={(e) => updateBetResult(bet.id, e.target.value as Bet["result"])}
                          className={`text-xs px-2 py-1 rounded border ${
                            bet.result === "win" ? "bg-green-500/20 text-green-400 border-green-500/50" :
                            bet.result === "loss" ? "bg-red-500/20 text-red-400 border-red-500/50" :
                            bet.result === "push" ? "bg-gray-500/20 text-gray-400 border-gray-500/50" :
                            "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="push">Push</option>
                        </select>
                        <button
                          onClick={() => deleteBet(bet.id)}
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {bet.result === "win" && (
                      <p className="text-xs text-green-400 mt-1">
                        Won {formatCurrency(bet.payout - bet.amount)}
                      </p>
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
