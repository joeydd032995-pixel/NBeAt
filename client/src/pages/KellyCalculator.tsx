import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calculator } from "lucide-react";
import { toast } from "sonner";

export default function KellyCalculator() {
  const [probability, setProbability] = useState("");
  const [decimalOdds, setDecimalOdds] = useState("");
  const [bankroll, setBankroll] = useState("");
  const [kellyMultiplier, setKellyMultiplier] = useState("0.25");

  const calculateKelly = trpc.betting.calculateKelly.useMutation({
    onSuccess: (data) => {
      toast.success("Kelly calculation complete!");
    },
    onError: () => {
      toast.error("Calculation failed. Please check your inputs.");
    },
  });

  const handleCalculate = () => {
    const prob = parseFloat(probability);
    const odds = parseFloat(decimalOdds);
    const bank = parseFloat(bankroll);
    const kelly = parseFloat(kellyMultiplier);

    if (isNaN(prob) || isNaN(odds) || isNaN(bank) || isNaN(kelly)) {
      toast.error("Please enter valid numbers");
      return;
    }

    if (prob < 0 || prob > 1) {
      toast.error("Probability must be between 0 and 1");
      return;
    }

    calculateKelly.mutate({
      probability: prob,
      decimalOdds: odds,
      bankroll: bank,
      kellyMultiplier: kelly,
    });
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

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary neon-glow-pink">
              KELLY CALCULATOR
            </h1>
            <p className="text-lg text-muted-foreground">
              Optimal bet sizing with fractional Kelly multiplier support
            </p>
          </div>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Kelly Criterion Calculator
              </CardTitle>
              <CardDescription>
                Calculate optimal stake based on your edge and bankroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Win Probability (0-1)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.60"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Decimal Odds</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2.50"
                  value={decimalOdds}
                  onChange={(e) => setDecimalOdds(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Bankroll ($)</label>
                <Input
                  type="number"
                  step="100"
                  placeholder="10000"
                  value={bankroll}
                  onChange={(e) => setBankroll(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kelly Multiplier (0-1)</label>
                <Input
                  type="number"
                  step="0.05"
                  placeholder="0.25"
                  value={kellyMultiplier}
                  onChange={(e) => setKellyMultiplier(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 0.25 for conservative, 0.5 for moderate, 1.0 for full Kelly
                </p>
              </div>
              <Button onClick={handleCalculate} className="w-full" disabled={calculateKelly.isPending}>
                {calculateKelly.isPending ? "Calculating..." : "Calculate Stake"}
              </Button>
            </CardContent>
          </Card>

          {calculateKelly.data && (
            <Card className="bg-card/50 backdrop-blur border-primary/50">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-primary neon-glow-pink">
                      ${calculateKelly.data.stake.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground tracking-wide">
                      RECOMMENDED STAKE
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-secondary neon-glow-blue">
                      {calculateKelly.data.evPercent.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground tracking-wide">
                      EXPECTED VALUE
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    Kelly Fraction: {(calculateKelly.data.kellyFraction * 100).toFixed(2)}% of bankroll
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
