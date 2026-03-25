import { readJson, writeJson } from '../../../lib/data';
import { requireAdmin } from '../../../lib/http';
import { notifyUser } from '../../../lib/notifications';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, drawId, verificationStatus } = req.body || {};
  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: 'Winner not found' });

  const winIdx = (users[idx].winnings || []).findIndex(w => w.drawId === drawId);
  if (winIdx === -1) return res.status(404).json({ error: 'Winnings entry not found' });

  users[idx].winnings[winIdx].verificationStatus = verificationStatus;
  users[idx].winnings[winIdx].status = verificationStatus === 'approved' ? 'paid' : 'rejected';
  users[idx].winnings[winIdx].updatedAt = new Date().toISOString();
  await writeJson('users.json', users);

  await notifyUser(users[idx], {
    type: 'winner_verification',
    subject: `Your win for draw ${drawId} was ${verificationStatus}`,
    message: `Your winning entry has been ${verificationStatus}. Current payout status: ${users[idx].winnings[winIdx].status}.`,
    meta: { drawId, verificationStatus }
  });

  return res.json({ winner: users[idx].winnings[winIdx] });
}
