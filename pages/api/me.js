import { requireUser } from '../../lib/http';

export default async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;
  return res.json({ user });
}
