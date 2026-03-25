import { readJson } from '../../../lib/data';
import { requireAdmin } from '../../../lib/http';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  return res.json({ users: await readJson('users.json', []) });
}
