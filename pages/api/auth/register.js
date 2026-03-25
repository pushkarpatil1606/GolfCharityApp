import { readJson, writeJson } from '../../../lib/data';
import { createSession, hashPassword } from '../../../lib/auth';
import { notifyUser } from '../../../lib/notifications';

function cookieString(token) {
  const parts = [`session=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

  const users = await readJson('users.json', []);
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });

  const user = {
    id: `u_${Date.now()}`,
    email,
    passwordHash: hashPassword(password),
    role: 'user',
    name,
    subscription: { status: 'inactive', plan: 'monthly', renewalDate: null, lapsed: false },
    charityId: null,
    charityContribution: 10,
    extraDonation: 0,
    scores: [],
    winnings: []
  };
  users.unshift(user);
  await writeJson('users.json', users);

  const token = await createSession(user.id);
  res.setHeader('Set-Cookie', cookieString(token));

  await notifyUser(user, {
    type: 'welcome',
    subject: 'Welcome to Digital Heroes',
    message: 'Your account has been created successfully.',
    meta: {}
  });

  return res.json({ user });
}
