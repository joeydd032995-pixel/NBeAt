import axios from 'axios';

const BDL_BASE = "https://api.balldontlie.io/v1";
const BDL_API_KEY = "67d91449-01fe-4c1d-be31-d327dae9e61a";

async function testEndpoints() {
  const endpoints = [
    { name: "/stats", params: { per_page: 2 } },
    { name: "/player_seasons", params: { per_page: 2 } },
    { name: "/season_averages", params: { season: 2024, per_page: 2 } },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const resp = await axios.get(`${BDL_BASE}${endpoint.name}`, {
        params: endpoint.params,
        headers: { Authorization: `Bearer ${BDL_API_KEY}` },
        timeout: 5000,
      });
      
      console.log(`✓ ${endpoint.name}: ${resp.data.data?.length || 0} records`);
    } catch (error) {
      console.log(`✗ ${endpoint.name}: ${error.response?.status || error.code}`);
    }
  }
}

testEndpoints();
