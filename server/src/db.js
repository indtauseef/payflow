import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((key) => !process.env[key] || process.env[key].startsWith('YOUR_'));
if (missing.length) {
  console.warn(`Database settings missing: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2' } : undefined,
  timezone: 'Z',
  supportBigNumbers: true,
  bigNumberStrings: false
});
