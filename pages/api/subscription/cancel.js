import { requireUser } from '../../../lib/http';
import { cancelSubscription } from '../../../lib/auth';
import { notifyUser } from '../../../lib/notifications';

export default async function handler(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await cancelSubscription(me);
  await notifyUser(user, {
    type: 'subscription',
    subject: 'Subscription cancelled',
    message: 'Your subscription has been cancelled successfully.',
    meta: { action: 'cancel' }
  });
  return res.json({ user });
}
