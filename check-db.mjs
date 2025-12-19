import mysql from 'mysql2/promise';

async function checkDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'nba_betting'
    });
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM players LIMIT 1');
    console.log('Players in DB:', rows[0].count);
    
    const [sample] = await connection.execute('SELECT fullName, ppg, rpg, apg FROM players LIMIT 3');
    console.log('Sample players:', sample);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDB();
