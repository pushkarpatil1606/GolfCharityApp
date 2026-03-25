import { requireAdmin } from '../../../lib/http';
import { publishLatestDraw } from '../../../lib/draw';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const result = await publishLatestDraw();
    return res.json(result);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
