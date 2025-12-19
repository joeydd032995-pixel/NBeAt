#!/usr/bin/env python3
import json
import sys
from datetime import datetime
from bs4 import BeautifulSoup
import cloudscraper
import time

SEASON = "2025-26"
SEASON_YEAR = "2026"

def method1_nba_api():
    print("[Method 1] Trying NBA.com API...", file=sys.stderr)
    scraper = cloudscraper.create_scraper()
    url = "https://stats.nba.com/stats/leaguedashplayerstats"
    params = {"Season": SEASON, "SeasonType": "Regular Season", "PerMode": "PerGame", "LeagueID": "00"}
    headers = {"Host": "stats.nba.com", "Accept": "application/json", "x-nba-stats-origin": "stats", "x-nba-stats-token": "true", "Referer": "https://stats.nba.com/"}
    response = scraper.get(url, params=params, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()
    result_sets = data.get("resultSets", [])
    if not result_sets:
        raise Exception("No result sets")
    headers_list = result_sets[0].get("headers", [])
    rows = result_sets[0].get("rowSet", [])
    header_idx = {h: i for i, h in enumerate(headers_list)}
    stats = []
    for row in rows:
        try:
            name = row[header_idx.get("PLAYER_NAME", 1)]
            gp = int(row[header_idx.get("GP", 5)] or 0)
            if not name or gp == 0:
                continue
            ppg = float(row[header_idx.get("PTS", -1)] or 0)
            fga = float(row[header_idx.get("FGA", -1)] or 0)
            fta = float(row[header_idx.get("FTA", -1)] or 0)
            fgm = float(row[header_idx.get("FGM", -1)] or 0)
            tpm = float(row[header_idx.get("FG3M", -1)] or 0)
            ts = (ppg / (2 * (fga + 0.44 * fta)) * 100) if (fga + fta) > 0 else 0
            efg = ((fgm + 0.5 * tpm) / fga * 100) if fga > 0 else 0
            stats.append({
                "fullName": name,
                "team": row[header_idx.get("TEAM_ABBREVIATION", 3)] or "UNK",
                "gamesPlayed": gp,
                "ppg": round(ppg, 1),
                "rpg": round(float(row[header_idx.get("REB", -1)] or 0), 1),
                "apg": round(float(row[header_idx.get("AST", -1)] or 0), 1),
                "fgPct": round(float(row[header_idx.get("FG_PCT", -1)] or 0) * 100, 1),
                "fgm": round(fgm, 1),
                "fga": round(fga, 1),
                "ftPct": round(float(row[header_idx.get("FT_PCT", -1)] or 0) * 100, 1),
                "ftm": round(float(row[header_idx.get("FTM", -1)] or 0), 1),
                "fta": round(fta, 1),
                "tpPct": round(float(row[header_idx.get("FG3_PCT", -1)] or 0) * 100, 1),
                "tpm": round(tpm, 1),
                "tpa": round(float(row[header_idx.get("FG3A", -1)] or 0), 1),
                "orpg": round(float(row[header_idx.get("OREB", -1)] or 0), 1),
                "drpg": round(float(row[header_idx.get("DREB", -1)] or 0), 1),
                "spg": round(float(row[header_idx.get("STL", -1)] or 0), 1),
                "bpg": round(float(row[header_idx.get("BLK", -1)] or 0), 1),
                "topg": round(float(row[header_idx.get("TOV", -1)] or 0), 1),
                "pfpg": round(float(row[header_idx.get("PF", -1)] or 0), 1),
                "ts": round(ts, 1),
                "efg": round(efg, 1),
                "position": ""
            })
        except:
            continue
    print(f"[Method 1] Found {len(stats)} players", file=sys.stderr)
    return stats, "NBA.com API"


def method2_bball_ref():
    print("[Method 2] Trying Basketball Reference...", file=sys.stderr)
    scraper = cloudscraper.create_scraper()
    url = f"https://www.basketball-reference.com/leagues/NBA_{SEASON_YEAR}_per_game.html"
    response = scraper.get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, "html.parser")
    table = soup.find("table", {"id": "per_game_stats"})
    if not table:
        raise Exception("No table found")
    stats = []
    tbody = table.find("tbody")
    if not tbody:
        raise Exception("No tbody found")
    for row in tbody.find_all("tr"):
        try:
            if "thead" in row.get("class", []):
                continue
            pc = row.find("td", {"data-stat": "player"})
            if not pc:
                continue
            name = pc.get_text().strip()
            if not name:
                continue
            def gs(s, d=0):
                c = row.find("td", {"data-stat": s})
                return float(c.get_text().strip() or d) if c else d
            gp = int(gs("g", 0))
            if gp == 0:
                continue
            ppg = gs("pts_per_g")
            fga = gs("fga_per_g")
            fta = gs("fta_per_g")
            fgm = gs("fg_per_g")
            tpm = gs("fg3_per_g")
            ts = (ppg / (2 * (fga + 0.44 * fta)) * 100) if (fga + fta) > 0 else 0
            efg = ((fgm + 0.5 * tpm) / fga * 100) if fga > 0 else 0
            pos = row.find("td", {"data-stat": "pos"})
            tm = row.find("td", {"data-stat": "team_id"})
            stats.append({
                "fullName": name,
                "position": pos.get_text().strip() if pos else "G",
                "team": tm.get_text().strip() if tm else "UNK",
                "gamesPlayed": gp,
                "ppg": round(ppg, 1),
                "rpg": round(gs("trb_per_g"), 1),
                "apg": round(gs("ast_per_g"), 1),
                "fgPct": round(gs("fg_pct") * 100, 1),
                "fgm": round(fgm, 1),
                "fga": round(fga, 1),
                "ftPct": round(gs("ft_pct") * 100, 1),
                "ftm": round(gs("ft_per_g"), 1),
                "fta": round(fta, 1),
                "tpPct": round(gs("fg3_pct") * 100, 1),
                "tpm": round(tpm, 1),
                "tpa": round(gs("fg3a_per_g"), 1),
                "orpg": round(gs("orb_per_g"), 1),
                "drpg": round(gs("drb_per_g"), 1),
                "spg": round(gs("stl_per_g"), 1),
                "bpg": round(gs("blk_per_g"), 1),
                "topg": round(gs("tov_per_g"), 1),
                "pfpg": round(gs("pf_per_g"), 1),
                "ts": round(ts, 1),
                "efg": round(efg, 1)
            })
        except:
            continue
    print(f"[Method 2] Found {len(stats)} players", file=sys.stderr)
    return stats, "Basketball Reference"


def method3_espn():
    print("[Method 3] Trying ESPN...", file=sys.stderr)
    scraper = cloudscraper.create_scraper()
    url = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete"
    params = {"region": "us", "lang": "en", "contentorigin": "espn", "limit": 600, "sort": "offensive.avgPoints:desc"}
    response = scraper.get(url, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    athletes = data.get("athletes", [])
    stats = []
    for a in athletes:
        try:
            name = a.get("athlete", {}).get("displayName", "")
            if not name:
                continue
            sd = {}
            for cat in a.get("categories", []):
                for s in cat.get("stats", []):
                    sd[s.get("name", "")] = s.get("value", 0)
            gp = int(sd.get("gamesPlayed", 0))
            if gp == 0:
                continue
            ppg = float(sd.get("avgPoints", 0))
            fga = float(sd.get("avgFieldGoalsAttempted", 0))
            fta = float(sd.get("avgFreeThrowsAttempted", 0))
            fgm = float(sd.get("avgFieldGoalsMade", 0))
            tpm = float(sd.get("avgThreePointFieldGoalsMade", 0))
            ts = (ppg / (2 * (fga + 0.44 * fta)) * 100) if (fga + fta) > 0 else 0
            efg = ((fgm + 0.5 * tpm) / fga * 100) if fga > 0 else 0
            stats.append({
                "fullName": name,
                "position": a.get("athlete", {}).get("position", {}).get("abbreviation", "G"),
                "team": a.get("athlete", {}).get("teamShortName", "UNK"),
                "gamesPlayed": gp,
                "ppg": round(ppg, 1),
                "rpg": round(float(sd.get("avgRebounds", 0)), 1),
                "apg": round(float(sd.get("avgAssists", 0)), 1),
                "fgPct": round(float(sd.get("fieldGoalPct", 0)), 1),
                "fgm": round(fgm, 1),
                "fga": round(fga, 1),
                "ftPct": round(float(sd.get("freeThrowPct", 0)), 1),
                "ftm": round(float(sd.get("avgFreeThrowsMade", 0)), 1),
                "fta": round(fta, 1),
                "tpPct": round(float(sd.get("threePointFieldGoalPct", 0)), 1),
                "tpm": round(tpm, 1),
                "tpa": round(float(sd.get("avgThreePointFieldGoalsAttempted", 0)), 1),
                "orpg": round(float(sd.get("avgOffensiveRebounds", 0)), 1),
                "drpg": round(float(sd.get("avgDefensiveRebounds", 0)), 1),
                "spg": round(float(sd.get("avgSteals", 0)), 1),
                "bpg": round(float(sd.get("avgBlocks", 0)), 1),
                "topg": round(float(sd.get("avgTurnovers", 0)), 1),
                "pfpg": round(float(sd.get("avgFouls", 0)), 1),
                "ts": round(ts, 1),
                "efg": round(efg, 1)
            })
        except:
            continue
    print(f"[Method 3] Found {len(stats)} players", file=sys.stderr)
    return stats, "ESPN API"


def main():
    methods = [
        ("NBA.com", method1_nba_api),
        ("Basketball Reference", method2_bball_ref),
        ("ESPN", method3_espn)
    ]
    errors = []
    for name, method in methods:
        try:
            print(f"[Main] Trying {name}...", file=sys.stderr)
            stats, source = method()
            if stats and len(stats) > 0:
                output = {
                    "success": True,
                    "count": len(stats),
                    "players": stats,
                    "source": source,
                    "season": SEASON,
                    "timestamp": datetime.now().isoformat()
                }
                print(json.dumps(output, indent=2))
                return 0
            errors.append(f"{name}: No players")
        except Exception as e:
            errors.append(f"{name}: {e}")
            print(f"[Main] {name} failed: {e}", file=sys.stderr)
    print(json.dumps({"success": False, "error": "All methods failed", "details": errors}))
    return 1


if __name__ == "__main__":
    sys.exit(main())
