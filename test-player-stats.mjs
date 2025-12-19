import fetch from 'node-fetch';

async function testPlayerStats() {
  try {
    const response = await fetch('http://localhost:3000/api/trpc/nba.getPlayerByName?input={"name":"LeBron"}', {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('✓ Player Stats Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

testPlayerStats();
