import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace_')) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters in server/.env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((value) => value.trim());
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin not allowed by CORS'));
} }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', service: 'PayFlow API', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', message: 'Database unavailable' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.message === 'Origin not allowed by CORS') return res.status(403).json({ message: 'Origin not allowed.' });
  return res.status(500).json({ message: 'Something went wrong. Check the API logs.' });
});

const port = Number(process.env.PORT || 5000);
app.listen(port, '0.0.0.0', () => console.log(`PayFlow API listening on port ${port}`));

process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
