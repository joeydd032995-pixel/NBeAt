#!/usr/bin/env python3
"""
Basketball Reference Scraper - Python Backup
Scrapes real 2025-26 NBA season player statistics from basketball-reference.com
Used as backup if Node.js scraper fails

Note: Basketball Reference uses JavaScript to render tables, so we need to:
1. Look for the table in HTML comments (BR hides tables in comments for JS rendering)
2. Or use their CSV export endpoint
"""

import requests
from bs4 import BeautifulSoup, Comment
import json
import sys
import re
from typing import List, Dict, Any

# URL for 2025-26 NBA season per-game stats
BR_URL = "https://www.basketball-reference.com/leagues/NBA_2026_per_game.html"

def scrape_basketball_reference() -> List[Dict[str, Any]]:
    """
    Scrape player statistics from Basketball Reference
    Returns list of player stats dictionaries
    """
    try:
        print("[BR Scraper] Starting Basketball Reference scrape...", file=sys.stderr)
        print(f"[BR Scraper] Fetching {BR_URL}", file=sys.stderr)
        
        # Fetch the page
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(BR_URL, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, "html.parser")
        
        # Basketball Reference hides some tables in HTML comments for JS rendering
        # First try to find the table directly
        table = soup.find("table", {"id": "per_game_stats"})
        
        if not table:
            # Try alternate ID
            table = soup.find("table", {"id": "per_game"})
        
        if not table:
            # Look for the table inside HTML comments
            print("[BR Scraper] Table not found directly, searching in HTML comments...", file=sys.stderr)
            comments = soup.find_all(string=lambda text: isinstance(text, Comment))
            for comment in comments:
                if 'id="per_game"' in comment or 'id="per_game_stats"' in comment:
                    # Parse the comment as HTML
                    comment_soup = BeautifulSoup(comment, "html.parser")
                    table = comment_soup.find("table")
                    if table:
                        print("[BR Scraper] Found table in HTML comment", file=sys.stderr)
                        break
        
        if not table:
            raise Exception("Could not find stats table on Basketball Reference (checked direct and comments)")
        
        print("[BR Scraper] Found stats table, parsing rows...", file=sys.stderr)
        
        players = []
        tbody = table.find("tbody")
        
        if not tbody:
            raise Exception("Could not find table body")
        
        for row in tbody.find_all("tr"):
            try:
                # Skip header rows
                if row.get("class") and "thead" in row.get("class", []):
                    continue
                
                # Get all cells
                cells = row.find_all("td")
                if len(cells) < 10:
                    continue
                
                # Extract player name
                player_cell = row.find("td", {"data-stat": "player"})
                if not player_cell:
                    continue
                
                player_link = player_cell.find("a")
                if not player_link:
                    # Try getting text directly if no link
                    full_name = player_cell.get_text(strip=True)
                else:
                    full_name = player_link.get_text(strip=True)
                
                if not full_name:
                    continue
                
                # Extract position
                pos_cell = row.find("td", {"data-stat": "pos"})
                position = pos_cell.get_text(strip=True) if pos_cell else "G"
                
                # Extract team
                team_cell = row.find("td", {"data-stat": "team_id"})
                team = team_cell.get_text(strip=True) if team_cell else "UNK"
                
                # Extract games played
                g_cell = row.find("td", {"data-stat": "g"})
                games_played = int(g_cell.get_text(strip=True) or 0) if g_cell else 0
                
                # Skip players with 0 games
                if games_played == 0:
                    continue
                
                # Helper function to safely extract float values
                def get_float(stat_name: str) -> float:
                    cell = row.find("td", {"data-stat": stat_name})
                    if cell:
                        try:
                            text = cell.get_text(strip=True)
                            return float(text) if text else 0.0
                        except ValueError:
                            return 0.0
                    return 0.0
                
                # Extract per-game stats
                ppg = get_float("pts_per_g")
                rpg = get_float("trb_per_g")
                apg = get_float("ast_per_g")
                fg_pct = get_float("fg_pct")
                fgm = get_float("fg_per_g")
                fga = get_float("fga_per_g")
                ft_pct = get_float("ft_pct")
                ftm = get_float("ft_per_g")
                fta = get_float("fta_per_g")
                tp_pct = get_float("fg3_pct")
                tpm = get_float("fg3_per_g")
                tpa = get_float("fg3a_per_g")
                orpg = get_float("orb_per_g")
                drpg = get_float("drb_per_g")
                spg = get_float("stl_per_g")
                bpg = get_float("blk_per_g")
                topg = get_float("tov_per_g")
                pfpg = get_float("pf_per_g")
                
                # Calculate advanced stats
                ts = calculate_true_shooting_pct(ppg, fga, fta)
                efg = calculate_effective_fg_pct(fgm, fga, tpm)
                
                player_data = {
                    "fullName": full_name,
                    "position": position or "G",
                    "team": team or "UNK",
                    "gamesPlayed": games_played,
                    "ppg": round(ppg, 1),
                    "rpg": round(rpg, 1),
                    "apg": round(apg, 1),
                    "fgPct": round(fg_pct, 1),
                    "fgm": round(fgm, 1),
                    "fga": round(fga, 1),
                    "ftPct": round(ft_pct, 1),
                    "ftm": round(ftm, 1),
                    "fta": round(fta, 1),
                    "tpPct": round(tp_pct, 1),
                    "tpm": round(tpm, 1),
                    "tpa": round(tpa, 1),
                    "orpg": round(orpg, 1),
                    "drpg": round(drpg, 1),
                    "spg": round(spg, 1),
                    "bpg": round(bpg, 1),
                    "topg": round(topg, 1),
                    "ts": round(ts, 1),
                    "efg": round(efg, 1),
                    "pfpg": round(pfpg, 1),
                }
                
                players.append(player_data)
                
            except Exception as e:
                print(f"[BR Scraper] Error parsing row: {e}", file=sys.stderr)
                continue
        
        print(f"[BR Scraper] Successfully scraped {len(players)} players", file=sys.stderr)
        return players
        
    except Exception as e:
        print(f"[BR Scraper] Error scraping Basketball Reference: {e}", file=sys.stderr)
        raise


def calculate_true_shooting_pct(ppg: float, fga: float, fta: float) -> float:
    """
    Calculate True Shooting Percentage
    TS% = PTS / (2 * (FGA + 0.44 * FTA))
    """
    if fga == 0 or fta == 0:
        return 0.0
    return (ppg / (2 * (fga + 0.44 * fta))) * 100


def calculate_effective_fg_pct(fgm: float, fga: float, tpm: float) -> float:
    """
    Calculate Effective Field Goal Percentage
    eFG% = (FG + 0.5 * 3P) / FGA
    """
    if fga == 0:
        return 0.0
    return ((fgm + 0.5 * tpm) / fga) * 100


def main():
    """Main entry point"""
    try:
        players = scrape_basketball_reference()
        
        # Output as JSON to stdout
        output = {
            "success": True,
            "count": len(players),
            "players": players
        }
        
        print(json.dumps(output, indent=2))
        return 0
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_output, indent=2), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
