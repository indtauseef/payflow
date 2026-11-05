import dotenv from 'dotenv';
dotenv.config();
const { pool } = await import('./db.js');
try {
  const [rows] = await pool.query('SELECT VERSION() AS version, CURRENT_USER() AS currentUser');
  console.log('Database connection successful:', rows[0]);
} catch (error) {
  console.error('Database connection failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
