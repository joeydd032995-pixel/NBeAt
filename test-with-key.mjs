import axios from 'axios';

const BDL_BASE = "https://api.balldontlie.io/v1";
const BDL_API_KEY = "67d91449-01fe-4c1d-be31-d327dae9e61a";

async function testSeasonStats() {
  try {
    console.log("Testing season_averages endpoint with explicit key...");
    
    const resp = await axios.get(`${BDL_BASE}/season_averages`, {
      params: { season: 2024, per_page: 3 },
      headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      timeout: 10000,
    });
    
    console.log("✓ Status:", resp.status);
    console.log("✓ Stats count:", resp.data.data ? resp.data.data.length : 0);
    if (resp.data.data && resp.data.data.length > 0) {
      console.log("✓ Sample stat keys:", Object.keys(resp.data.data[0]).slice(0, 10));
    }
  } catch (error) {
    console.error("✗ Error:", error.response?.status, error.response?.data?.message || error.message);
  }
}

testSeasonStats();
