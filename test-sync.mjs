import axios from 'axios';

const API_URL = 'http://localhost:3000/api/trpc/nba.syncData';

async function testSync() {
  try {
    console.log('Testing data sync endpoint...');
    const response = await axios.post(API_URL, {});
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSync();
