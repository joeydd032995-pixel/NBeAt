import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function MarketAnalysis() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-primary neon-glow-pink mb-8">MARKET ANALYSIS</h1>
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Analyze Markets</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
