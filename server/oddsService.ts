import { ENV } from "./_core/env";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const NBA_SPORT_KEY = "basketball_nba";

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsMarket {
  key: string; // 'h2h', 'spreads', 'totals'
  outcomes: OddsOutcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface NBAGame {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

/**
 * Fetch live NBA odds from The Odds API
 */
export async function fetchNBAOdds(): Promise<NBAGame[]> {
  const apiKey = ENV.oddsApiKey;
  if (!apiKey) {
    throw new Error("ODDS_API_KEY not configured");
  }

  const url = `${ODDS_API_BASE}/sports/${NBA_SPORT_KEY}/odds?` + new URLSearchParams({
    apiKey,
    regions: "us",
    markets: "h2h,spreads,totals",
    oddsFormat: "american",
  });

  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Odds API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Get odds for a specific team's next game
 */
export async function getTeamNextGameOdds(teamName: string): Promise<NBAGame | null> {
  const games = await fetchNBAOdds();
  
  // Find game where team is home or away
  const game = games.find(
    g => g.home_team.toLowerCase().includes(teamName.toLowerCase()) ||
         g.away_team.toLowerCase().includes(teamName.toLowerCase())
  );

  return game || null;
}

/**
 * Get best odds across all bookmakers for a specific game
 */
export function getBestOdds(game: NBAGame) {
  const bestOdds: {
    moneyline: { home: number; away: number; bookmaker: string };
    spread: { home: { line: number; odds: number }; away: { line: number; odds: number }; bookmaker: string };
    total: { over: { line: number; odds: number }; under: { line: number; odds: number }; bookmaker: string };
  } = {
    moneyline: { home: 0, away: 0, bookmaker: "" },
    spread: { home: { line: 0, odds: 0 }, away: { line: 0, odds: 0 }, bookmaker: "" },
    total: { over: { line: 0, odds: 0 }, under: { line: 0, odds: 0 }, bookmaker: "" },
  };

  for (const bookmaker of game.bookmakers) {
    // Moneyline (h2h)
    const h2hMarket = bookmaker.markets.find(m => m.key === "h2h");
    if (h2hMarket) {
      const homeOutcome = h2hMarket.outcomes.find(o => o.name === game.home_team);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === game.away_team);
      
      if (homeOutcome && (!bestOdds.moneyline.home || homeOutcome.price > bestOdds.moneyline.home)) {
        bestOdds.moneyline.home = homeOutcome.price;
        bestOdds.moneyline.bookmaker = bookmaker.title;
      }
      if (awayOutcome && (!bestOdds.moneyline.away || awayOutcome.price > bestOdds.moneyline.away)) {
        bestOdds.moneyline.away = awayOutcome.price;
        bestOdds.moneyline.bookmaker = bookmaker.title;
      }
    }

    // Spreads
    const spreadsMarket = bookmaker.markets.find(m => m.key === "spreads");
    if (spreadsMarket) {
      const homeOutcome = spreadsMarket.outcomes.find(o => o.name === game.home_team);
      const awayOutcome = spreadsMarket.outcomes.find(o => o.name === game.away_team);
      
      if (homeOutcome && homeOutcome.point !== undefined) {
        if (!bestOdds.spread.home.odds || homeOutcome.price > bestOdds.spread.home.odds) {
          bestOdds.spread.home = { line: homeOutcome.point, odds: homeOutcome.price };
          bestOdds.spread.bookmaker = bookmaker.title;
        }
      }
      if (awayOutcome && awayOutcome.point !== undefined) {
        if (!bestOdds.spread.away.odds || awayOutcome.price > bestOdds.spread.away.odds) {
          bestOdds.spread.away = { line: awayOutcome.point, odds: awayOutcome.price };
          bestOdds.spread.bookmaker = bookmaker.title;
        }
      }
    }

    // Totals
    const totalsMarket = bookmaker.markets.find(m => m.key === "totals");
    if (totalsMarket) {
      const overOutcome = totalsMarket.outcomes.find(o => o.name === "Over");
      const underOutcome = totalsMarket.outcomes.find(o => o.name === "Under");
      
      if (overOutcome && overOutcome.point !== undefined) {
        if (!bestOdds.total.over.odds || overOutcome.price > bestOdds.total.over.odds) {
          bestOdds.total.over = { line: overOutcome.point, odds: overOutcome.price };
          bestOdds.total.bookmaker = bookmaker.title;
        }
      }
      if (underOutcome && underOutcome.point !== undefined) {
        if (!bestOdds.total.under.odds || underOutcome.price > bestOdds.total.under.odds) {
          bestOdds.total.under = { line: underOutcome.point, odds: underOutcome.price };
          bestOdds.total.bookmaker = bookmaker.title;
        }
      }
    }
  }

  return bestOdds;
}

/**
 * Verify API key is valid by fetching sports list (doesn't count against quota)
 */
export async function verifyOddsAPIKey(): Promise<boolean> {
  const apiKey = ENV.oddsApiKey;
  if (!apiKey) return false;

  try {
    const url = `${ODDS_API_BASE}/sports?apiKey=${apiKey}`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error("Error verifying Odds API key:", error);
    return false;
  }
}
