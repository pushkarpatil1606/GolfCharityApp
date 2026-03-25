import { useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('user@demo.com');
  const [password, setPassword] = useState('user123');
  const [name, setName] = useState('New User');
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login' ? { email, password } : { email, password, name };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || 'Unable to continue');
    window.location.href = '/dashboard';
  }

  return (
    <Layout>
      <div className="grid-2">
        <div className="card">
          <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <p className="small">Use the demo credentials or create a new subscriber account.</p>
          <form onSubmit={submit}>
            {mode === 'register' ? (
              <>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} />
              </>
            ) : null}
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <div className="actions">
              <button className="btn" type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
              <button className="btn secondary" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Need an account?' : 'Have an account?'}
              </button>
            </div>
          </form>
          {msg ? <p className="small">{msg}</p> : null}
        </div>
        <div className="card">
          <h3>Included workflows</h3>
          <p className="small">Login, sign-up, subscription activation, score entry, charity selection, draw simulation, publish, and winner verification.</p>
          <div className="notice">
            Admin access is available at <b>admin@demo.com with password: admin123</b>. Use the admin dashboard to run the monthly draw.
          </div>
          <hr className="hr" />
          <Link href="/dashboard" className="btn secondary">Go to dashboard</Link>
        </div>
      </div>
    </Layout>
  );
}
