import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nba_betting',
});

const [rows] = await connection.execute(
  'SELECT fullName, ppg, fgm, fga, fgPct, tpm, tpa, rpg, apg, spg, bpg, ts, efg FROM players LIMIT 3'
);

console.log('Sample Player Stats:');
console.log(JSON.stringify(rows, null, 2));

await connection.end();
