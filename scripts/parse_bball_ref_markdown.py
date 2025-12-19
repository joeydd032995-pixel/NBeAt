#!/usr/bin/env python3
"""
Parse Basketball Reference markdown table and output JSON for database import
"""

import json
import re
import sys
from datetime import datetime

def parse_markdown_table(filepath):
    """Parse the markdown table from Basketball Reference"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all table rows (lines starting with |)
    lines = content.split('\n')
    
    # Find the header row and data rows
    header_line = None
    data_rows = []
    
    for i, line in enumerate(lines):
        if line.startswith('|Rk |Player'):
            header_line = line
            # Skip the separator line (next line)
            # Then collect all data rows
            for j in range(i + 2, len(lines)):
                if lines[j].startswith('|') and not lines[j].startswith('| ---'):
                    data_rows.append(lines[j])
                elif not lines[j].startswith('|'):
                    break
            break
    
    if not header_line:
        print("Could not find header row", file=sys.stderr)
        return []
    
    print(f"Found {len(data_rows)} player rows", file=sys.stderr)
    
    players = []
    
    for row in data_rows:
        try:
            # Split by | and clean up
            cells = [c.strip() for c in row.split('|')]
            cells = [c for c in cells if c]  # Remove empty cells
            
            if len(cells) < 29:
                continue
            
            # Extract player name from markdown link
            player_cell = cells[1]
            name_match = re.search(r'\[([^\]]+)\]', player_cell)
            if name_match:
                full_name = name_match.group(1)
            else:
                full_name = player_cell
            
            # Extract team from markdown link
            team_cell = cells[3]
            team_match = re.search(r'\[([^\]]+)\]', team_cell)
            if team_match:
                team = team_match.group(1)
            else:
                team = team_cell
            
            # Clean up stat values (remove ** bold markers and backslashes)
            def clean_stat(val):
                val = val.replace('**', '').replace('\\', '').strip()
                try:
                    return float(val) if '.' in val else int(val)
                except:
                    return 0
            
            # Parse stats according to table columns:
            # Rk, Player, Age, Team, Pos, G, GS, MP, FG, FGA, FG%, 3P, 3PA, 3P%, 2P, 2PA, 2P%, eFG%, FT, FTA, FT%, ORB, DRB, TRB, AST, STL, BLK, TOV, PF, PTS
            
            position = cells[4].strip()
            games_played = clean_stat(cells[5])
            
            if games_played == 0:
                continue
            
            fgm = clean_stat(cells[8])
            fga = clean_stat(cells[9])
            fg_pct = clean_stat(cells[10])
            tpm = clean_stat(cells[11])  # 3P
            tpa = clean_stat(cells[12])  # 3PA
            tp_pct = clean_stat(cells[13])  # 3P%
            efg = clean_stat(cells[17])  # eFG%
            ftm = clean_stat(cells[18])
            fta = clean_stat(cells[19])
            ft_pct = clean_stat(cells[20])
            orpg = clean_stat(cells[21])
            drpg = clean_stat(cells[22])
            rpg = clean_stat(cells[23])  # TRB
            apg = clean_stat(cells[24])  # AST
            spg = clean_stat(cells[25])  # STL
            bpg = clean_stat(cells[26])  # BLK
            topg = clean_stat(cells[27])  # TOV
            pfpg = clean_stat(cells[28])  # PF
            ppg = clean_stat(cells[29])  # PTS
            
            # Convert percentages (they're already in decimal form like .460)
            fg_pct_val = fg_pct * 100 if fg_pct < 1 else fg_pct
            tp_pct_val = tp_pct * 100 if tp_pct < 1 else tp_pct
            ft_pct_val = ft_pct * 100 if ft_pct < 1 else ft_pct
            efg_val = efg * 100 if efg < 1 else efg
            
            # Calculate TS%
            ts = (ppg / (2 * (fga + 0.44 * fta)) * 100) if (fga + fta) > 0 else 0
            
            player = {
                'fullName': full_name,
                'position': position,
                'team': team,
                'gamesPlayed': int(games_played),
                'ppg': round(ppg, 1),
                'rpg': round(rpg, 1),
                'apg': round(apg, 1),
                'fgPct': round(fg_pct_val, 1),
                'fgm': round(fgm, 1),
                'fga': round(fga, 1),
                'ftPct': round(ft_pct_val, 1),
                'ftm': round(ftm, 1),
                'fta': round(fta, 1),
                'tpPct': round(tp_pct_val, 1),
                'tpm': round(tpm, 1),
                'tpa': round(tpa, 1),
                'orpg': round(orpg, 1),
                'drpg': round(drpg, 1),
                'spg': round(spg, 1),
                'bpg': round(bpg, 1),
                'topg': round(topg, 1),
                'pfpg': round(pfpg, 1),
                'ts': round(ts, 1),
                'efg': round(efg_val, 1),
            }
            
            players.append(player)
            
        except Exception as e:
            print(f"Error parsing row: {e}", file=sys.stderr)
            continue
    
    return players


def main():
    filepath = "/home/ubuntu/upload/www.basketball-reference.com_leagues_NBA_2026_per_game.html.md"
    
    print(f"Parsing {filepath}...", file=sys.stderr)
    players = parse_markdown_table(filepath)
    
    output = {
        "success": True,
        "count": len(players),
        "players": players,
        "source": "Basketball Reference (2025-26 season)",
        "season": "2025-26",
        "timestamp": datetime.now().isoformat()
    }
    
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
