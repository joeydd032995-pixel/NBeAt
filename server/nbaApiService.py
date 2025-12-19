#!/usr/bin/env python3
"""
Fetch real NBA player and team statistics using nba_api
Supports 2025-2026 season and real-time updates
"""
import json
import sys
import time
from typing import Dict, List, Optional
from nba_api.stats.endpoints import (
    leaguedashplayerstats,
    leaguedashteamstats,
    commonallplayers,
    playergamelog,
)

def get_current_season() -> str:
    """Get current NBA season (2025-2026)"""
    return "2025-26"

def fetch_all_players() -> List[Dict]:
    """
    Fetch all active NBA players for 2025-2026 season
    """
    try:
        print("[nba_api] Fetching all active players...", file=sys.stderr)
        
        # Get all players for current season
        players = commonallplayers.CommonAllPlayers(
            is_only_current_season=1,
            season="2025-26"
        )
        df = players.get_data_frames()[0]
        
        result = []
        for _, row in df.iterrows():
            player = {
                'id': int(row['PERSON_ID']),
                'first_name': row.get('FIRST_NAME', ''),
                'last_name': row.get('LAST_NAME', ''),
                'full_name': f"{row.get('FIRST_NAME', '')} {row.get('LAST_NAME', '')}",
                'team_id': int(row.get('TEAM_ID', 0)) if row.get('TEAM_ID') else 0,
                'team_abbreviation': row.get('TEAM_ABBREVIATION', '').lower(),
            }
            if player['id'] > 0:
                result.append(player)
        
        print(f"[nba_api] Fetched {len(result)} active players", file=sys.stderr)
        return result
    except Exception as e:
        print(f"[nba_api] Error fetching players: {str(e)}", file=sys.stderr)
        return []

def fetch_player_stats(season: str = "2025-26") -> Dict[int, Dict]:
    """
    Fetch player statistics for the given season
    Returns dict mapping player_id to stats
    """
    try:
        print(f"[nba_api] Fetching player stats for season {season}...", file=sys.stderr)
        
        # Get league player stats
        stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            per_mode_detailed="PerGame"
        )
        df = stats.get_data_frames()[0]
        
        result = {}
        for _, row in df.iterrows():
            player_id = int(row['PLAYER_ID'])
            stat = {
                'player_id': player_id,
                'pts': float(row.get('PTS', 0)),
                'fgm': float(row.get('FGM', 0)),
                'fga': float(row.get('FGA', 0)),
                'fg_pct': float(row.get('FG_PCT', 0)) * 100,  # Convert to percentage
                'ftm': float(row.get('FTM', 0)),
                'fta': float(row.get('FTA', 0)),
                'ft_pct': float(row.get('FT_PCT', 0)) * 100,
                'three_pm': float(row.get('FG3M', 0)),
                'three_pa': float(row.get('FG3A', 0)),
                'three_p_pct': float(row.get('FG3_PCT', 0)) * 100,
                'reb': float(row.get('REB', 0)),
                'oreb': float(row.get('OREB', 0)),
                'dreb': float(row.get('DREB', 0)),
                'ast': float(row.get('AST', 0)),
                'tov': float(row.get('TOV', 0)),
                'stl': float(row.get('STL', 0)),
                'blk': float(row.get('BLK', 0)),
                'pf': float(row.get('PF', 0)),
                'min': float(row.get('MIN', 0)),
                'gp': int(row.get('GP', 0)),
                'gs': int(row.get('GS', 0)),
            }
            result[player_id] = stat
        
        print(f"[nba_api] Fetched stats for {len(result)} players", file=sys.stderr)
        return result
    except Exception as e:
        print(f"[nba_api] Error fetching player stats: {str(e)}", file=sys.stderr)
        return {}

def fetch_team_stats(season: str = "2025-26") -> Dict[int, Dict]:
    """
    Fetch team statistics for the given season
    """
    try:
        print(f"[nba_api] Fetching team stats for season {season}...", file=sys.stderr)
        
        # Get league team stats
        stats = leaguedashteamstats.LeagueDashTeamStats(
            season=season,
            per_mode_detailed="PerGame"
        )
        df = stats.get_data_frames()[0]
        
        result = {}
        for _, row in df.iterrows():
            team_id = int(row['TEAM_ID'])
            stat = {
                'team_id': team_id,
                'team_name': row.get('TEAM_NAME', ''),
                'pts': float(row.get('PTS', 0)),
                'fgm': float(row.get('FGM', 0)),
                'fga': float(row.get('FGA', 0)),
                'fg_pct': float(row.get('FG_PCT', 0)) * 100,
                'ftm': float(row.get('FTM', 0)),
                'fta': float(row.get('FTA', 0)),
                'ft_pct': float(row.get('FT_PCT', 0)) * 100,
                'three_pm': float(row.get('FG3M', 0)),
                'three_pa': float(row.get('FG3A', 0)),
                'three_p_pct': float(row.get('FG3_PCT', 0)) * 100,
                'reb': float(row.get('REB', 0)),
                'ast': float(row.get('AST', 0)),
                'tov': float(row.get('TOV', 0)),
                'stl': float(row.get('STL', 0)),
                'blk': float(row.get('BLK', 0)),
                'pf': float(row.get('PF', 0)),
                'gp': int(row.get('GP', 0)),
                'w': int(row.get('W', 0)),
                'l': int(row.get('L', 0)),
            }
            result[team_id] = stat
        
        print(f"[nba_api] Fetched stats for {len(result)} teams", file=sys.stderr)
        return result
    except Exception as e:
        print(f"[nba_api] Error fetching team stats: {str(e)}", file=sys.stderr)
        return {}

def fetch_player_game_log(player_id: int, season: str = "2025-26") -> List[Dict]:
    """
    Fetch recent game log for a player to get latest stats
    """
    try:
        gamelog = playergamelog.PlayerGameLog(
            player_id=player_id,
            season=season
        )
        df = gamelog.get_data_frames()[0]
        
        games = []
        for _, row in df.iterrows():
            game = {
                'game_id': row.get('Game_ID', ''),
                'game_date': row.get('GAME_DATE', ''),
                'pts': float(row.get('PTS', 0)),
                'reb': float(row.get('REB', 0)),
                'ast': float(row.get('AST', 0)),
                'fg_pct': float(row.get('FG_PCT', 0)) * 100 if row.get('FG_PCT') else 0,
            }
            games.append(game)
        
        return games
    except Exception as e:
        print(f"[nba_api] Error fetching game log for player {player_id}: {str(e)}", file=sys.stderr)
        return []

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "players":
            players = fetch_all_players()
            print(json.dumps(players))
        elif command == "player-stats":
            stats = fetch_player_stats()
            print(json.dumps(stats))
        elif command == "team-stats":
            stats = fetch_team_stats()
            print(json.dumps(stats))
        elif command == "game-log":
            if len(sys.argv) > 2:
                player_id = int(sys.argv[2])
                games = fetch_player_game_log(player_id)
                print(json.dumps(games))
            else:
                print("[]")
        else:
            print("[]")
    else:
        # Default: fetch all players
        players = fetch_all_players()
        print(json.dumps(players))
