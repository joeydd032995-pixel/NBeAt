#!/usr/bin/env python3
"""
Fetch NBA player statistics using ESPN API and nba_api
"""
import json
import sys
import time
from typing import Dict, List, Optional
import requests
from nba_api.stats.endpoints import playercareerstats

def fetch_player_season_stats(player_id: int) -> Optional[Dict]:
    """
    Fetch season stats for a single player using nba_api
    Returns averaged stats across the season
    """
    try:
        # Get career stats which includes season averages
        career_stats = playercareerstats.PlayerCareerStats(player_id=player_id)
        df = career_stats.get_data_frames()[0]
        
        if df.empty:
            return None
        
        # Get the most recent season (last row)
        latest_season = df.iloc[-1]
        
        return {
            'player_id': player_id,
            'season': int(latest_season['SEASON_ID'].split('-')[0]) if 'SEASON_ID' in latest_season else 2024,
            'pts': float(latest_season.get('PTS', 0)),
            'fgm': float(latest_season.get('FGM', 0)),
            'fga': float(latest_season.get('FGA', 0)),
            'fg_pct': float(latest_season.get('FG_PCT', 0)),
            'ftm': float(latest_season.get('FTM', 0)),
            'fta': float(latest_season.get('FTA', 0)),
            'ft_pct': float(latest_season.get('FT_PCT', 0)),
            'three_pm': float(latest_season.get('FG3M', 0)),
            'three_pa': float(latest_season.get('FG3A', 0)),
            'three_p_pct': float(latest_season.get('FG3_PCT', 0)),
            'reb': float(latest_season.get('REB', 0)),
            'oreb': float(latest_season.get('OREB', 0)),
            'dreb': float(latest_season.get('DREB', 0)),
            'ast': float(latest_season.get('AST', 0)),
            'tov': float(latest_season.get('TOV', 0)),
            'stl': float(latest_season.get('STL', 0)),
            'blk': float(latest_season.get('BLK', 0)),
            'pf': float(latest_season.get('PF', 0)),
            'min': float(latest_season.get('MIN', 0)),
            'gp': int(latest_season.get('GP', 0)),
        }
    except Exception as e:
        print(f"Error fetching stats for player {player_id}: {str(e)}", file=sys.stderr)
        return None

def fetch_espn_players() -> List[Dict]:
    """
    Fetch NBA players from ESPN API
    """
    try:
        url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        
        data = resp.json()
        players = []
        
        # Parse the sports structure
        sports = data.get('sports', [])
        if not sports:
            print("No sports data found", file=sys.stderr)
            return []
        
        leagues = sports[0].get('leagues', [])
        if not leagues:
            print("No leagues data found", file=sys.stderr)
            return []
        
        teams_list = leagues[0].get('teams', [])
        if not teams_list:
            print("No teams data found", file=sys.stderr)
            return []
        
        for team_wrapper in teams_list:
            team = team_wrapper.get('team', {})
            team_id = team.get('id')
            team_name = team.get('displayName', '')
            team_abbreviation = team.get('abbreviation', '').lower()
            
            # Get roster for each team
            roster_url = f"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{team_id}"
            try:
                roster_resp = requests.get(roster_url, timeout=10)
                roster_resp.raise_for_status()
                roster_data = roster_resp.json()
                
                team_data = roster_data.get('team', {})
                athletes = team_data.get('athletes', [])
                
                for athlete in athletes:
                    player = {
                        'id': int(athlete.get('id', 0)),
                        'first_name': athlete.get('firstName', ''),
                        'last_name': athlete.get('lastName', ''),
                        'full_name': f"{athlete.get('firstName', '')} {athlete.get('lastName', '')}",
                        'position': athlete.get('position', {}).get('abbreviation', ''),
                        'team_id': team_id,
                        'team_name': team_name,
                        'team_abbreviation': team_abbreviation,
                    }
                    if player['id'] > 0:  # Only add valid player IDs
                        players.append(player)
                
                time.sleep(0.1)  # Rate limiting
            except Exception as e:
                print(f"Error fetching roster for {team_name}: {str(e)}", file=sys.stderr)
                continue
        
        return players
    except Exception as e:
        print(f"Error fetching ESPN players: {str(e)}", file=sys.stderr)
        return []

def fetch_all_player_stats(player_ids: List[int]) -> Dict[int, Dict]:
    """
    Fetch stats for multiple players
    """
    stats = {}
    total = len(player_ids)
    
    for i, player_id in enumerate(player_ids):
        if i % 10 == 0:
            print(f"Fetching stats: {i}/{total}", file=sys.stderr)
        
        player_stats = fetch_player_season_stats(player_id)
        if player_stats:
            stats[player_id] = player_stats
        
        time.sleep(0.5)  # Rate limiting - nba_api is rate limited
    
    return stats

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Fetch stats for specific player
        player_id = int(sys.argv[1])
        stats = fetch_player_season_stats(player_id)
        print(json.dumps(stats))
    else:
        # Fetch ESPN players
        players = fetch_espn_players()
        print(json.dumps(players))
