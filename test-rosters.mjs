import axios from 'axios';

const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

async function testRosters() {
  try {
    console.log("Fetching teams...");
    const teamsResp = await axios.get(`${ESPN_API_BASE}/teams`, { timeout: 10000 });
    const teams = teamsResp.data?.sports?.[0]?.leagues?.[0]?.teams || [];
    console.log(`✓ Fetched ${teams.length} teams`);
    
    if (teams.length > 0) {
      const firstTeam = teams[0].team;
      console.log(`\nFetching roster for ${firstTeam.displayName} (ID: ${firstTeam.id})...`);
      
      const rosterResp = await axios.get(`${ESPN_API_BASE}/teams/${firstTeam.id}/roster`, { timeout: 15000 });
      const athletes = rosterResp.data?.athletes || [];
      console.log(`✓ Fetched ${athletes.length} athletes`);
      
      if (athletes.length > 0) {
        console.log(`\nFirst athlete: ${athletes[0].displayName}`);
      }
    }
  } catch (error) {
    console.error("✗ Error:", error.message);
  }
}

testRosters();
