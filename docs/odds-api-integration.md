# The Odds API Integration Notes

## Overview
- **Free Tier**: 500 credits/month
- **Host**: `https://api.the-odds-api.com`
- **NBA Sport Key**: `basketball_nba`

## Key Endpoints

### 1. GET /v4/sports
- Returns list of in-season sports
- Does NOT count against quota
- Use to verify NBA is active

### 2. GET /v4/sports/{sport}/odds
- Returns odds for upcoming events
- **Parameters**:
  - `apiKey`: Your API key
  - `regions`: `us` (US bookmakers like DraftKings, FanDuel, BetMGM)
  - `markets`: `h2h` (moneyline), `spreads`, `totals`
  - `oddsFormat`: `american` or `decimal`

### 3. Example NBA Request
```
GET https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=YOUR_KEY&regions=us&markets=h2h,spreads,totals&oddsFormat=american
```

### 4. Response Format
```json
{
  "id": "unique_event_id",
  "sport_key": "basketball_nba",
  "commence_time": "2025-12-19T20:00:00Z",
  "home_team": "Los Angeles Lakers",
  "away_team": "Boston Celtics",
  "bookmakers": [
    {
      "key": "fanduel",
      "title": "FanDuel",
      "last_update": "2025-12-19T02:00:00Z",
      "markets": [
        {
          "key": "h2h",
          "outcomes": [
            { "name": "Los Angeles Lakers", "price": -150 },
            { "name": "Boston Celtics", "price": +130 }
          ]
        },
        {
          "key": "spreads",
          "outcomes": [
            { "name": "Los Angeles Lakers", "price": -110, "point": -3.5 },
            { "name": "Boston Celtics", "price": -110, "point": +3.5 }
          ]
        },
        {
          "key": "totals",
          "outcomes": [
            { "name": "Over", "price": -110, "point": 220.5 },
            { "name": "Under", "price": -110, "point": 220.5 }
          ]
        }
      ]
    }
  ]
}
```

## Implementation Plan
1. Request API key from user via `webdev_request_secrets`
2. Create odds service in `server/oddsService.ts`
3. Add tRPC endpoints for fetching NBA odds
4. Display odds alongside player stats
5. Cache odds data to minimize API calls (free tier has 500 credits/month limit)

## Bookmakers Covered
- DraftKings
- FanDuel
- BetMGM
- Caesars
- Bovada
- MyBookie.ag
