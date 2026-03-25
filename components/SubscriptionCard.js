import { useEffect, useState } from 'react';

const PLAN_COPY = {
  monthly: { label: 'Monthly', price: '₹1,000', term: '1 month' },
  yearly: { label: 'Yearly', price: '₹10,000', term: '12 months' }
};

export default function SubscriptionCard({ user, onAction, onPlanChange }) {
  const [plan, setPlan] = useState(user?.subscription?.plan || 'monthly');
  const active = user?.subscription?.status === 'active';

  useEffect(() => {
    setPlan(user?.subscription?.plan || 'monthly');
  }, [user?.subscription?.plan]);

  const details = PLAN_COPY[plan] || PLAN_COPY.monthly;

  return (
    <div className="card sub-panel">
      <div>
        <h3>Subscription</h3>
        <div className={`badge ${active ? 'good' : 'bad'}`}>{active ? 'Active' : 'Inactive'}</div>
      </div>

      <div>
        <label className="label">Choose plan</label>
        <select value={plan} onChange={e => { setPlan(e.target.value); onPlanChange?.(e.target.value); }}>
          <option value="monthly">Monthly - ₹1,000</option>
          <option value="yearly">Yearly - ₹10,000</option>
        </select>
      </div>

      <div className="notice">
        <b>{details.label}</b> plan selected. Renewal term: {details.term}. Price: {details.price}.
      </div>

      <p className="small">Plan: <b>{user?.subscription?.plan || plan}</b></p>
      <p className="small">Renewal: <b>{user?.subscription?.renewalDate ? new Date(user.subscription.renewalDate).toLocaleString() : '—'}</b></p>
      <p className="small">Status: <b>{user?.subscription?.status || 'inactive'}</b>{user?.subscription?.lapsed ? ' (lapsed)' : ''}</p>

      <div className="actions">
        <button className="btn" onClick={() => onAction('activate', plan)}>Activate</button>
        <button className="btn secondary" onClick={() => onAction('cancel')}>Cancel</button>
      </div>
    </div>
  );
}
