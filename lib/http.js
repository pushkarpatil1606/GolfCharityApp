import { parse } from 'cookie';
import { getUserFromToken, isActiveSubscriber } from './auth';

export function getToken(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies.session || null;
}

export async function requireUser(req, res) {
  const token = getToken(req);
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

export async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin only' });
    return null;
  }
  return user;
}

export async function requireActiveSubscriber(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!isActiveSubscriber(user)) {
    res.status(402).json({ error: 'Active subscription required' });
    return null;
  }
  return user;
}
