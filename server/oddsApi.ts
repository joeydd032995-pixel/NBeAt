// The Odds API Integration for NBA Games and Betting Lines

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

export interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface PlayerProp {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: PropBookmaker[];
}

export interface PropBookmaker {
  key: string;
  title: string;
  markets: PropMarket[];
}

export interface PropMarket {
  key: string;
  last_update: string;
  outcomes: PropOutcome[];
}

export interface PropOutcome {
  name: string;
  description: string;
  price: number;
  point?: number;
}

// Fetch today's NBA games
export async function getTodaysGames(): Promise<Game[]> {
  if (!ODDS_API_KEY) {
    console.error("[Odds API] No API key configured");
    return [];
  }

  try {
    const url = `${ODDS_API_BASE}/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    
    console.log("[Odds API] Fetching today's NBA games...");
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Odds API] Error: ${response.status} - ${errorText}`);
      return [];
    }

    const games: Game[] = await response.json();
    
    // Filter to only today's games (within next 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const todaysGames = games.filter(game => {
      const gameTime = new Date(game.commence_time);
      return gameTime >= now && gameTime <= tomorrow;
    });

    console.log(`[Odds API] Found ${todaysGames.length} games today (${games.length} total upcoming)`);
    
    // Log remaining API requests from headers
    const remaining = response.headers.get('x-requests-remaining');
    const used = response.headers.get('x-requests-used');
    console.log(`[Odds API] Requests - Used: ${used}, Remaining: ${remaining}`);

    return todaysGames;
  } catch (error) {
    console.error("[Odds API] Failed to fetch games:", error);
    return [];
  }
}

// Fetch all upcoming NBA games (not just today)
export async function getUpcomingGames(): Promise<Game[]> {
  if (!ODDS_API_KEY) {
    console.error("[Odds API] No API key configured");
    return [];
  }

  try {
    const url = `${ODDS_API_BASE}/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    
    console.log("[Odds API] Fetching upcoming NBA games...");
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Odds API] Error: ${response.status} - ${errorText}`);
      return [];
    }

    const games: Game[] = await response.json();
    console.log(`[Odds API] Found ${games.length} upcoming games`);
    
    return games;
  } catch (error) {
    console.error("[Odds API] Failed to fetch games:", error);
    return [];
  }
}

// Fetch player props for a specific game
export async function getPlayerProps(eventId: string, market: string = "player_points"): Promise<PlayerProp | null> {
  if (!ODDS_API_KEY) {
    console.error("[Odds API] No API key configured");
    return null;
  }

  try {
    // Available markets: player_points, player_rebounds, player_assists, player_threes, player_blocks, player_steals, player_points_rebounds_assists
    const url = `${ODDS_API_BASE}/sports/basketball_nba/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${market}&oddsFormat=american`;
    
    console.log(`[Odds API] Fetching ${market} props for event ${eventId}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Odds API] Error: ${response.status} - ${errorText}`);
      return null;
    }

    const props: PlayerProp = await response.json();
    return props;
  } catch (error) {
    console.error("[Odds API] Failed to fetch player props:", error);
    return null;
  }
}

// Fetch multiple prop markets for a game
export async function getAllPlayerProps(eventId: string): Promise<PlayerProp | null> {
  if (!ODDS_API_KEY) {
    console.error("[Odds API] No API key configured");
    return null;
  }

  try {
    const markets = [
      "player_points",
      "player_rebounds", 
      "player_assists",
      "player_threes",
      "player_points_rebounds_assists"
    ].join(",");
    
    const url = `${ODDS_API_BASE}/sports/basketball_nba/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${markets}&oddsFormat=american`;
    
    console.log(`[Odds API] Fetching all player props for event ${eventId}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Odds API] Error: ${response.status} - ${errorText}`);
      return null;
    }

    const props: PlayerProp = await response.json();
    return props;
  } catch (error) {
    console.error("[Odds API] Failed to fetch player props:", error);
    return null;
  }
}

// Get formatted game info for display
export function formatGameForDisplay(game: Game) {
  const gameTime = new Date(game.commence_time);
  const timeStr = gameTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const dateStr = gameTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Extract odds from first bookmaker if available
  let spread = null;
  let total = null;
  let moneyline = null;

  if (game.bookmakers && game.bookmakers.length > 0) {
    const bookmaker = game.bookmakers[0];
    
    for (const market of bookmaker.markets) {
      if (market.key === 'spreads') {
        const homeSpread = market.outcomes.find(o => o.name === game.home_team);
        if (homeSpread) {
          spread = {
            home: homeSpread.point,
            away: homeSpread.point ? -homeSpread.point : null
          };
        }
      }
      if (market.key === 'totals') {
        const over = market.outcomes.find(o => o.name === 'Over');
        if (over) {
          total = over.point;
        }
      }
      if (market.key === 'h2h') {
        const homeML = market.outcomes.find(o => o.name === game.home_team);
        const awayML = market.outcomes.find(o => o.name === game.away_team);
        if (homeML && awayML) {
          moneyline = {
            home: homeML.price,
            away: awayML.price
          };
        }
      }
    }
  }

  return {
    id: game.id,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    gameTime: game.commence_time,
    displayTime: timeStr,
    displayDate: dateStr,
    spread,
    total,
    moneyline
  };
}

// Test the API connection
export async function testOddsApiConnection(): Promise<boolean> {
  if (!ODDS_API_KEY) {
    console.error("[Odds API] No API key configured - set ODDS_API_KEY environment variable");
    return false;
  }

  try {
    const url = `${ODDS_API_BASE}/sports/?apiKey=${ODDS_API_KEY}`;
    const response = await fetch(url);
    
    if (response.ok) {
      console.log("[Odds API] Connection successful!");
      const remaining = response.headers.get('x-requests-remaining');
      console.log(`[Odds API] Requests remaining: ${remaining}`);
      return true;
    } else {
      console.error(`[Odds API] Connection failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("[Odds API] Connection test failed:", error);
    return false;
  }
}
