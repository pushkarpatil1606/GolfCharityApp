import { readJson, writeJson } from '../../../lib/data';
import { requireUser } from '../../../lib/http';
import { notifyUser } from '../../../lib/notifications';

export default async function handler(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { drawId, fileName, mimeType, dataUrl, tier } = req.body || {};
  if (!drawId || !dataUrl) return res.status(400).json({ error: 'Missing proof file' });

  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === me.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  const winIdx = (users[idx].winnings || []).findIndex(w => w.drawId === drawId && (!tier || w.tier === tier));
  if (winIdx === -1) return res.status(404).json({ error: 'Winning entry not found' });

  users[idx].winnings[winIdx] = {
    ...users[idx].winnings[winIdx],
    proofStatus: 'submitted',
    proof: {
      fileName: fileName || 'proof',
      mimeType: mimeType || 'application/octet-stream',
      dataUrl,
      uploadedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };

  await writeJson('users.json', users);

  await notifyUser(users[idx], {
    type: 'proof_uploaded',
    subject: `Proof uploaded for draw ${drawId}`,
    message: `Your proof for draw ${drawId} has been uploaded and is waiting for admin review.`,
    meta: { drawId, tier }
  });

  return res.json({ winner: users[idx].winnings[winIdx] });
}
