import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { formatUser } from '../utils.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be 2–80 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ message: 'Password must be 8–72 characters.' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    await connection.execute('INSERT INTO wallets (user_id, balance_paise) VALUES (?, 0)', [result.insertId]);
    await connection.commit();
    const user = { id: result.insertId, name, email };
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: '1d' });
    return res.status(201).json({ user, token });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account with this email already exists.' });
    return next(error);
  } finally {
    connection.release();
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const [rows] = await pool.execute('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1', [email]);
    const row = rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(row.id), expiresIn: '1d' });
    return res.json({ user: formatUser(row), token });
  } catch (error) {
    return next(error);
  }
});

export default router;
