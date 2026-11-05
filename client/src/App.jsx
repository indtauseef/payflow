import { useCallback, useEffect, useState } from 'react';
import { api, rupees } from './api.js';

const savedToken = () => localStorage.getItem('payflow_token') || '';

export default function App() {
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('payflow_user') || 'null'); } catch { return null; }
  });
  const [mode, setMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [wallet, setWallet] = useState({ balancePaise: 0, transactions: [] });
  const [deposit, setDeposit] = useState({ amount: '500', note: 'Demo top-up' });
  const [transfer, setTransfer] = useState({ email: '', amount: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadWallet = useCallback(async (activeToken) => {
    const result = await api('/wallet', { token: activeToken });
    setWallet(result);
  }, []);

  useEffect(() => {
    if (!token) return;
    loadWallet(token).catch((err) => {
      setError(err.message);
      if (err.message.toLowerCase().includes('session')) logout();
    });
  }, [token, loadWallet]);

  function logout() {
    localStorage.removeItem('payflow_token');
    localStorage.removeItem('payflow_user');
    setToken(''); setUser(null); setWallet({ balancePaise: 0, transactions: [] });
  }

  async function submitAuth(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify(auth) });
      localStorage.setItem('payflow_token', result.token);
      localStorage.setItem('payflow_user', JSON.stringify(result.user));
      setToken(result.token); setUser(result.user); setMessage('Welcome to PayFlow.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function submitDeposit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await api('/wallet/demo-deposit', { method: 'POST', token, body: JSON.stringify(deposit) });
      await loadWallet(token); setMessage('Demo money added to your wallet.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function submitTransfer(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await api('/wallet/transfer', { method: 'POST', token, body: JSON.stringify(transfer) });
      await loadWallet(token); setTransfer({ email: '', amount: '', note: '' }); setMessage('Demo transfer completed.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (!token) return <div className="auth-page">
    <div className="auth-decoration"><div className="logo"><span className="logo-mark">P</span>payflow<span className="purple">.</span></div><div className="hero-copy"><span className="eyebrow">YOUR MONEY, IN MOTION</span><h1>Simple payments.<br/><span>Clearer control.</span></h1><p>A learning project for digital wallets, secure APIs and practical SQL.</p><div className="hero-pills"><span>↗ Fast transfers</span><span>⌁ Live balance</span><span>▤ Clear history</span></div></div><div className="auth-foot">PAYFLOW · EDUCATIONAL DEMO</div></div>
    <div className="auth-side"><form className="auth-card" onSubmit={submitAuth}><div className="mobile-logo"><span className="logo-mark">P</span>payflow<span className="purple">.</span></div><span className="eyebrow">GET STARTED</span><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="muted">{mode === 'login' ? 'Sign in to open your demo wallet.' : 'Set up a PayFlow demo wallet in seconds.'}</p>
      {mode === 'register' && <label>Full name<input value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="Your name" required minLength="2" maxLength="80"/></label>}
      <label>Email address<input type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" autoComplete="email" required/></label>
      <label>Password<input type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 8 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required/></label>
      {error && <div className="alert error">{error}</div>}{message && <div className="alert success">{message}</div>}
      <button className="btn primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>
      <div className="switch-auth">{mode === 'login' ? "Don't have an account?" : 'Already registered?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></div>
      <div className="demo-note">Demo wallet only. No real money, cards or bank accounts.</div>
    </form></div>
  </div>;

  return <div className="dashboard">
    <aside className="sidebar"><div className="logo"><span className="logo-mark">P</span>payflow<span className="purple">.</span></div><div className="nav-label">WORKSPACE</div><div className="nav-active">▦ <span>Overview</span></div><div className="sidebar-bottom"><div className="safe-card"><div className="safe-icon">✦</div><b>Learning mode</b><p>All balances and transfers are simulated.</p></div><div className="profile"><div className="profile-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'P'}</div><div className="profile-info"><b>{user?.name || 'PayFlow user'}</b><small>{user?.email}</small></div><button className="logout" onClick={logout} title="Sign out">↪</button></div></div></aside>
    <main className="main"><header className="topbar"><div><span className="muted">Workspace</span><span className="slash">/</span><b>Overview</b></div><div className="top-right"><span className="online-dot"/> Secure demo <span className="top-initials">{user?.name?.slice(0, 1)?.toUpperCase() || 'P'}</span></div></header>
      <section className="content"><div className="welcome"><div><span className="eyebrow">YOUR WALLET AT A GLANCE</span><h1>Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1><p className="muted">Here is the latest activity in your PayFlow account.</p></div><span className="demo-tag">● DEMO ACCOUNT</span></div>
      {error && <div className="alert error global-alert">{error}</div>}{message && <div className="alert success global-alert">{message}</div>}
      <section className="summary-grid"><div className="balance-card"><div className="balance-label">Total wallet balance <span>◉</span></div><div className="balance-number">{rupees(wallet.balancePaise)}</div><div className="balance-bottom"><span>Available demo balance</span><span className="card-word">PAYFLOW <b>PF</b></span></div><div className="orb orb-a"/><div className="orb orb-b"/></div><div className="metric-card"><div className="metric-top">Account status <span className="metric-icon green-icon">✓</span></div><strong>Active</strong><small>Demo wallet connected</small><div className="metric-line"><i/></div></div><div className="metric-card"><div className="metric-top">Transactions <span className="metric-icon purple-icon">↔</span></div><strong>{wallet.transactions.length}</strong><small>Latest 50 activities</small><div className="metric-line purple-line"><i/></div></div></section>
      <section className="actions-grid"><form className="panel action-panel" onSubmit={submitDeposit}><div className="panel-heading"><div className="panel-icon add-icon">＋</div><div><h2>Add demo money</h2><p>Simulate a wallet top-up</p></div></div><label>Amount in INR<input type="number" min="1" max="100000" step="0.01" value={deposit.amount} onChange={e => setDeposit({ ...deposit, amount: e.target.value })} placeholder="500.00" required/></label><label>Note<input value={deposit.note} onChange={e => setDeposit({ ...deposit, note: e.target.value })} maxLength="120" placeholder="Demo top-up"/></label><button className="btn primary" disabled={busy}>Add demo money <span>→</span></button></form>
      <form className="panel action-panel" onSubmit={submitTransfer}><div className="panel-heading"><div className="panel-icon send-icon">↗</div><div><h2>Send money</h2><p>Transfer to another PayFlow user</p></div></div><label>Recipient email<input type="email" value={transfer.email} onChange={e => setTransfer({ ...transfer, email: e.target.value })} placeholder="friend@example.com" required/></label><div className="form-row"><label>Amount (INR)<input type="number" min="1" max="100000" step="0.01" value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} placeholder="100" required/></label><label>Note<input value={transfer.note} onChange={e => setTransfer({ ...transfer, note: e.target.value })} maxLength="120" placeholder="For lunch"/></label></div><button className="btn dark" disabled={busy}>Send demo payment <span>→</span></button></form></section>
      <section className="panel history-panel"><div className="history-heading"><div><h2>Recent transactions</h2><p>Your latest wallet activity</p></div><span className="history-count">{wallet.transactions.length} records</span></div>
      {wallet.transactions.length === 0 ? <div className="empty"><div>↔</div><b>No transactions yet</b><span>Add demo money or receive a transfer to get started.</span></div> : <div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>DATE</th><th>TYPE</th><th className="right">AMOUNT</th></tr></thead><tbody>{wallet.transactions.map(tx => <tr key={tx.id}><td><div className="tx-name"><span className={`tx-icon ${tx.direction === 'in' ? 'tx-in' : 'tx-out'}`}>{tx.direction === 'in' ? '↙' : '↗'}</span><div><b>{tx.counterparty}</b><small>{tx.note || 'PayFlow transaction'}</small></div></div></td><td>{new Date(tx.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td><td><span className={`type-pill ${tx.direction}`}>{tx.direction === 'in' ? 'Received' : 'Sent'}</span></td><td className={`right amount ${tx.direction === 'in' ? 'incoming' : ''}`}>{tx.direction === 'in' ? '+' : '−'}{rupees(tx.amountPaise)}</td></tr>)}</tbody></table></div>}</section>
      <footer className="footer"><span>© 2026 PayFlow · Educational project</span><span>Simulated money only. Not a real financial service.</span></footer>
      </section>
    </main>
  </div>;
}
