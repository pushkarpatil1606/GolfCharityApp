import Link from 'next/link';

export default function Layout({ children, user }) {
  return (
    <div className="container">
      <div className="nav">
        <Link href="/" className="brand">
          <span className="logo" />
          <span>Golf Charity Platform</span>
        </Link>
        <div className="navlinks">
          <Link href="/charities">Charities</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/admin">Admin</Link>
          {user ? <Link href="/api/auth/logout">Logout</Link> : <Link href="/login">Login</Link>}
        </div>
      </div>
      {children}
      <div className="footer">Emotion-led charity subscriptions, score tracking, and monthly draw automation.</div>
    </div>
  );
}
