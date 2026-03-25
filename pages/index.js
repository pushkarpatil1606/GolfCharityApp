import Link from 'next/link';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { readJson } from '../lib/data';

export async function getServerSideProps() {
  const users = await readJson('users.json', []);
  const charities = await readJson('charities.json', []);
  const draws = await readJson('draws.json', []);
  return {
    props: {
      metrics: {
        activeUsers: users.filter(u => u.subscription?.status === 'active').length,
        charities: charities.length,
        draws: draws.length
      }
    }
  };
}

export default function Home({ metrics }) {
  return (
    <Layout>
      <section className="grid-2">
        <div className="card hero">
          <div className="kicker">PRD implementation</div>
          <h1>A golf-inspired reward platform with charity impact.</h1>
          <p className="lead">
            Users subscribe on a monthly or yearly plan, enter their latest golf scores, support a selected charity,
            and take part in monthly prize draws with admin-managed verification.
          </p>
          <div className="actions">
            <Link className="btn" href="/login">Get started</Link>
            <Link className="btn secondary" href="/charities">Explore charities</Link>
          </div>
          <hr className="hr" />
          <div className="grid-3">
            <StatCard label="Active subscribers" value={metrics.activeUsers} hint="Demo data seeded automatically" />
            <StatCard label="Charities listed" value={metrics.charities} hint="Search/filter ready" />
            <StatCard label="Draws created" value={metrics.draws} hint="Simulate and publish monthly" />
          </div>
        </div>
        <div className="card">
          <h3>What is included</h3>
          <p className="small">Auth, monthly/yearly subscriptions, 5-score retention, draw engine, charity preferences, winner verification, and admin dashboards.</p>
          <div className="notice">
            The app now uses a golf palette with fairway green accents, and the score list highlights the latest saved entry.
          </div>
          <hr className="hr" />
          <p className="small"><b>Demo users:</b> admin@demo.com / admin123 and user@demo.com / user123</p>
        </div>
      </section>
    </Layout>
  );
}
