#!/usr/bin/env python3
"""
Basketball Reference Scraper Service
Fetches 2025-26 NBA season player statistics from Basketball Reference
"""

import json
import sys
from basketball_reference_web_scraper import client
from basketball_reference_web_scraper.data import Season, OutputType

def fetch_2025_26_player_stats():
    """Fetch 2025-26 NBA season player statistics from Basketball Reference"""
    try:
        print("[BR Scraper] Fetching 2025-26 season player stats...", file=sys.stderr)
        
        # Fetch player season totals for 2025-26
        player_stats = client.players_season_totals(
            season=Season.SEASON_2025_26,
            output_type=OutputType.JSON
        )
        
        if not player_stats:
            print("[BR Scraper] No stats found for 2025-26 season", file=sys.stderr)
            return {"players": [], "count": 0}
        
        # Transform data to match our schema
        transformed_players = []
        for player in player_stats:
            try:
                # Extract stats from player object
                stats = {
                    "fullName": player.get("name", ""),
                    "ppg": float(player.get("points_per_game", 0)) if player.get("points_per_game") else 0,
                    "rpg": float(player.get("rebounds_per_game", 0)) if player.get("rebounds_per_game") else 0,
                    "apg": float(player.get("assists_per_game", 0)) if player.get("assists_per_game") else 0,
                    "fgPct": float(player.get("field_goal_percentage", 0)) if player.get("field_goal_percentage") else 0,
                    "fgm": float(player.get("field_goals_made", 0)) if player.get("field_goals_made") else 0,
                    "fga": float(player.get("field_goals_attempted", 0)) if player.get("field_goals_attempted") else 0,
                    "ftPct": float(player.get("free_throw_percentage", 0)) if player.get("free_throw_percentage") else 0,
                    "ftm": float(player.get("free_throws_made", 0)) if player.get("free_throws_made") else 0,
                    "fta": float(player.get("free_throws_attempted", 0)) if player.get("free_throws_attempted") else 0,
                    "threePct": float(player.get("three_point_percentage", 0)) if player.get("three_point_percentage") else 0,
                    "threepm": float(player.get("three_pointers_made", 0)) if player.get("three_pointers_made") else 0,
                    "threepa": float(player.get("three_pointers_attempted", 0)) if player.get("three_pointers_attempted") else 0,
                    "orpg": float(player.get("offensive_rebounds_per_game", 0)) if player.get("offensive_rebounds_per_game") else 0,
                    "drpg": float(player.get("defensive_rebounds_per_game", 0)) if player.get("defensive_rebounds_per_game") else 0,
                    "spg": float(player.get("steals_per_game", 0)) if player.get("steals_per_game") else 0,
                    "bpg": float(player.get("blocks_per_game", 0)) if player.get("blocks_per_game") else 0,
                    "topg": float(player.get("turnovers_per_game", 0)) if player.get("turnovers_per_game") else 0,
                    "tsPct": float(player.get("true_shooting_percentage", 0)) if player.get("true_shooting_percentage") else 0,
                    "efgPct": float(player.get("effective_field_goal_percentage", 0)) if player.get("effective_field_goal_percentage") else 0,
                    "gamesPlayed": int(player.get("games_played", 0)) if player.get("games_played") else 0,
                    "position": player.get("position", ""),
                }
                
                if stats["fullName"]:  # Only add if we have a name
                    transformed_players.append(stats)
            except Exception as e:
                print(f"[BR Scraper] Error processing player {player.get('name', 'Unknown')}: {e}", file=sys.stderr)
                continue
        
        print(f"[BR Scraper] Successfully fetched {len(transformed_players)} players", file=sys.stderr)
        return {
            "players": transformed_players,
            "count": len(transformed_players)
        }
        
    except Exception as e:
        print(f"[BR Scraper] Error fetching stats: {e}", file=sys.stderr)
        return {"players": [], "count": 0, "error": str(e)}

if __name__ == "__main__":
    result = fetch_2025_26_player_stats()
    print(json.dumps(result))
