
import { useState } from 'react';

export default function CharityPicker({ charities, selectedId, onSaved, disabled = false }) {
  const [charityId, setCharityId] = useState(selectedId || charities?.[0]?.id || '');
  const [pct, setPct] = useState(10);
  const [extraDonation, setExtraDonation] = useState(0);
  const [msg, setMsg] = useState('');

  async function save() {
    const res = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charityId, charityContribution: Number(pct), extraDonation: Number(extraDonation) })
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || 'Save failed');
    setMsg('Preferences saved.');
    onSaved?.(data.user);
  }

  return (
    <div className="card">
      <h3>Charity preference</h3>
      <p className="small">Choose a charity and set your donation split. Active subscribers can save preferences.</p>
      <label className="label">Choose charity</label>
      <select value={charityId} onChange={e => setCharityId(e.target.value)} disabled={disabled}>
        {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <label className="label">Contribution % (min 10)</label>
      <input className="input" type="number" min="10" max="100" value={pct} onChange={e => setPct(e.target.value)} disabled={disabled} />
      <label className="label">Extra donation</label>
      <input className="input" type="number" min="0" value={extraDonation} onChange={e => setExtraDonation(e.target.value)} disabled={disabled} />
      <div className="actions">
        <button className="btn" onClick={save} type="button" disabled={disabled}>Save charity settings</button>
      </div>
      {disabled ? <div className="notice">Subscription required to save charity preferences.</div> : null}
      {msg ? <p className="small">{msg}</p> : null}
    </div>
  );
}
