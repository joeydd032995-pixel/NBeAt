import axios from 'axios';

const BDL_BASE = "https://api.balldontlie.io/v1";
const BDL_API_KEY = "67d91449-01fe-4c1d-be31-d327dae9e61a";

async function testPlayers() {
  try {
    console.log("Testing /players endpoint...");
    
    const resp = await axios.get(`${BDL_BASE}/players`, {
      params: { per_page: 2 },
      headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      timeout: 10000,
    });
    
    console.log("✓ Players endpoint works");
    console.log("✓ Player count:", resp.data.data.length);
    console.log("✓ Sample player:", resp.data.data[0].first_name, resp.data.data[0].last_name);
  } catch (error) {
    console.error("✗ Players endpoint error:", error.response?.status);
  }
  
  try {
    console.log("\nTesting /season_averages endpoint...");
    
    const resp = await axios.get(`${BDL_BASE}/season_averages`, {
      params: { season: 2024, per_page: 2 },
      headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      timeout: 10000,
    });
    
    console.log("✓ Season averages endpoint works");
    console.log("✓ Stats count:", resp.data.data.length);
  } catch (error) {
    console.error("✗ Season averages error:", error.response?.status);
    console.error("  Message:", error.response?.data?.message || error.message);
  }
}

testPlayers();
