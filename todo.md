# NBA Betting Analytics Platform - TODO

## Database Schema
- [x] Create players table for NBA player data
- [x] Create teams table for NBA team information
- [x] Create bets table for historical betting records
- [x] Create parlays table for parlay tracking
- [x] Create notifications table for high-EV alerts

## Backend Services & API Integration
- [x] Implement balldontlie.io API integration for player stats
- [x] Implement CBS Sports roster scraping service
- [x] Create data refresh service for daily updates
- [x] Build Kelly criterion calculator service
- [x] Build EV calculator service
- [x] Build odds converter service (decimal, American, implied probability)
- [x] Build parlay ticket generator (tickets 1-9: Floor, Sharp Spread, Core Over, Chaos)

## tRPC API Endpoints
- [x] Player stats endpoint (fetch live 2025-26 data)
- [x] Roster verification endpoint
- [x] Parlay builder endpoint (3-6 leg combinations)
- [x] Bankroll management endpoints
- [x] Market analysis endpoints (spreads, totals, props)
- [x] Historical data endpoints (betting performance, outcomes)
- [x] Notification endpoints (high-EV alerts)

## Frontend UI - Neon-Noir Design
- [x] Apply midnight navy background with neon accents
- [x] Implement hot pink headlines with electric blue glow
- [x] Add cyan/magenta vertical accent lines
- [x] Design Player Stats Analysis page
- [x] Design Roster Verification page
- [x] Design Parlay Builder page (tickets 1-9)
- [x] Design Kelly Calculator page
- [x] Design Bankroll Manager page
- [x] Design Market Analysis page
- [x] Design Performance Analytics dashboard

## LLM Features
- [x] Implement LLM-powered betting strategy chatbot
- [x] Add Kelly criterion explanation feature
- [x] Add personalized recommendations based on bankroll/risk

## Automation & Notifications
- [ ] Set up automated daily data refresh
- [ ] Implement high-EV opportunity detection
- [ ] Implement player stats change notifications
- [ ] Create owner notification system

## Testing & Deployment
- [x] Write vitest tests for all backend services
- [x] Test all API endpoints
- [x] Test frontend UI components
- [ ] Create checkpoint
- [ ] Deploy to Vercel
