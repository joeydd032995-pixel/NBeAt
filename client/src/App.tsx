import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PlayerStats from "./pages/PlayerStats";
import PlayerComparison from "./pages/PlayerComparison";
import StatTrends from "./pages/StatTrends";
import TeamAnalytics from "./pages/TeamAnalytics";
import LiveOdds from "./pages/LiveOdds";
import RosterVerification from "./pages/RosterVerification";
import ParlayBuilder from "./pages/ParlayBuilder";
import BankrollManager from "./pages/BankrollManager";
import MarketAnalysis from "./pages/MarketAnalysis";
import PerformanceAnalytics from "./pages/PerformanceAnalytics";
import DataSync from "./pages/DataSync";
import { PropAnalyzer } from "./pages/PropAnalyzer";
import { InjuryReport } from "./pages/InjuryReport";
import { CustomAlerts } from "./pages/CustomAlerts";
import AIAssistant from "./pages/AIAssistant";
import PropsAnalytics from "./pages/PropsAnalytics";
import BettingAnalyzer from "./pages/BettingAnalyzer";
import GameDashboard from "./pages/GameDashboard";
import GameProps from "./pages/GameProps";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/betting-analyzer"} component={BettingAnalyzer} />
      <Route path={"/game-dashboard"} component={GameDashboard} />
      <Route path={"/game-props"} component={GameProps} />
      <Route path={"/game-props/:gameId"} component={GameProps} />
      <Route path={"/player-stats"} component={PlayerStats} />
      <Route path={"/player-comparison"} component={PlayerComparison} />
      <Route path={"/stat-trends"} component={StatTrends} />
      <Route path={"/team-analytics"} component={TeamAnalytics} />
      <Route path={"/live-odds"} component={LiveOdds} />
      <Route path={"/roster-verification"} component={RosterVerification} />
      <Route path={"/parlay-builder"} component={ParlayBuilder} />
      <Route path={"/bankroll-manager"} component={BankrollManager} />
      <Route path={"/market-analysis"} component={MarketAnalysis} />
      <Route path={"/performance"} component={PerformanceAnalytics} />
      <Route path={"/data-sync"} component={DataSync} />
      <Route path={"/prop-analyzer"} component={PropAnalyzer} />
      <Route path={"/props-analytics"} component={PropsAnalytics} />
      <Route path={"/injury-report"} component={InjuryReport} />
      <Route path={"/custom-alerts"} component={CustomAlerts} />
      <Route path={"/ai-assistant"} component={AIAssistant} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
