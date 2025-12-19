import axios from 'axios';

const BDL_BASE = "https://api.balldontlie.io/v1";
const BDL_API_KEY = process.env.BDL_API_KEY;

async function testAPI() {
  try {
    console.log("Testing players endpoint...");
    const resp = await axios.get(`${BDL_BASE}/players`, {
      params: { per_page: 5 },
      headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      timeout: 10000,
    });
    
    console.log("Players response:", JSON.stringify(resp.data, null, 2));
    
    console.log("\n\nTesting season_averages endpoint...");
    const statsResp = await axios.get(`${BDL_BASE}/season_averages`, {
      params: { season: 2024, per_page: 5 },
      headers: { Authorization: `Bearer ${BDL_API_KEY}` },
      timeout: 10000,
    });
    
    console.log("Stats response:", JSON.stringify(statsResp.data, null, 2));
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testAPI();
