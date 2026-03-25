import { readJson, writeJson } from '../../lib/data';
import { requireActiveSubscriber } from '../../lib/http';

export default async function handler(req, res) {
  const user = await requireActiveSubscriber(req, res);
  if (!user) return;

  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === user.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    return res.json({ scores: users[idx].scores || [] });
  }

  if (req.method === 'POST') {
    const { value, date } = req.body || {};
    const n = Number(value);

    if (!Number.isInteger(n) || n < 1 || n > 45) {
      return res.status(400).json({ error: 'Score must be between 1 and 45' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const newScore = {
      value: n,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString()
    };

    users[idx].scores = [newScore, ...(users[idx].scores || [])].slice(0, 5);

    await writeJson('users.json', users);

    return res.json({ scores: users[idx].scores });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
