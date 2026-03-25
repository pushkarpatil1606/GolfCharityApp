import { useState } from 'react';

export default function ScoreForm({ onCreated, disabled = false }) {
  const [value, setValue] = useState(18);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();

    if (disabled) {
      setMessage('Subscription is inactive. Activate it to save scores.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: Number(value), date })
      });

      const data = await res.json();
      setSaving(false);

      if (!res.ok) {
        return setMessage(data.error || 'Unable to save score');
      }

      setMessage(`Saved score ${value} for ${date}.`);

      if (onCreated) {
        onCreated(data.scores, { value: Number(value), date });
      }
    } catch (error) {
      setSaving(false);
      setMessage('Something went wrong while saving the score.');
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>Add golf score</h3>
      <p className="small">
        Accepts 1-45. Only the latest 5 scores are retained in reverse chronological order.
      </p>

      <label className="label">Score</label>
      <input
        className="input"
        type="number"
        min="1"
        max="45"
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={disabled}
      />

      <label className="label">Date</label>
      <input
        className="input"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        disabled={disabled}
      />

      <div className="actions">
        <button className="btn" disabled={saving || disabled}>
          {saving ? 'Saving...' : 'Save score'}
        </button>
      </div>

      {message ? (
        <p className="small">
          <span className="score-saved">✓ {message}</span>
        </p>
      ) : null}
    </form>
  );
}