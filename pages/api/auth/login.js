import { readJson } from '../../../lib/data';
import { createSession, verifyPassword } from '../../../lib/auth';

function cookieString(token) {
  const parts = [`session=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  const users = await readJson('users.json', []);
  const user = users.find(u => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = await createSession(user.id);
  res.setHeader('Set-Cookie', cookieString(token));
  return res.json({ user });
}
