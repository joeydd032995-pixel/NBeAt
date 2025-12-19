#!/usr/bin/env python3
"""
Fetch real 2025-26 NBA season statistics using sportsipy
Sportsipy scrapes data from Basketball Reference
"""

import json
import sys
from datetime import datetime

try:
    from sportsipy.nba.roster import Roster
    from sportsipy.nba.teams import Teams
except ImportError:
    print(json.dumps({"success": False, "error": "sportsipy not installed"}))
    sys.exit(1)


def fetch_sportsipy_stats():
    """
    Fetch real 2025-26 season player statistics using sportsipy
    Returns list of player stats dictionaries
    """
    try:
        print("[Sportsipy] Starting real NBA stats fetch...", file=sys.stderr)
        
        # Get all NBA teams for 2025 season
        teams = Teams(year=2025)
        print(f"[Sportsipy] Found {len(teams)} teams", file=sys.stderr)
        
        player_stats_list = []
        
        for team in teams:
            team_abbr = team.abbreviation
            print(f"[Sportsipy] Processing team: {team_abbr}", file=sys.stderr)
            
            try:
                roster = Roster(team_abbr, year=2025)
                
                for player in roster.players:
                    try:
                        # Get player stats
                        full_name = player.name
                        if not full_name:
                            continue
                        
                        games_played = int(player.games_played or 0)
                        if games_played == 0:
                            continue
                        
                        stat = {
                            'fullName': full_name,
                            'position': player.position or 'G',
                            'team': team_abbr,
                            'gamesPlayed': games_played,
                            'ppg': round(float(player.points_per_game or 0), 1),
                            'rpg': round(float(player.total_rebounds_per_game or 0), 1),
                            'apg': round(float(player.assists_per_game or 0), 1),
                            'fgPct': round(float(player.field_goal_percentage or 0) * 100, 1),
                            'fgm': round(float(player.field_goals_per_game or 0), 1),
                            'fga': round(float(player.field_goal_attempts_per_game or 0), 1),
                            'ftPct': round(float(player.free_throw_percentage or 0) * 100, 1),
                            'ftm': round(float(player.free_throws_per_game or 0), 1),
                            'fta': round(float(player.free_throw_attempts_per_game or 0), 1),
                            'tpPct': round(float(player.three_point_percentage or 0) * 100, 1),
                            'tpm': round(float(player.three_pointers_per_game or 0), 1),
                            'tpa': round(float(player.three_point_attempts_per_game or 0), 1),
                            'orpg': round(float(player.offensive_rebounds_per_game or 0), 1),
                            'drpg': round(float(player.defensive_rebounds_per_game or 0), 1),
                            'spg': round(float(player.steals_per_game or 0), 1),
                            'bpg': round(float(player.blocks_per_game or 0), 1),
                            'topg': round(float(player.turnovers_per_game or 0), 1),
                            'pfpg': round(float(player.personal_fouls_per_game or 0), 1),
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
                        print(f"[Sportsipy] Error processing player: {e}", file=sys.stderr)
                        continue
                        
            except Exception as e:
                print(f"[Sportsipy] Error fetching roster for {team_abbr}: {e}", file=sys.stderr)
                continue
        
        print(f"[Sportsipy] Successfully processed {len(player_stats_list)} players", file=sys.stderr)
        return player_stats_list
        
    except Exception as e:
        print(f"[Sportsipy] Error fetching stats: {e}", file=sys.stderr)
        raise


def main():
    """Main entry point"""
    try:
        print("[Sportsipy] Fetching real 2025-26 NBA season statistics...", file=sys.stderr)
        player_stats = fetch_sportsipy_stats()
        
        # Output as JSON to stdout
        output = {
            "success": True,
            "count": len(player_stats),
            "players": player_stats,
            "source": "sportsipy (Basketball Reference data)",
            "timestamp": datetime.now().isoformat()
        }
        
        print(json.dumps(output, indent=2))
        return 0
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e),
            "source": "sportsipy"
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        print(json.dumps(error_output, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
