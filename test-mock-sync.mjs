import axios from 'axios';

async function testMockSync() {
  try {
    console.log("Testing mock data sync endpoint...");
    
    const resp = await axios.post('http://localhost:3000/api/trpc/nba.syncData', {}, {
      timeout: 60000,
    });
    
    console.log("✓ Response:", JSON.stringify(resp.data, null, 2));
  } catch (error) {
    console.error("✗ Error:", error.response?.data || error.message);
  }
}

testMockSync();
