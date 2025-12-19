/**
 * Import real 2025-26 NBA stats from JSON into database
 * Run with: node scripts/import_real_stats.mjs
 */

import { createConnection } from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Read the JSON file
  const jsonPath = path.join(__dirname, "../data/real_nba_stats_2025_26.json");
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  
  if (!jsonData.success || !jsonData.players) {
    console.error("Invalid JSON data");
    process.exit(1);
  }
  
  const players = jsonData.players;
  console.log(`Importing ${players.length} players with real 2025-26 stats...`);
  
  // Connect to database
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  
  // Parse DATABASE_URL
  const url = new URL(dbUrl);
  const connection = await createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });
  
  console.log("Connected to database");
  
  // Team ID mapping (approximate - we'll use team abbreviation to find existing teams)
  const teamMapping = {
    "ATL": 1, "BOS": 2, "BRK": 3, "CHO": 4, "CHI": 5, "CLE": 6, "DAL": 7, "DEN": 8,
    "DET": 9, "GSW": 10, "HOU": 11, "IND": 12, "LAC": 13, "LAL": 14, "MEM": 15,
    "MIA": 16, "MIL": 17, "MIN": 18, "NOP": 19, "NYK": 20, "OKC": 21, "ORL": 22,
    "PHI": 23, "PHO": 24, "POR": 25, "SAC": 26, "SAS": 27, "TOR": 28, "UTA": 29, "WAS": 30
  };
  
  let updated = 0;
  let inserted = 0;
  let errors = 0;
  
  for (const player of players) {
    try {
      const teamId = teamMapping[player.team] || 1;
      
      // Check if player exists
      const [existing] = await connection.execute(
        "SELECT id FROM players WHERE fullName = ?",
        [player.fullName]
      );
      
      if (existing.length > 0) {
        // Update existing player
        await connection.execute(
          `UPDATE players SET 
            position = ?, teamId = ?, gamesPlayed = ?,
            ppg = ?, rpg = ?, apg = ?, fgPct = ?, fgm = ?, fga = ?,
            ftPct = ?, ftm = ?, fta = ?, tpPct = ?, tpm = ?, tpa = ?,
            orpg = ?, drpg = ?, spg = ?, bpg = ?, topg = ?, pfpg = ?,
            ts = ?, efg = ?, updatedAt = NOW()
          WHERE fullName = ?`,
          [
            player.position, teamId, player.gamesPlayed,
            player.ppg, player.rpg, player.apg, player.fgPct, player.fgm, player.fga,
            player.ftPct, player.ftm, player.fta, player.tpPct, player.tpm, player.tpa,
            player.orpg, player.drpg, player.spg, player.bpg, player.topg, player.pfpg,
            player.ts, player.efg, player.fullName
          ]
        );
        updated++;
      } else {
        // Insert new player
        await connection.execute(
          `INSERT INTO players (
            fullName, position, teamId, gamesPlayed,
            ppg, rpg, apg, fgPct, fgm, fga,
            ftPct, ftm, fta, tpPct, tpm, tpa,
            orpg, drpg, spg, bpg, topg, pfpg,
            ts, efg, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            player.fullName, player.position, teamId, player.gamesPlayed,
            player.ppg, player.rpg, player.apg, player.fgPct, player.fgm, player.fga,
            player.ftPct, player.ftm, player.fta, player.tpPct, player.tpm, player.tpa,
            player.orpg, player.drpg, player.spg, player.bpg, player.topg, player.pfpg,
            player.ts, player.efg
          ]
        );
        inserted++;
      }
      
    } catch (err) {
      console.error(`Error processing ${player.fullName}:`, err.message);
      errors++;
    }
  }
  
  await connection.end();
  
  console.log(`\nImport complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${players.length}`);
}

main().catch(console.error);
