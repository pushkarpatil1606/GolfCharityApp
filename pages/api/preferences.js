import { readJson, writeJson } from '../../lib/data';
import { requireActiveSubscriber } from '../../lib/http';

export default async function handler(req, res) {
  const me = await requireActiveSubscriber(req, res);
  if (!me) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { charityId, charityContribution, extraDonation } = req.body || {};
  if (!charityId) return res.status(400).json({ error: 'Choose a charity' });
  if (Number(charityContribution) < 10) return res.status(400).json({ error: 'Minimum contribution is 10%' });

  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === me.id);
  users[idx].charityId = charityId;
  users[idx].charityContribution = Number(charityContribution);
  users[idx].extraDonation = Number(extraDonation || 0);
  await writeJson('users.json', users);
  return res.json({ user: users[idx] });
}
