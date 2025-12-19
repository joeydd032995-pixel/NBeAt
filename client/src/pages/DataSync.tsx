import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DataSync() {
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [populatingStats, setPopulatingStats] = useState(false);
  const [scrapingRealStats, setScrapingRealStats] = useState(false);

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

  const populateStatsMutation = trpc.nba.populateStats.useMutation({
    onSuccess: (data) => {
      setPopulatingStats(false);
      toast.success(`Stats populated! ${data.updated} players updated with accurate 2025-26 season data`);
      refetch();
    },
    onError: () => {
      setPopulatingStats(false);
      toast.error("Stats population failed. Please try again.");
    },
  });

  const scrapeRealStatsMutation = trpc.nba.scrapeRealStats.useMutation({
    onSuccess: (data) => {
      setScrapingRealStats(false);
      if (data.success) {
        toast.success(`Real stats scraped! ${data.playersCount} players updated from Basketball Reference (${data.source} scraper)`);
        refetch();
      } else {
        toast.error(`Scraping failed: ${data.error}`);
      }
    },
    onError: (error) => {
      setScrapingRealStats(false);
      toast.error(`Scraping error: ${error.message}`);
    },
  });

  const { data: scraperStatus } = trpc.nba.getScraperStatus.useQuery();

  const handleSync = async () => {
    setSyncInProgress(true);
    syncMutation.mutate();
  };

  const handlePopulateStats = async () => {
    setPopulatingStats(true);
    populateStatsMutation.mutate();
  };

  const handleScrapeRealStats = async () => {
    setScrapingRealStats(true);
    scrapeRealStatsMutation.mutate();
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
              Sync live 2025-26 NBA player statistics and real data
            </p>
          </div>

          {/* Real Stats Scraper Card */}
          <Card className="bg-card/50 backdrop-blur border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Real NBA Statistics (Basketball Reference)
              </CardTitle>
              <CardDescription>
                Scrape authentic 2025-26 season player stats with fallback support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scraper Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">Scraper Status</p>
                    <p className="text-sm text-muted-foreground">
                      {scraperStatus?.message || "Loading status..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrape Button */}
              <Button
                onClick={handleScrapeRealStats}
                disabled={scrapingRealStats || scrapeRealStatsMutation.isPending}
                className="w-full py-6 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {scrapingRealStats || scrapeRealStatsMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Scraping Real Stats (Node.js/Python)...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Scrape Real NBA Stats Now
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <h3 className="font-semibold text-primary mb-2">How it works:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Uses Node.js scraper (primary) with Python fallback</li>
                  <li>• Fetches real 2025-26 season stats from Basketball Reference</li>
                  <li>• Accurate games played (15-28 games), PPG, RPG, APG, and 20+ advanced stats</li>
                  <li>• Updates database with verified player statistics</li>
                </ul>
              </div>
            </CardContent>
          </Card>

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
                You can also manually trigger a sync at any time using the buttons above.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
