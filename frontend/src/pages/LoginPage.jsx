import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

// TESTING ONLY — remove before going live.
const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'supersecret' },
  { label: 'Cashier', username: 'cashier1', password: 'mypassword' },
];

const PEARLS = [
  { top: '8%', left: '10%', size: 90, color: 'var(--taro-400)' },
  { top: '70%', left: '6%', size: 60, color: 'var(--honey-400)' },
  { top: '15%', left: '85%', size: 70, color: 'var(--honey-500)' },
  { top: '78%', left: '88%', size: 100, color: 'var(--taro-500)' },
  { top: '45%', left: '92%', size: 40, color: 'var(--tea-300)' },
  { top: '85%', left: '45%', size: 50, color: 'var(--taro-400)' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/admin' : '/cashier', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      {PEARLS.map((p, i) => (
        <span
          key={i}
          className="login-pearl"
          aria-hidden="true"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
          }}
        />
      ))}

      <motion.div
        className="ticket-card"
        initial={{ opacity: 0, y: 30, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span className="ticket-badge">🧋</span>

        <div className="ticket-section ticket-header">
          <h1>Honey's Milktea Shop</h1>
        </div>

        <div className="ticket-perforation" aria-hidden="true" />

        <div className="ticket-section ticket-body">
          <p className="ticket-subtitle">Sign in to continue</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && (
              <motion.p className="login-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              className="login-submit"
              disabled={submitting}
              whileHover={{ scale: 1.03, rotate: -1 }}
              whileTap={{ scale: 0.97, rotate: 0 }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </form>

          <p className="login-footnote">Cashiers and admins both sign in here.</p>

          <div className="demo-panel">
            <p className="demo-title">Testing credentials</p>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                className="demo-account"
                onClick={() => {
                  setUsername(acc.username);
                  setPassword(acc.password);
                }}
              >
                <span className="demo-role">{acc.label}</span>
                <span className="demo-creds">{acc.username} / {acc.password}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}