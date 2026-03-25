import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [draws, setDraws] = useState([]);
  const [charities, setCharities] = useState([]);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('overview');

  async function load() {
    const [me, a, u, d, c] = await Promise.all([
      fetch('/api/me'),
      fetch('/api/admin/analytics'),
      fetch('/api/admin/users'),
      fetch('/api/draws'),
      fetch('/api/charities')
    ]);
    const meJson = await me.json();
    const aJson = await a.json();
    const uJson = await u.json();
    const dJson = await d.json();
    const cJson = await c.json();
    setUser(meJson.user || null);
    setAnalytics(aJson.analytics);
    setUsers(uJson.users || []);
    setDraws(dJson.draws || []);
    setCharities(cJson.charities || []);
  }

  useEffect(() => { load(); }, []);

  if (!user) return <Layout><div className="card"><h2>Admin only</h2><p className="small">Login with the admin demo account.</p></div></Layout>;
  if (user.role !== 'admin') return <Layout user={user}><div className="card"><h2>Access denied</h2></div></Layout>;

  async function run(endpoint, body = {}) {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || 'Action failed');
    setMsg('Action completed.');
    await load();
    return data;
  }

  async function verifyWinnings(userId, drawId, verificationStatus) {
    await run('/api/winners/verify', { userId, drawId, verificationStatus });
  }

  return (
    <Layout user={user}>
      <div className="card">
        <div className="kicker">Admin dashboard</div>
        <h2>Operations center</h2>
        {msg ? <div className="notice">{msg}</div> : null}
        {analytics ? (
          <div className="grid-3" style={{marginTop: 18}}>
            <StatCard label="Total users" value={analytics.totalUsers} />
            <StatCard label="Active users" value={analytics.activeUsers} />
            <StatCard label="Prize pool" value={`₹${analytics.totalPrizePool}`} />
          </div>
        ) : null}

        <div className="tabs" style={{marginTop: 18}}>
          {['overview','draws','users','charities'].map(t => (
            <button key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="grid-2">
            <div className="card">
              <h3>Draw actions</h3>
              <p className="small">Run a simulation, inspect the generated numbers, then publish the result.</p>
              <div className="actions">
                <button className="btn" onClick={() => run('/api/draws/simulate')}>Simulate draw</button>
                <button className="btn secondary" onClick={() => run('/api/draws/publish')}>Publish latest draw</button>
              </div>
            </div>
            <div className="card">
              <h3>Winner verification</h3>
              <p className="small">Mark winner submissions as approved or rejected.</p>
              {draws[0] ? (
                <table className="table">
                  <thead><tr><th>User</th><th>Tier</th><th>Proof</th><th>Action</th></tr></thead>
                  <tbody>
                    {(draws[0].winners.five || []).concat(draws[0].winners.four || [], draws[0].winners.three || []).map((id, idx) => {
                      const u = users.find(x => x.id === id);
                      const tier = idx < (draws[0].winners.five || []).length ? 'five' : idx < ((draws[0].winners.five || []).length + (draws[0].winners.four || []).length) ? 'four' : 'three';
                      const win = u?.winnings?.find(w => w.drawId === draws[0].id && w.tier === tier);
                      return (
                        <tr key={idx}>
                          <td>{u?.name || id}</td>
                          <td>{tier}</td>
                          <td>{win?.proofStatus || 'pending'}</td>
                          <td>
                            <button className="btn secondary" onClick={() => verifyWinnings(id, draws[0].id, 'approved')}>Approve</button>{' '}
                            <button className="btn secondary" onClick={() => verifyWinnings(id, draws[0].id, 'rejected')}>Reject</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <p className="small">No simulated draw yet.</p>}
            </div>
          </div>
        ) : null}

        {tab === 'draws' ? (
          <div className="card">
            <h3>Draw history</h3>
            <table className="table">
              <thead><tr><th>Month</th><th>Status</th><th>Numbers</th><th>Rollover</th></tr></thead>
              <tbody>
                {draws.map(d => (
                  <tr key={d.id}>
                    <td>{d.month}</td>
                    <td>{d.status}</td>
                    <td>{d.drawNumbers.join(', ')}</td>
                    <td>₹{d.rollover || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'users' ? (
          <div className="card">
            <h3>Users</h3>
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Subscription</th><th>Scores</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.subscription?.status}</td>
                    <td>{(u.scores || []).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'charities' ? (
          <div className="card">
            <h3>Charities</h3>
            <table className="table">
              <thead><tr><th>Name</th><th>Region</th><th>Spotlight</th><th>Description</th></tr></thead>
              <tbody>
                {charities.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.region}</td>
                    <td>{c.spotlight ? 'Yes' : 'No'}</td>
                    <td>{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
