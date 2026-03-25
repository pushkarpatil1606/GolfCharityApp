import { requireAdmin } from '../../../lib/http';
import { getAnalytics } from '../../../lib/analytics';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  return res.json({ analytics: await getAnalytics() });
}
