import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { readJson } from '../lib/data';

export async function getServerSideProps() {
  return { props: { charities: await readJson('charities.json', []) } };
}

export default function Charities({ charities }) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');

  const regions = useMemo(() => ['all', ...new Set(charities.map(c => c.region))], [charities]);
  const filtered = charities.filter(c =>
    (region === 'all' || c.region === region) &&
    `${c.name} ${c.description}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout>
      <div className="card">
        <h2>Charity directory</h2>
        <p className="small">Search and filter the listed charities, then pick one in your dashboard.</p>
        <div className="grid-2">
          <input className="input" placeholder="Search charities..." value={query} onChange={e => setQuery(e.target.value)} />
          <select value={region} onChange={e => setRegion(e.target.value)}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <hr className="hr" />
        <div className="grid-3">
          {filtered.map(c => (
            <div className="card" key={c.id}>
              <div className="badge good">{c.spotlight ? 'Spotlight' : 'Listed'}</div>
              <h3>{c.name}</h3>
              <p className="small">{c.description}</p>
              <p className="small"><b>Region:</b> {c.region}</p>
              <p className="small"><b>Events:</b> {c.events.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
