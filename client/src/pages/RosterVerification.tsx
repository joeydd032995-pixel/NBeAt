import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function RosterVerification() {
  const [playerName, setPlayerName] = useState("");
  const [teamAbbr, setTeamAbbr] = useState("");

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
              ROSTER VERIFICATION
            </h1>
            <p className="text-lg text-muted-foreground">
              Validate player-team assignments with real-time data
            </p>
          </div>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Verify Player Roster</CardTitle>
              <CardDescription>Check if a player is on the expected team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Player name (e.g., Luka Doncic)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <Input
                placeholder="Team abbreviation (e.g., DAL)"
                value={teamAbbr}
                onChange={(e) => setTeamAbbr(e.target.value)}
              />
              <Button className="w-full">Verify Roster</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
