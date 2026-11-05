import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { amountToPaise } from '../utils.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const [[walletRows], [transactionRows]] = await Promise.all([
      pool.execute('SELECT balance_paise FROM wallets WHERE user_id = ?', [req.userId]),
      pool.execute(
        `SELECT t.id, t.type, t.amount_paise, t.note, t.created_at,
                sender.name AS sender_name, receiver.name AS receiver_name,
                t.from_user_id, t.to_user_id
         FROM wallet_transactions t
         LEFT JOIN users sender ON sender.id = t.from_user_id
         LEFT JOIN users receiver ON receiver.id = t.to_user_id
         WHERE t.from_user_id = ? OR t.to_user_id = ?
         ORDER BY t.created_at DESC, t.id DESC LIMIT 50`,
        [req.userId, req.userId]
      )
    ]);
    if (!walletRows[0]) return res.status(404).json({ message: 'Wallet not found.' });
    return res.json({
      balancePaise: Number(walletRows[0].balance_paise),
      transactions: transactionRows.map((row) => ({
        id: row.id,
        type: row.type,
        direction: row.to_user_id === req.userId ? 'in' : 'out',
        amountPaise: Number(row.amount_paise),
        note: row.note,
        counterparty: row.to_user_id === req.userId ? (row.sender_name || 'PayFlow demo') : (row.receiver_name || 'Recipient'),
        createdAt: row.created_at
      }))
    });
  } catch (error) { next(error); }
});

// This endpoint creates simulated wallet funds only. It does not charge a card or bank account.
router.post('/demo-deposit', async (req, res, next) => {
  const amountPaise = amountToPaise(req.body.amount);
  if (!amountPaise) return res.status(400).json({ message: 'Enter an amount from ₹1 to ₹1,00,000 (up to 2 decimals).' });
  const note = String(req.body.note || 'Demo wallet top-up').trim().slice(0, 120);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('SELECT user_id FROM wallets WHERE user_id = ? FOR UPDATE', [req.userId]);
    await connection.execute('UPDATE wallets SET balance_paise = balance_paise + ? WHERE user_id = ?', [amountPaise, req.userId]);
    await connection.execute(
      'INSERT INTO wallet_transactions (reference, type, from_user_id, to_user_id, amount_paise, note) VALUES (?, \'deposit\', NULL, ?, ?, ?)',
      [randomUUID(), req.userId, amountPaise, note]
    );
    await connection.commit();
    return res.status(201).json({ message: 'Demo money added.', amountPaise });
  } catch (error) {
    await connection.rollback(); next(error);
  } finally { connection.release(); }
});

router.post('/transfer', async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const amountPaise = amountToPaise(req.body.amount);
  const note = String(req.body.note || 'PayFlow demo transfer').trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter the recipient account email.' });
  if (!amountPaise) return res.status(400).json({ message: 'Enter an amount from ₹1 to ₹1,00,000 (up to 2 decimals).' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [recipients] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    const recipientId = recipients[0]?.id;
    if (!recipientId) { await connection.rollback(); return res.status(404).json({ message: 'No PayFlow user found with that email.' }); }
    if (Number(recipientId) === req.userId) { await connection.rollback(); return res.status(400).json({ message: 'You cannot transfer money to yourself.' }); }

    // Lock both wallet rows in stable order to reduce deadlock risk during concurrent transfers.
    await connection.execute(
      'SELECT user_id, balance_paise FROM wallets WHERE user_id IN (?, ?) ORDER BY user_id FOR UPDATE',
      [req.userId, recipientId]
    );
    const [debit] = await connection.execute(
      'UPDATE wallets SET balance_paise = balance_paise - ? WHERE user_id = ? AND balance_paise >= ?',
      [amountPaise, req.userId, amountPaise]
    );
    if (debit.affectedRows !== 1) { await connection.rollback(); return res.status(400).json({ message: 'Insufficient wallet balance.' }); }
    await connection.execute('UPDATE wallets SET balance_paise = balance_paise + ? WHERE user_id = ?', [amountPaise, recipientId]);
    await connection.execute(
      'INSERT INTO wallet_transactions (reference, type, from_user_id, to_user_id, amount_paise, note) VALUES (?, \'transfer\', ?, ?, ?, ?)',
      [randomUUID(), req.userId, recipientId, amountPaise, note]
    );
    await connection.commit();
    return res.status(201).json({ message: 'Demo transfer completed.', amountPaise });
  } catch (error) {
    await connection.rollback(); next(error);
  } finally { connection.release(); }
});

export default router;
