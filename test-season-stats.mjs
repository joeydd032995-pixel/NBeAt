import axios from 'axios';

const BDL_BASE = "https://api.balldontlie.io/v1";
const BDL_API_KEY = process.env.BDL_API_KEY;

async function testSeasonStats() {
  try {
    console.log("Testing season_averages endpoint...");
    console.log("API Key:", BDL_API_KEY ? "SET" : "NOT SET");
    
    const resp = await axios.get(`${BDL_BASE}/season_averages`, {
      params: { season: 2024, per_page: 5 },
      headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      timeout: 10000,
    });
    
    console.log("Status:", resp.status);
    console.log("Data count:", resp.data.data ? resp.data.data.length : 0);
    console.log("Sample stat:", JSON.stringify(resp.data.data?.[0], null, 2));
  } catch (error) {
    console.error("Error:", error.response?.status, error.response?.data || error.message);
  }
}

testSeasonStats();
