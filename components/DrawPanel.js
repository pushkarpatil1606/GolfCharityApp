export default function DrawPanel({ draws, userIsAdmin }) {
  const latest = draws?.[0];
  return (
    <div className="card">
      <h3>Monthly draw</h3>
      {latest ? (
        <>
          <p className="small">Status: <b>{latest.status}</b> · Month: <b>{latest.month}</b></p>
          <p className="small">Draw numbers: <b>{latest.drawNumbers.join(', ')}</b></p>
          <p className="small">5-match winners: {latest.winners.five.length} · 4-match winners: {latest.winners.four.length} · 3-match winners: {latest.winners.three.length}</p>
          <p className="small">Prize pool: ₹{latest.pools.totalPool}</p>
          {userIsAdmin ? <p className="small">Use admin tools to simulate or publish the latest draw.</p> : null}
        </>
      ) : <p className="small">No draw has been simulated yet.</p>}
    </div>
  );
}
