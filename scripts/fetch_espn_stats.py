#!/usr/bin/env python3
"""
Fetch real 2025-26 NBA season statistics from ESPN
Uses ESPN's public API endpoints for player statistics
"""

import json
import sys
import requests
from datetime import datetime

def fetch_espn_stats():
    """
    Fetch real 2025-26 season player statistics from ESPN
    Returns list of player stats dictionaries
    """
    try:
        print("[ESPN API] Starting real NBA stats fetch from ESPN...", file=sys.stderr)
        
        # ESPN stats endpoint for 2025-26 season
        # This endpoint provides per-game stats for all players
        url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/statistics"
        
        print(f"[ESPN API] Fetching from {url}", file=sys.stderr)
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"[ESPN API] Successfully retrieved data from ESPN", file=sys.stderr)
        
        # Try alternative ESPN endpoint for player stats
        # Using ESPN's athlete stats endpoint
        player_stats_list = []
        
        # Fetch from ESPN's player stats API
        teams_url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams"
        teams_response = requests.get(teams_url, headers=headers, timeout=30)
        teams_data = teams_response.json()
        
        print(f"[ESPN API] Found {len(teams_data.get('teams', []))} teams", file=sys.stderr)
        
        for team in teams_data.get('teams', []):
            team_id = team.get('id')
            team_abbr = team.get('abbreviation', 'UNK')
            
            # Get team roster with stats
            team_url = f"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{team_id}"
            try:
                team_response = requests.get(team_url, headers=headers, timeout=30)
                team_response.raise_for_status()
                team_data = team_response.json()
                
                # Extract athletes (players)
                athletes = team_data.get('athletes', [])
                print(f"[ESPN API] Processing {len(athletes)} players from {team_abbr}", file=sys.stderr)
                
                for athlete in athletes:
                    try:
                        full_name = athlete.get('displayName', '')
                        if not full_name:
                            continue
                        
                        position = athlete.get('position', {}).get('abbreviation', 'G')
                        stats = athlete.get('stats', [])
                        
                        if not stats:
                            continue
                        
                        # Find the stats object (usually index 0)
                        stat_data = stats[0] if stats else {}
                        
                        # Extract per-game stats
                        stat = {
                            'fullName': full_name,
                            'position': position or 'G',
                            'team': team_abbr,
                            'gamesPlayed': int(stat_data.get('gamesPlayed', 0) or 0),
                            'ppg': float(stat_data.get('avgPoints', 0) or 0),
                            'rpg': float(stat_data.get('avgRebounds', 0) or 0),
                            'apg': float(stat_data.get('avgAssists', 0) or 0),
                            'fgPct': float(stat_data.get('fieldGoalsPercentage', 0) or 0),
                            'fgm': float(stat_data.get('avgFieldGoals', 0) or 0),
                            'fga': float(stat_data.get('avgFieldGoalsAttempted', 0) or 0),
                            'ftPct': float(stat_data.get('freeThrowsPercentage', 0) or 0),
                            'ftm': float(stat_data.get('avgFreeThrows', 0) or 0),
                            'fta': float(stat_data.get('avgFreeThrowsAttempted', 0) or 0),
                            'tpPct': float(stat_data.get('threePointersPercentage', 0) or 0),
                            'tpm': float(stat_data.get('avgThreePointers', 0) or 0),
                            'tpa': float(stat_data.get('avgThreePointersAttempted', 0) or 0),
                            'orpg': float(stat_data.get('avgOffensiveRebounds', 0) or 0),
                            'drpg': float(stat_data.get('avgDefensiveRebounds', 0) or 0),
                            'spg': float(stat_data.get('avgSteals', 0) or 0),
                            'bpg': float(stat_data.get('avgBlocks', 0) or 0),
                            'topg': float(stat_data.get('avgTurnovers', 0) or 0),
                            'pfpg': float(stat_data.get('avgPersonalFouls', 0) or 0),
                        }
                        
                        # Calculate advanced stats
                        ppg = stat['ppg']
                        fga = stat['fga']
                        fta = stat['fta']
                        fgm = stat['fgm']
                        tpm = stat['tpm']
                        
                        # TS% = PTS / (2 * (FGA + 0.44 * FTA))
                        ts = (ppg / (2 * (fga + 0.44 * fta)) * 100) if (fga + fta) > 0 else 0
                        
                        # eFG% = (FG + 0.5 * 3P) / FGA
                        efg = ((fgm + 0.5 * tpm) / fga * 100) if fga > 0 else 0
                        
                        stat['ts'] = round(ts, 1)
                        stat['efg'] = round(efg, 1)
                        
                        # Round all stats to 1 decimal
                        for key in stat:
                            if isinstance(stat[key], float):
                                stat[key] = round(stat[key], 1)
                        
                        # Only add if player has played games
                        if stat['gamesPlayed'] > 0:
                            player_stats_list.append(stat)
                        
                    except Exception as e:
                        print(f"[ESPN API] Error processing athlete: {e}", file=sys.stderr)
                        continue
                        
            except Exception as e:
                print(f"[ESPN API] Error fetching team {team_abbr}: {e}", file=sys.stderr)
                continue
        
        print(f"[ESPN API] Successfully processed {len(player_stats_list)} players", file=sys.stderr)
        return player_stats_list
        
    except Exception as e:
        print(f"[ESPN API] Error fetching stats: {e}", file=sys.stderr)
        raise


def main():
    """Main entry point"""
    try:
        print("[ESPN API] Fetching real 2025-26 NBA season statistics from ESPN...", file=sys.stderr)
        player_stats = fetch_espn_stats()
        
        # Output as JSON to stdout
        output = {
            "success": True,
            "count": len(player_stats),
            "players": player_stats,
            "source": "ESPN API (official ESPN data)",
            "timestamp": datetime.now().isoformat()
        }
        
        print(json.dumps(output, indent=2))
        return 0
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "source": "ESPN API"
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        print(json.dumps(error_output, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
