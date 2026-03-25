import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import ScoreForm from '../components/ScoreForm';
import CharityPicker from '../components/CharityPicker';
import SubscriptionCard from '../components/SubscriptionCard';
import DrawPanel from '../components/DrawPanel';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [charities, setCharities] = useState([]);
  const [draws, setDraws] = useState([]);
  const [message, setMessage] = useState('');
  const [savedHighlight, setSavedHighlight] = useState(null);
  const [proofDrawId, setProofDrawId] = useState('');
  const [proofTier, setProofTier] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofMsg, setProofMsg] = useState('');

  async function load() {
    const [meRes, charityRes, drawRes] = await Promise.all([
      fetch('/api/me'),
      fetch('/api/charities'),
      fetch('/api/draws')
    ]);

    const me = await meRes.json();
    const cs = await charityRes.json();
    const ds = await drawRes.json();

    setUser(me.user || null);
    setCharities(cs.charities || []);
    setDraws(ds.draws || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function subscriptionAction(action, plan) {
    const endpoint =
      action === 'activate' ? '/api/subscription/activate' : '/api/subscription/cancel';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: action === 'activate' ? JSON.stringify({ plan }) : JSON.stringify({})
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      setMessage(action === 'activate' ? `Subscribed on ${plan} plan.` : 'Subscription cancelled.');
    } else {
      setMessage(data.error || 'Subscription update failed');
    }
  }

  async function changePlan(plan) {
    const res = await fetch('/api/subscription/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      setMessage(`Plan switched to ${plan}.`);
    } else {
      setMessage(data.error || 'Unable to change plan');
    }
  }

  async function uploadProof(e) {
    e.preventDefault();
    if (!proofFile || !proofDrawId || !proofTier) {
      setProofMsg('Choose a draw, tier, and file.');
      return;
    }

    setUploadingProof(true);
    setProofMsg('');

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read file'));
        reader.readAsDataURL(proofFile);
      });

      const res = await fetch('/api/winners/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawId: proofDrawId,
          tier: proofTier,
          fileName: proofFile.name,
          mimeType: proofFile.type,
          dataUrl
        })
      });

      const data = await res.json();
      setUploadingProof(false);

      if (!res.ok) {
        setProofMsg(data.error || 'Upload failed');
        return;
      }

      setProofMsg('Proof uploaded for review.');
      setProofFile(null);
      setProofTier('');
      setProofDrawId('');
      await load();
    } catch (error) {
      setUploadingProof(false);
      setProofMsg(error.message || 'Something went wrong.');
    }
  }

  const latestScores = useMemo(
    () =>
      [...(user?.scores || [])].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    [user]
  );

  const winnings = user?.winnings || [];
  const proofCandidates = winnings.filter(w => w.status !== 'paid');

  if (!user) {
    return (
      <Layout>
        <div className="card">
          <h2>Please log in</h2>
          <p className="small">
            You need an account to access the subscriber dashboard.
          </p>
        </div>
      </Layout>
    );
  }

  const active = user.subscription?.status === 'active' && !user.subscription?.lapsed;
  const newest = latestScores[0];

  return (
    <Layout user={user}>
      <div className="card">
        <div className="kicker">Subscriber dashboard</div>
        <h2>{user.name}</h2>
        <div className="course-strip" />
        <p className="small">{user.email}</p>

        {newest ? (
          <div className="score-saved">
            Latest saved score: {newest.value} on {new Date(newest.date).toLocaleDateString()}
          </div>
        ) : null}

        {message ? <div className="notice">{message}</div> : null}

        <div className="grid-3" style={{ marginTop: 18 }}>
          <StatCard
            label="Scores kept"
            value={latestScores.length}
            hint="Only latest 5 stored"
          />
          <StatCard
            label="Draw entries"
            value={draws.length}
            hint="Monthly simulation history"
          />
          <StatCard
            label="Winnings"
            value={(user.winnings || []).length}
            hint="Pending / approved tracking"
          />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <SubscriptionCard
          user={user}
          onAction={subscriptionAction}
          onPlanChange={changePlan}
        />
        <div className="card">
          <h3>How the subscription works</h3>
          <p className="small">
            Choose monthly or yearly, activate the plan, and the renewal date updates automatically.
            Inactive or lapsed users cannot save scores or update charity preferences.
          </p>
          <div className="notice">
            Current access: <b>{active ? 'Active subscriber' : 'Restricted'}</b>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <ScoreForm
          disabled={!active}
          onCreated={(scores) => {
            setUser(prev => ({ ...prev, scores }));
            const newestSaved = scores?.[0];
            if (newestSaved) {
              setSavedHighlight(`${newestSaved.value}-${newestSaved.date}`);
            }
          }}
        />

        <CharityPicker
          charities={charities}
          selectedId={user.charityId}
          disabled={!active}
          onSaved={(updatedUser) => setUser(updatedUser)}
        />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <h3>Latest 5 scores</h3>
          <p className="small">Your newest saved score is highlighted below.</p>

          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {latestScores.length ? (
                latestScores.map((s, i) => {
                  const isNewest = i === 0;
                  const isSaved = savedHighlight === `${s.value}-${s.date}`;

                  return (
                    <tr
                      key={i}
                      className={`score-row ${isNewest ? 'newest' : ''} ${isSaved ? 'saved' : ''}`}
                    >
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td>{s.value}</td>
                      <td>
                        {isSaved ? (
                          <span className="score-saved">✓ Saved</span>
                        ) : isNewest ? (
                          'Latest'
                        ) : (
                          'Saved'
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3">No scores yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DrawPanel draws={draws} userIsAdmin={user.role === 'admin'} />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <h3>Winnings overview</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Draw</th>
                <th>Tier</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {winnings.length ? (
                winnings.map((w, i) => (
                  <tr key={i}>
                    <td>{w.drawId}</td>
                    <td>{w.tier}</td>
                    <td>₹{w.amount}</td>
                    <td>{w.status}</td>
                    <td>{w.verificationStatus}</td>
                    <td>{w.proofStatus || 'pending'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No winnings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="card" onSubmit={uploadProof}>
          <h3>Upload winner proof</h3>
          <p className="small">
            Attach a screenshot or document for any winning entry that still needs admin review.
          </p>

          <label className="label">Winning draw</label>
          <select value={proofDrawId} onChange={e => setProofDrawId(e.target.value)} disabled={!proofCandidates.length}>
            <option value="">Select draw</option>
            {proofCandidates.map(w => (
              <option key={`${w.drawId}-${w.tier}`} value={w.drawId}>
                {w.drawId} · {w.tier} · {w.verificationStatus}
              </option>
            ))}
          </select>

          <label className="label">Tier</label>
          <select value={proofTier} onChange={e => setProofTier(e.target.value)} disabled={!proofCandidates.length}>
            <option value="">Select tier</option>
            {['five', 'four', 'three'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <label className="label">File</label>
          <input
            className="input"
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setProofFile(e.target.files?.[0] || null)}
            disabled={!proofCandidates.length}
          />

          <div className="actions">
            <button className="btn" disabled={uploadingProof || !proofCandidates.length}>
              {uploadingProof ? 'Uploading...' : 'Upload proof'}
            </button>
          </div>

          {proofMsg ? <p className="small">{proofMsg}</p> : null}
          {!proofCandidates.length ? <div className="notice">No pending winnings available for proof upload.</div> : null}
        </form>
      </div>
    </Layout>
  );
}
