export default function StatCard({ label, value, hint }) {
  return (
    <div className="stat">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
      {hint ? <div className="small">{hint}</div> : null}
    </div>
  );
}
