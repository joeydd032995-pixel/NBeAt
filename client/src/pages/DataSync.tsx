import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DataSync() {
  const [syncInProgress, setSyncInProgress] = useState(false);

  const { data: syncStatus, refetch } = trpc.nba.getSyncStatus.useQuery();

  const syncMutation = trpc.nba.syncData.useMutation({
    onSuccess: (data) => {
      setSyncInProgress(false);
      toast.success(`Data sync complete! ${data.playersCount} players, ${data.teamsCount} teams`);
      refetch();
    },
    onError: () => {
      setSyncInProgress(false);
      toast.error("Data sync failed. Please try again.");
    },
  });

  const handleSync = async () => {
    setSyncInProgress(true);
    syncMutation.mutate();
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
              DATA SYNCHRONIZATION
            </h1>
            <p className="text-lg text-muted-foreground">
              Sync live 2025-26 NBA player statistics from balldontlie API
            </p>
          </div>

          {/* Sync Status Card */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Sync Status
              </CardTitle>
              <CardDescription>
                Keep your player database up-to-date with latest statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Display */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  {syncStatus?.needsSync ? (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {syncStatus?.needsSync ? "Sync Needed" : "Up to Date"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {syncStatus?.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sync Button */}
              <Button
                onClick={handleSync}
                disabled={syncInProgress || syncMutation.isPending}
                className="w-full py-6 text-lg"
              >
                {syncInProgress || syncMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Syncing Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Sync NBA Data Now
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                <h3 className="font-semibold text-secondary mb-2">What happens during sync?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Fetches all NBA players from balldontlie API</li>
                  <li>• Retrieves 2025-26 season statistics (PPG, RPG, APG, FG%)</li>
                  <li>• Updates team roster information</li>
                  <li>• Stores data in local database for fast access</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Stats Card */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Data Overview</CardTitle>
              <CardDescription>Current database statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary neon-glow-pink">
                    30
                  </div>
                  <div className="text-sm text-muted-foreground">NBA Teams</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-secondary neon-glow-blue">
                    500+
                  </div>
                  <div className="text-sm text-muted-foreground">Players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Info */}
          <Card className="bg-card/50 backdrop-blur border-accent/50">
            <CardHeader>
              <CardTitle className="text-accent">Automated Daily Refresh</CardTitle>
              <CardDescription>
                Your data is automatically refreshed daily at 6 AM CST
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The platform will automatically sync the latest NBA statistics every 24 hours. 
                You can also manually trigger a sync at any time using the button above.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
