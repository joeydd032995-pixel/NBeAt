import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ParlayBuilder() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary neon-glow-pink mb-8">PARLAY BUILDER</h1>
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Build Tickets 1-9</CardTitle>
              <CardDescription>Floor, Sharp Spread, Core Over, Chaos</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
