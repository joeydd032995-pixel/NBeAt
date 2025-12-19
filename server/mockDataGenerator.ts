import { bulkUpsertPlayers, upsertTeam } from "./db";
import { InsertPlayer, InsertTeam } from "../drizzle/schema";

// Real NBA teams
const NBA_TEAMS = [
  { id: 1, abbr: "atl", name: "Atlanta Hawks", slug: "atlanta-hawks" },
  { id: 2, abbr: "bos", name: "Boston Celtics", slug: "boston-celtics" },
  { id: 3, abbr: "brk", name: "Brooklyn Nets", slug: "brooklyn-nets" },
  { id: 4, abbr: "cha", name: "Charlotte Hornets", slug: "charlotte-hornets" },
  { id: 5, abbr: "chi", name: "Chicago Bulls", slug: "chicago-bulls" },
  { id: 6, abbr: "cle", name: "Cleveland Cavaliers", slug: "cleveland-cavaliers" },
  { id: 7, abbr: "dal", name: "Dallas Mavericks", slug: "dallas-mavericks" },
  { id: 8, abbr: "den", name: "Denver Nuggets", slug: "denver-nuggets" },
  { id: 9, abbr: "det", name: "Detroit Pistons", slug: "detroit-pistons" },
  { id: 10, abbr: "gsw", name: "Golden State Warriors", slug: "golden-state-warriors" },
  { id: 11, abbr: "hou", name: "Houston Rockets", slug: "houston-rockets" },
  { id: 12, abbr: "ind", name: "Indiana Pacers", slug: "indiana-pacers" },
  { id: 13, abbr: "lac", name: "LA Clippers", slug: "la-clippers" },
  { id: 14, abbr: "lal", name: "Los Angeles Lakers", slug: "los-angeles-lakers" },
  { id: 15, abbr: "mem", name: "Memphis Grizzlies", slug: "memphis-grizzlies" },
  { id: 16, abbr: "mia", name: "Miami Heat", slug: "miami-heat" },
  { id: 17, abbr: "mil", name: "Milwaukee Bucks", slug: "milwaukee-bucks" },
  { id: 18, abbr: "min", name: "Minnesota Timberwolves", slug: "minnesota-timberwolves" },
  { id: 19, abbr: "nop", name: "New Orleans Pelicans", slug: "new-orleans-pelicans" },
  { id: 20, abbr: "nyk", name: "New York Knicks", slug: "new-york-knicks" },
  { id: 21, abbr: "okc", name: "Oklahoma City Thunder", slug: "oklahoma-city-thunder" },
  { id: 22, abbr: "orl", name: "Orlando Magic", slug: "orlando-magic" },
  { id: 23, abbr: "phi", name: "Philadelphia 76ers", slug: "philadelphia-76ers" },
  { id: 24, abbr: "phx", name: "Phoenix Suns", slug: "phoenix-suns" },
  { id: 25, abbr: "por", name: "Portland Trail Blazers", slug: "portland-trail-blazers" },
  { id: 26, abbr: "sac", name: "Sacramento Kings", slug: "sacramento-kings" },
  { id: 27, abbr: "sas", name: "San Antonio Spurs", slug: "san-antonio-spurs" },
  { id: 28, abbr: "tor", name: "Toronto Raptors", slug: "toronto-raptors" },
  { id: 29, abbr: "uta", name: "Utah Jazz", slug: "utah-jazz" },
  { id: 30, abbr: "was", name: "Washington Wizards", slug: "washington-wizards" },
];

// Real NBA players with realistic stats
const REAL_NBA_PLAYERS = [
  // Superstars
  { firstName: "LeBron", lastName: "James", teamId: 14, position: "F", ppg: 25.7, fgm: 9.2, fga: 19.3, fgPct: 47.8, ftm: 5.0, fta: 6.9, ftPct: 72.3, tpm: 2.5, tpa: 7.1, tpPct: 35.2, rpg: 8.1, orpg: 1.0, drpg: 7.1, apg: 8.3, topg: 2.3, spg: 1.2, bpg: 0.6, pfpg: 1.8, ts: 62.1, efg: 54.2, gp: 71, mpg: 35.8 },
  { firstName: "Luka", lastName: "Doncic", teamId: 7, position: "G", ppg: 32.4, fgm: 11.3, fga: 24.1, fgPct: 46.9, ftm: 7.2, fta: 8.8, ftPct: 81.8, tpm: 2.8, tpa: 8.1, tpPct: 34.6, rpg: 8.9, orpg: 1.2, drpg: 7.7, apg: 9.8, topg: 2.9, spg: 1.1, bpg: 0.4, pfpg: 2.1, ts: 63.5, efg: 55.1, gp: 70, mpg: 37.2 },
  { firstName: "Giannis", lastName: "Antetokounmpo", teamId: 17, position: "F", ppg: 30.1, fgm: 11.2, fga: 21.3, fgPct: 52.6, ftm: 8.9, fta: 11.2, ftPct: 79.4, tpm: 1.2, tpa: 3.8, tpPct: 31.6, rpg: 11.8, orpg: 2.3, drpg: 9.5, apg: 6.5, topg: 2.8, spg: 1.0, bpg: 1.1, pfpg: 2.4, ts: 66.2, efg: 57.3, gp: 72, mpg: 34.1 },
  { firstName: "Kevin", lastName: "Durant", teamId: 3, position: "F", ppg: 29.1, fgm: 10.5, fga: 21.2, fgPct: 49.6, ftm: 5.8, fta: 6.9, ftPct: 84.1, tpm: 2.3, tpa: 6.2, tpPct: 37.1, rpg: 6.7, orpg: 0.8, drpg: 5.9, apg: 5.2, topg: 1.9, spg: 1.3, bpg: 1.6, pfpg: 1.7, ts: 64.8, efg: 56.4, gp: 68, mpg: 33.5 },
  { firstName: "Jayson", lastName: "Tatum", teamId: 2, position: "F", ppg: 28.8, fgm: 10.2, fga: 21.8, fgPct: 46.8, ftm: 6.1, fta: 7.3, ftPct: 83.6, tpm: 2.4, tpa: 7.1, tpPct: 33.8, rpg: 9.1, orpg: 1.4, drpg: 7.7, apg: 5.1, topg: 2.2, spg: 1.2, bpg: 0.9, pfpg: 2.3, ts: 61.2, efg: 53.7, gp: 74, mpg: 35.2 },
  { firstName: "Shai", lastName: "Gilgeous-Alexander", teamId: 21, position: "G", ppg: 30.1, fgm: 11.4, fga: 23.2, fgPct: 49.2, ftm: 6.7, fta: 7.8, ftPct: 85.9, tpm: 1.8, tpa: 5.1, tpPct: 35.3, rpg: 5.2, orpg: 0.7, drpg: 4.5, apg: 8.9, topg: 2.1, spg: 1.9, bpg: 0.5, pfpg: 1.6, ts: 65.4, efg: 54.8, gp: 69, mpg: 34.8 },
  { firstName: "Stephen", lastName: "Curry", teamId: 10, position: "G", ppg: 26.4, fgm: 9.3, fga: 20.1, fgPct: 46.3, ftm: 3.2, fta: 3.8, ftPct: 84.2, tpm: 4.1, tpa: 10.2, tpPct: 40.1, rpg: 4.5, orpg: 0.6, drpg: 3.9, apg: 6.8, topg: 2.3, spg: 1.1, bpg: 0.3, pfpg: 1.9, ts: 63.1, efg: 58.9, gp: 71, mpg: 32.4 },
  { firstName: "Damian", lastName: "Lillard", teamId: 26, position: "G", ppg: 24.3, fgm: 8.7, fga: 19.4, fgPct: 44.9, ftm: 4.1, fta: 4.8, ftPct: 85.4, tpm: 2.9, tpa: 8.3, tpPct: 34.9, rpg: 3.1, orpg: 0.4, drpg: 2.7, apg: 7.2, topg: 2.4, spg: 0.9, bpg: 0.2, pfpg: 1.8, ts: 61.5, efg: 52.3, gp: 68, mpg: 33.1 },
  { firstName: "Nikola", lastName: "Jokic", teamId: 8, position: "C", ppg: 24.5, fgm: 9.1, fga: 17.8, fgPct: 51.2, ftm: 4.3, fta: 5.2, ftPct: 82.7, tpm: 1.6, tpa: 4.1, tpPct: 39.0, rpg: 11.8, orpg: 2.1, drpg: 9.7, apg: 9.0, topg: 2.6, spg: 1.2, bpg: 0.8, pfpg: 2.2, ts: 64.3, efg: 56.1, gp: 76, mpg: 33.9 },
  { firstName: "Kawhi", lastName: "Leonard", teamId: 13, position: "F", ppg: 23.8, fgm: 8.9, fga: 19.2, fgPct: 46.4, ftm: 3.7, fta: 4.3, ftPct: 86.0, tpm: 2.1, tpa: 5.8, tpPct: 36.2, rpg: 3.9, orpg: 0.5, drpg: 3.4, apg: 3.8, topg: 1.4, spg: 1.8, bpg: 0.6, pfpg: 1.5, ts: 62.8, efg: 54.9, gp: 64, mpg: 31.2 },
  // All-Stars
  { firstName: "Devin", lastName: "Booker", teamId: 24, position: "G", ppg: 27.1, fgm: 9.8, fga: 21.3, fgPct: 46.0, ftm: 5.2, fta: 6.1, ftPct: 85.2, tpm: 2.5, tpa: 7.2, tpPct: 34.7, rpg: 4.3, orpg: 0.6, drpg: 3.7, apg: 7.1, topg: 2.2, spg: 1.0, bpg: 0.3, pfpg: 1.9, ts: 62.4, efg: 53.2, gp: 72, mpg: 34.5 },
  { firstName: "Donovan", lastName: "Mitchell", teamId: 2, position: "G", ppg: 26.9, fgm: 9.6, fga: 21.1, fgPct: 45.5, ftm: 4.8, fta: 5.7, ftPct: 84.2, tpm: 2.3, tpa: 6.9, tpPct: 33.3, rpg: 4.8, orpg: 0.7, drpg: 4.1, apg: 6.3, topg: 2.0, spg: 1.4, bpg: 0.4, pfpg: 2.1, ts: 61.7, efg: 52.1, gp: 70, mpg: 33.8 },
  { firstName: "Tyrese", lastName: "Haliburton", teamId: 12, position: "G", ppg: 20.7, fgm: 7.4, fga: 16.2, fgPct: 45.7, ftm: 3.1, fta: 3.6, ftPct: 86.1, tpm: 2.8, tpa: 7.3, tpPct: 38.4, rpg: 3.2, orpg: 0.4, drpg: 2.8, apg: 10.9, topg: 1.8, spg: 1.6, bpg: 0.2, pfpg: 1.4, ts: 63.2, efg: 55.8, gp: 68, mpg: 32.1 },
  { firstName: "Anthony", lastName: "Davis", teamId: 14, position: "F", ppg: 25.9, fgm: 9.7, fga: 18.3, fgPct: 53.0, ftm: 5.1, fta: 6.8, ftPct: 75.0, tpm: 0.8, tpa: 2.1, tpPct: 38.1, rpg: 12.5, orpg: 2.8, drpg: 9.7, apg: 2.6, topg: 1.9, spg: 1.1, bpg: 2.1, pfpg: 2.3, ts: 65.3, efg: 55.2, gp: 76, mpg: 32.4 },
  { firstName: "Jimmy", lastName: "Butler", teamId: 16, position: "F", ppg: 22.9, fgm: 8.1, fga: 17.4, fgPct: 46.6, ftm: 5.3, fta: 6.2, ftPct: 85.5, tpm: 1.1, tpa: 3.2, tpPct: 34.4, rpg: 5.9, orpg: 1.2, drpg: 4.7, apg: 5.3, topg: 2.1, spg: 1.9, bpg: 0.7, pfpg: 2.0, ts: 62.1, efg: 51.8, gp: 62, mpg: 31.5 },
  { firstName: "LaMelo", lastName: "Ball", teamId: 4, position: "G", ppg: 23.5, fgm: 8.3, fga: 18.9, fgPct: 43.9, ftm: 3.2, fta: 4.1, ftPct: 78.0, tpm: 3.1, tpa: 8.7, tpPct: 35.6, rpg: 5.1, orpg: 0.8, drpg: 4.3, apg: 8.7, topg: 2.5, spg: 1.3, bpg: 0.3, pfpg: 1.7, ts: 59.4, efg: 50.2, gp: 71, mpg: 33.2 },
  { firstName: "Paolo", lastName: "Banchero", teamId: 22, position: "F", ppg: 24.1, fgm: 8.9, fga: 19.2, fgPct: 46.4, ftm: 4.7, fta: 5.8, ftPct: 81.0, tpm: 1.9, tpa: 5.3, tpPct: 35.8, rpg: 8.2, orpg: 1.4, drpg: 6.8, apg: 3.9, topg: 2.3, spg: 0.9, bpg: 0.8, pfpg: 2.2, ts: 61.3, efg: 52.7, gp: 73, mpg: 32.8 },
  { firstName: "Victor", lastName: "Wembanyama", teamId: 27, position: "F", ppg: 21.4, fgm: 7.8, fga: 16.7, fgPct: 46.7, ftm: 3.2, fta: 4.1, ftPct: 78.0, tpm: 1.8, tpa: 5.1, tpPct: 35.3, rpg: 10.6, orpg: 2.1, drpg: 8.5, apg: 3.5, topg: 2.0, spg: 1.2, bpg: 2.3, pfpg: 2.0, ts: 60.8, efg: 51.4, gp: 71, mpg: 31.5 },
];

export async function generateMockData(): Promise<{ playersCount: number; teamsCount: number }> {
  try {
    console.log("[Mock Data Generator] Starting mock data generation...");

    // Insert teams
    for (const team of NBA_TEAMS) {
      await upsertTeam({
        abbr: team.abbr,
        name: team.name,
        slug: team.slug,
      });
    }
    console.log(`[Mock Data Generator] Inserted ${NBA_TEAMS.length} teams`);

    // Generate players with realistic stats
    const playersToInsert: InsertPlayer[] = [];
    let playerId = 1;

    for (const player of REAL_NBA_PLAYERS) {
      playersToInsert.push({
        externalId: playerId++,
        firstName: player.firstName,
        lastName: player.lastName,
        fullName: `${player.firstName} ${player.lastName}`,
        teamId: player.teamId,
        position: player.position,
        ppg: player.ppg.toFixed(1),
        fgm: player.fgm.toFixed(1),
        fga: player.fga.toFixed(1),
        fgPct: player.fgPct.toFixed(1),
        ftm: player.ftm.toFixed(1),
        fta: player.fta.toFixed(1),
        ftPct: player.ftPct.toFixed(1),
        tpm: player.tpm.toFixed(1),
        tpa: player.tpa.toFixed(1),
        tpPct: player.tpPct.toFixed(1),
        rpg: player.rpg.toFixed(1),
        orpg: player.orpg.toFixed(1),
        drpg: player.drpg.toFixed(1),
        apg: player.apg.toFixed(1),
        topg: player.topg.toFixed(1),
        spg: player.spg.toFixed(1),
        bpg: player.bpg.toFixed(1),
        pfpg: player.pfpg.toFixed(1),
        ts: player.ts.toFixed(1),
        efg: player.efg.toFixed(1),
        gamesPlayed: player.gp,
        minutesPerGame: player.mpg.toFixed(1),
      });
    }

    await bulkUpsertPlayers(playersToInsert);
    console.log(`[Mock Data Generator] Inserted ${playersToInsert.length} players with realistic stats`);

    return {
      playersCount: playersToInsert.length,
      teamsCount: NBA_TEAMS.length,
    };
  } catch (error) {
    console.error("[Mock Data Generator] Error:", error);
    throw error;
  }
}
