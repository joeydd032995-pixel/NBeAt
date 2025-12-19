import axios from 'axios';

async function testLiveSync() {
  try {
    console.log("Testing live stats sync endpoint...");
    
    const resp = await axios.post('http://localhost:3000/api/trpc/nba.syncData', {}, {
      timeout: 60000,
    });
    
    console.log("✓ Response:", JSON.stringify(resp.data, null, 2));
  } catch (error) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

testLiveSync();
