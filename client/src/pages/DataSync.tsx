import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Loader2, Database, Zap, Clock } from "lucide-react";
import { toast } from "sonner";

export default function DataSync() {
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [forceRefreshing, setForceRefreshing] = useState(false);
  const [syncingRosters, setSyncingRosters] = useState(false);

  const { data: syncStatus, refetch: refetchSyncStatus } = trpc.nba.getSyncStatus.useQuery();
  const { data: scraperStatus, refetch: refetchScraperStatus } = trpc.nba.getScraperStatus.useQuery();

  // Quick refresh - uses cached JSON file first, then NBA API
  const refreshStatsMutation = trpc.nba.scrapeRealStats.useMutation({
    onSuccess: (data) => {
      setRefreshingStats(false);
      if (data.success) {
        toast.success(`Stats updated! ${data.playersCount} players refreshed (source: ${data.source})`);
        refetchSyncStatus();
        refetchScraperStatus();
      } else {
        toast.error(`Update failed: ${data.error}`);
      }
    },
    onError: (error) => {
      setRefreshingStats(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  // Force refresh - bypasses cache, fetches fresh from NBA API
  const forceRefreshMutation = trpc.nba.forceRefreshStats.useMutation({
    onSuccess: (data) => {
      setForceRefreshing(false);
      if (data.success) {
        toast.success(`Fresh stats fetched! ${data.playersCount} players updated from NBA API`);
        refetchSyncStatus();
        refetchScraperStatus();
      } else {
        toast.error(`Force refresh failed: ${data.error}`);
      }
    },
    onError: (error) => {
      setForceRefreshing(false);
      toast.error(`Error: ${error.message}`);
    },
  });

  // Sync rosters from ESPN (gets team rosters + matches with real stats)
  const syncRostersMutation = trpc.nba.syncData.useMutation({
    onSuccess: (data) => {
      setSyncingRosters(false);
      toast.success(`Roster sync complete! ${data.playersCount} players, ${data.teamsCount} teams`);
      refetchSyncStatus();
      refetchScraperStatus();
    },
    onError: () => {
      setSyncingRosters(false);
      toast.error("Roster sync failed. Please try again.");
    },
  });

  const handleRefreshStats = () => {
    setRefreshingStats(true);
    refreshStatsMutation.mutate();
  };

  const handleForceRefresh = () => {
    setForceRefreshing(true);
    forceRefreshMutation.mutate();
  };

  const handleSyncRosters = () => {
    setSyncingRosters(true);
    syncRostersMutation.mutate();
  };

  const isAnyLoading = refreshingStats || forceRefreshing || syncingRosters;

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
              Real 2025-26 NBA player statistics from official NBA API
            </p>
          </div>

          {/* Main Refresh Card */}
          <Card className="bg-card/50 backdrop-blur border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                NBA Statistics Refresh
              </CardTitle>
              <CardDescription>
                Update player stats with real 2025-26 season data from NBA.com
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Display */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  {scraperStatus?.jsonFileExists ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-semibold">Data Source</p>
                    <p className="text-sm text-muted-foreground">
                      {scraperStatus?.jsonPlayerCount 
                        ? `${scraperStatus.jsonPlayerCount} players in cache`
                        : "No cached data"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  {(scraperStatus?.playerCount ?? 0) > 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-semibold">Database</p>
                    <p className="text-sm text-muted-foreground">
                      {scraperStatus?.playerCount 
                        ? `${scraperStatus.playerCount} players with stats`
                        : "No player stats"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Action - Quick Refresh */}
              <Button
                onClick={handleRefreshStats}
                disabled={isAnyLoading}
                className="w-full py-6 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {refreshingStats ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Updating Stats...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refresh Player Stats
                  </>
                )}
              </Button>

              {/* Secondary Actions */}
              <div className="grid gap-4 md:grid-cols-2">
                <Button
                  onClick={handleForceRefresh}
                  disabled={isAnyLoading}
                  variant="outline"
                  className="py-4"
                >
                  {forceRefreshing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Fetching from NBA API...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Force Fresh Data
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSyncRosters}
                  disabled={isAnyLoading}
                  variant="outline"
                  className="py-4"
                >
                  {syncingRosters ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Syncing Rosters...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Sync Team Rosters
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <h3 className="font-semibold text-primary mb-2">How it works:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Refresh Stats:</strong> Updates from cached data or fetches fresh from NBA API</li>
                  <li>• <strong>Force Fresh:</strong> Bypasses cache, gets latest stats directly from NBA.com</li>
                  <li>• <strong>Sync Rosters:</strong> Updates team rosters from ESPN + matches with real stats</li>
                  <li>• All data is 100% real - no fake or generated statistics</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Overview Card */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Data Overview</CardTitle>
              <CardDescription>Current database statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary neon-glow-pink">
                    30
                  </div>
                  <div className="text-sm text-muted-foreground">NBA Teams</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-secondary neon-glow-blue">
                    {scraperStatus?.jsonPlayerCount || "500+"}
                  </div>
                  <div className="text-sm text-muted-foreground">Players</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-accent">
                    32
                  </div>
                  <div className="text-sm text-muted-foreground">Max Games</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Info */}
          <Card className="bg-card/50 backdrop-blur border-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Clock className="w-5 h-5" />
                Automated Daily Refresh
              </CardTitle>
              <CardDescription>
                Stats are automatically refreshed daily at 6 AM CST
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The platform automatically syncs the latest NBA statistics every 24 hours after games complete. 
                Use the buttons above to manually refresh at any time for the most current data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
