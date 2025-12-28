import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ParlayLeg {
  id: string;
  game: string;
  betType: "moneyline" | "spread" | "total" | "prop";
  selection: string;
  odds: number;
  stake?: number;
}

export default function ParlayBuilder() {
  const [legs, setLegs] = useState<ParlayLeg[]>([]);
  const [stake, setStake] = useState<number>(100);
  const [newLeg, setNewLeg] = useState<Partial<ParlayLeg>>({
    betType: "moneyline",
    odds: -110
  });

  // Fetch live odds for game selection
  const { data: liveOdds } = trpc.odds.getNBAOdds.useQuery();

  const addLeg = () => {
    if (newLeg.game && newLeg.selection && newLeg.odds) {
      const leg: ParlayLeg = {
        id: Date.now().toString(),
        game: newLeg.game,
        betType: newLeg.betType || "moneyline",
        selection: newLeg.selection,
        odds: newLeg.odds
      };
      setLegs([...legs, leg]);
      setNewLeg({ betType: "moneyline", odds: -110 });
    }
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter(leg => leg.id !== id));
  };

  // Calculate parlay odds
  const calculateParlayOdds = (): number => {
    if (legs.length === 0) return 0;
    
    let totalDecimalOdds = 1;
    for (const leg of legs) {
      const decimalOdds = americanToDecimal(leg.odds);
      totalDecimalOdds *= decimalOdds;
    }
    
    return decimalToAmerican(totalDecimalOdds);
  };

  // Convert American odds to decimal
  const americanToDecimal = (american: number): number => {
    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  };

  // Convert decimal odds to American
  const decimalToAmerican = (decimal: number): number => {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  };

  // Calculate potential payout
  const calculatePayout = (): number => {
    if (legs.length === 0) return 0;
    
    const parlayOdds = calculateParlayOdds();
    const decimalOdds = americanToDecimal(parlayOdds);
    
    return stake * decimalOdds;
  };

  // Calculate profit
  const calculateProfit = (): number => {
    return calculatePayout() - stake;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-primary  mb-2">PARLAY BUILDER</h1>
          <p className="text-muted-foreground mb-8">Build multi-leg parlays and calculate potential payouts</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Leg Section */}
            <div className="lg:col-span-2">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-secondary">Add Parlay Leg</CardTitle>
                  <CardDescription>Select a game and bet type to add to your parlay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Game</Label>
                      <Select
                        value={newLeg.game}
                        onValueChange={(value) => setNewLeg({ ...newLeg, game: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select game" />
                        </SelectTrigger>
                        <SelectContent>
                          {liveOdds?.slice(0, 10).map((game: any, idx: number) => (
                            <SelectItem key={idx} value={`${game.homeTeam} vs ${game.awayTeam}`}>
                              {game.homeTeam} vs {game.awayTeam}
                            </SelectItem>
                          ))}
                          <SelectItem value="Custom">Custom Game</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Bet Type</Label>
                      <Select
                        value={newLeg.betType}
                        onValueChange={(value: any) => setNewLeg({ ...newLeg, betType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="moneyline">Moneyline</SelectItem>
                          <SelectItem value="spread">Spread</SelectItem>
                          <SelectItem value="total">Total (O/U)</SelectItem>
                          <SelectItem value="prop">Player Prop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Selection</Label>
                      <Input
                        placeholder="e.g., Lakers -5.5"
                        value={newLeg.selection || ""}
                        onChange={(e) => setNewLeg({ ...newLeg, selection: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Odds (American)</Label>
                      <Input
                        type="number"
                        placeholder="-110"
                        value={newLeg.odds || ""}
                        onChange={(e) => setNewLeg({ ...newLeg, odds: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <Button onClick={addLeg} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Leg to Parlay
                  </Button>
                </CardContent>
              </Card>

              {/* Current Legs */}
              {legs.length > 0 && (
                <Card className="bg-card/50 backdrop-blur mt-6">
                  <CardHeader>
                    <CardTitle className="text-accent">Parlay Legs ({legs.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {legs.map((leg) => (
                      <div
                        key={leg.id}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{leg.game}</div>
                          <div className="text-sm text-muted-foreground">
                            {leg.betType.toUpperCase()}: {leg.selection}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-mono font-semibold text-secondary">
                              {leg.odds > 0 ? '+' : ''}{leg.odds}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {americanToDecimal(leg.odds).toFixed(2)}x
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLeg(leg.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Parlay Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-card/50 backdrop-blur sticky top-8">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Parlay Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Stake Amount</Label>
                    <Input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Number of Legs:</span>
                      <span className="font-semibold">{legs.length}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parlay Odds:</span>
                      <span className="font-mono font-semibold text-secondary">
                        {legs.length > 0 ? (
                          <>
                            {calculateParlayOdds() > 0 ? '+' : ''}
                            {calculateParlayOdds()}
                          </>
                        ) : '-'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stake:</span>
                      <span className="font-semibold">${stake.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-lg pt-2 border-t border-border">
                      <span className="font-semibold">Potential Payout:</span>
                      <span className="font-bold text-primary">
                        ${calculatePayout().toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit:</span>
                      <span className="font-semibold text-accent">
                        +${calculateProfit().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {legs.length > 0 && (
                    <Button className="w-full mt-4" size="lg">
                      Place Parlay Bet
                    </Button>
                  )}

                  {legs.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Add legs to your parlay to see potential payout
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
