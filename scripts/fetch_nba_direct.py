#!/usr/bin/env python3
"""
Fetch real NBA season statistics directly from NBA.com API
Uses proper headers to avoid blocking
"""

import json
import sys
import requests
from datetime import datetime
import time

def fetch_nba_direct_stats():
    """
    Fetch real season player statistics directly from NBA.com API
    Returns list of player stats dictionaries
    """
    try:
        print("[NBA Direct] Starting real NBA stats fetch...", file=sys.stderr)
        
        # NBA.com stats API endpoint
        # Try current season 2024-25 (NBA season runs Oct-June)
        url = "https://stats.nba.com/stats/leaguedashplayerstats"
        
        # Required headers to avoid 403 blocking
        headers = {
            'Host': 'stats.nba.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:72.0) Gecko/20100101 Firefox/72.0',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'x-nba-stats-origin': 'stats',
            'x-nba-stats-token': 'true',
            'Connection': 'keep-alive',
            'Referer': 'https://stats.nba.com/',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
        }
        
        # Parameters for the API request
        params = {
            'Season': '2024-25',
            'SeasonType': 'Regular Season',
            'PerMode': 'PerGame',
            'LeagueID': '00',
        }
        
        print(f"[NBA Direct] Fetching from NBA.com API for 2024-25 season...", file=sys.stderr)
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        
        if response.status_code == 403:
            print("[NBA Direct] Got 403, trying with different headers...", file=sys.stderr)
            # Try alternative headers
            headers['Origin'] = 'https://www.nba.com'
            headers['Referer'] = 'https://www.nba.com/'
            response = requests.get(url, headers=headers, params=params, timeout=30)
        
        response.raise_for_status()
        
        data = response.json()
        print(f"[NBA Direct] Successfully retrieved data from NBA.com", file=sys.stderr)
        
        # Parse the response
        result_sets = data.get('resultSets', [])
        if not result_sets:
            raise Exception("No result sets in response")
        
        player_stats_data = result_sets[0]
        headers_list = player_stats_data.get('headers', [])
        rows = player_stats_data.get('rowSet', [])
        
        print(f"[NBA Direct] Found {len(rows)} players", file=sys.stderr)
        
        # Create header index mapping
        header_idx = {h: i for i, h in enumerate(headers_list)}
        
        player_stats_list = []
        
        for row in rows:
            try:
                full_name = row[header_idx.get('PLAYER_NAME', 1)]
                if not full_name:
                    continue
                
                games_played = int(row[header_idx.get('GP', 5)] or 0)
                if games_played == 0:
                    continue
                
                # Extract stats
                stat = {
                    'fullName': full_name,
                    'position': '',  # Not in this endpoint
                    'team': row[header_idx.get('TEAM_ABBREVIATION', 3)] or 'UNK',
                    'gamesPlayed': games_played,
                    'ppg': round(float(row[header_idx.get('PTS', -1)] or 0), 1),
                    'rpg': round(float(row[header_idx.get('REB', -1)] or 0), 1),
                    'apg': round(float(row[header_idx.get('AST', -1)] or 0), 1),
                    'fgPct': round(float(row[header_idx.get('FG_PCT', -1)] or 0) * 100, 1),
                    'fgm': round(float(row[header_idx.get('FGM', -1)] or 0), 1),
                    'fga': round(float(row[header_idx.get('FGA', -1)] or 0), 1),
                    'ftPct': round(float(row[header_idx.get('FT_PCT', -1)] or 0) * 100, 1),
                    'ftm': round(float(row[header_idx.get('FTM', -1)] or 0), 1),
                    'fta': round(float(row[header_idx.get('FTA', -1)] or 0), 1),
                    'tpPct': round(float(row[header_idx.get('FG3_PCT', -1)] or 0) * 100, 1),
                    'tpm': round(float(row[header_idx.get('FG3M', -1)] or 0), 1),
                    'tpa': round(float(row[header_idx.get('FG3A', -1)] or 0), 1),
                    'orpg': round(float(row[header_idx.get('OREB', -1)] or 0), 1),
                    'drpg': round(float(row[header_idx.get('DREB', -1)] or 0), 1),
                    'spg': round(float(row[header_idx.get('STL', -1)] or 0), 1),
                    'bpg': round(float(row[header_idx.get('BLK', -1)] or 0), 1),
                    'topg': round(float(row[header_idx.get('TOV', -1)] or 0), 1),
                    'pfpg': round(float(row[header_idx.get('PF', -1)] or 0), 1),
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
                
                player_stats_list.append(stat)
                
            except Exception as e:
                print(f"[NBA Direct] Error processing row: {e}", file=sys.stderr)
                continue
        
        print(f"[NBA Direct] Successfully processed {len(player_stats_list)} players", file=sys.stderr)
        return player_stats_list
        
    except Exception as e:
        print(f"[NBA Direct] Error fetching stats: {e}", file=sys.stderr)
        raise


def main():
    """Main entry point"""
    try:
        print("[NBA Direct] Fetching real NBA season statistics from NBA.com...", file=sys.stderr)
        player_stats = fetch_nba_direct_stats()
        
        # Output as JSON to stdout
        output = {
            "success": True,
            "count": len(player_stats),
            "players": player_stats,
            "source": "NBA.com Official API",
            "timestamp": datetime.now().isoformat()
        }
        
        print(json.dumps(output, indent=2))
        return 0
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "source": "NBA.com Direct API"
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        print(json.dumps(error_output, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
