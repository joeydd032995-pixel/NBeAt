import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Zap, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  description: string;
  probability: number;
  odds: number;
  evPercent: number;
  confidence: "high" | "medium" | "low";
  timestamp: Date;
}

export default function OpportunitiesDashboard() {
  const [selectedConfidence, setSelectedConfidence] = useState<"all" | "high" | "medium" | "low">("all");

  const { data: opportunities, isLoading, refetch } = trpc.opportunities.getRanked.useQuery();

  const detectMutation = trpc.opportunities.detectHighEV.useMutation({
    onSuccess: () => {
      toast.success("Opportunity detection complete!");
      refetch();
    },
    onError: () => {
      toast.error("Detection failed. Please try again.");
    },
  });

  const filteredOpportunities = opportunities?.filter((opp: any) => {
    if (selectedConfidence === "all") return true;
    return opp.confidence === selectedConfidence;
  }) || [];

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default:
        return "";
    }
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

        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-primary neon-glow-pink">
              HIGH-EV OPPORTUNITIES
            </h1>
            <p className="text-lg text-muted-foreground">
              Real-time detection of profitable betting opportunities
            </p>
          </div>

          {/* Control Panel */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Opportunity Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => detectMutation.mutate()}
                disabled={detectMutation.isPending}
                className="w-full py-6 text-lg"
              >
                {detectMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Scanning Markets...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Detect High-EV Opportunities
                  </>
                )}
              </Button>

              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "high", "medium", "low"] as const).map((level: any) => (
                  <Button
                    key={level}
                    variant={selectedConfidence === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedConfidence(level)}
                    className="capitalize"
                  >
                    {level === "all" ? "All" : `${level} Confidence`}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Opportunities List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="py-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((opp: any) => (
                <Card
                  key={opp.id}
                  className="bg-card/50 backdrop-blur hover:border-primary/50 transition-all"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{opp.description}</h3>
                          <Badge className={`${getConfidenceBadgeColor(opp.confidence)} capitalize`}>
                            {opp.confidence}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Probability</p>
                            <p className="text-lg font-semibold text-secondary">
                              {(opp.probability * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Decimal Odds</p>
                            <p className="text-lg font-semibold">{opp.odds.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Expected Value</p>
                            <p className="text-lg font-semibold text-primary neon-glow-pink">
                              +{opp.evPercent.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Detected</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(opp.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" className="whitespace-nowrap">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analyze
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {selectedConfidence === "all"
                      ? "No high-EV opportunities detected. Click the button above to scan markets."
                      : `No ${selectedConfidence} confidence opportunities found.`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stats Summary */}
          {opportunities && opportunities.length > 0 && (
            <Card className="bg-card/50 backdrop-blur border-accent/50">
              <CardHeader>
                <CardTitle>Opportunity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{opportunities.length}</p>
                    <p className="text-sm text-muted-foreground">Total Opportunities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-500">
                      {opportunities.filter((o: any) => o.confidence === "high").length}
                    </p>
                    <p className="text-sm text-muted-foreground">High Confidence</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-secondary">
                      {(
                        opportunities.reduce((sum: number, o: any) => sum + o.evPercent, 0) / opportunities.length
                      ).toFixed(2)}
                      %
                    </p>
                    <p className="text-sm text-muted-foreground">Avg EV</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-accent">
                      {Math.max(...opportunities.map((o: any) => o.evPercent)).toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Best EV</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
