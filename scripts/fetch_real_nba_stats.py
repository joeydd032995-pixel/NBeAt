#!/usr/bin/env python3
"""
Fetch real 2025-26 NBA season statistics using nba_api
This script accesses official NBA.com data via the nba_api library
"""

import json
import sys
from nba_api.stats.endpoints import leaguedashplayerstats
from nba_api.stats.static import players
import time

def fetch_real_nba_stats():
    """
    Fetch real 2025-26 season player statistics from NBA.com
    Returns list of player stats dictionaries
    """
    try:
        print("[NBA API] Starting real NBA stats fetch...", file=sys.stderr)
        print("[NBA API] Connecting to NBA.com API...", file=sys.stderr)
        
        # Get player stats for 2025-26 season
        # Using correct nba_api parameter names
        # CRITICAL: per_mode_detailed='PerGame' returns per-game averages instead of totals
        stats_data = leaguedashplayerstats.LeagueDashPlayerStats(
            season='2025-26',
            season_type_all_star='Regular Season',
            per_mode_detailed='PerGame'
        )
        
        print("[NBA API] Successfully retrieved stats from NBA.com", file=sys.stderr)
        
        # Extract the data
        headers = stats_data.get_data_frames()[0].columns.tolist()
        rows = stats_data.get_data_frames()[0].values.tolist()
        
        print(f"[NBA API] Found {len(rows)} players with stats", file=sys.stderr)
        
        # Get player names mapping
        print("[NBA API] Fetching player names...", file=sys.stderr)
        all_players = players.get_players()
        player_name_map = {p['id']: p['full_name'] for p in all_players}
        
        # Process each player
        player_stats_list = []
        for row in rows:
            try:
                # Create dict from headers and values
                player_data = dict(zip(headers, row))
                
                player_id = player_data.get('PLAYER_ID')
                full_name = player_name_map.get(player_id, player_data.get('PLAYER_NAME', ''))
                
                if not full_name:
                    continue
                
                # Extract relevant stats
                games_played = int(player_data.get('GP', 0) or 0)
                if games_played == 0:
                    continue
                
                stat = {
                    'fullName': full_name,
                    'position': player_data.get('PLAYER_POSITION', 'G'),
                    'team': player_data.get('TEAM_ABBREVIATION', 'UNK'),
                    'gamesPlayed': games_played,
                    'ppg': float(player_data.get('PTS', 0) or 0),
                    'rpg': float(player_data.get('REB', 0) or 0),
                    'apg': float(player_data.get('AST', 0) or 0),
                    'fgPct': float(player_data.get('FG_PCT', 0) or 0) * 100,  # Convert to percentage
                    'fgm': float(player_data.get('FGM', 0) or 0),
                    'fga': float(player_data.get('FGA', 0) or 0),
                    'ftPct': float(player_data.get('FT_PCT', 0) or 0) * 100,  # Convert to percentage
                    'ftm': float(player_data.get('FTM', 0) or 0),
                    'fta': float(player_data.get('FTA', 0) or 0),
                    'tpPct': float(player_data.get('FG3_PCT', 0) or 0) * 100,  # Convert to percentage
                    'tpm': float(player_data.get('FG3M', 0) or 0),
                    'tpa': float(player_data.get('FG3A', 0) or 0),
                    'orpg': float(player_data.get('OREB', 0) or 0),
                    'drpg': float(player_data.get('DREB', 0) or 0),
                    'spg': float(player_data.get('STL', 0) or 0),
                    'bpg': float(player_data.get('BLK', 0) or 0),
                    'topg': float(player_data.get('TOV', 0) or 0),
                    'pfpg': float(player_data.get('PF', 0) or 0),
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
                
                player_stats_list.append(stat)
                
            except Exception as e:
                print(f"[NBA API] Error processing player: {e}", file=sys.stderr)
                continue
        
        print(f"[NBA API] Successfully processed {len(player_stats_list)} players", file=sys.stderr)
        return player_stats_list
        
    except Exception as e:
        print(f"[NBA API] Error fetching stats: {e}", file=sys.stderr)
        raise


def main():
    """Main entry point"""
    try:
        print("[NBA API] Fetching real 2025-26 NBA season statistics...", file=sys.stderr)
        player_stats = fetch_real_nba_stats()
        
        # Output as JSON to stdout
        output = {
            "success": True,
            "count": len(player_stats),
            "players": player_stats,
            "source": "nba_api (NBA.com official data)"
        }
        
        print(json.dumps(output, indent=2))
        return 0
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "source": "nba_api"
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
