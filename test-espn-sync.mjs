import axios from 'axios';

async function testESPNSync() {
  try {
    console.log("Testing ESPN data sync endpoint...");
    
    const resp = await axios.post('http://localhost:3000/api/trpc/nba.syncESPNData', {}, {
      timeout: 300000,
    });
    
    console.log("✓ Response:", JSON.stringify(resp.data, null, 2));
  } catch (error) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

testESPNSync();
