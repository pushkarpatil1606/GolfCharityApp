import { requireUser } from '../../../lib/http';
import { setSubscriptionPlan } from '../../../lib/auth';
import { notifyUser } from '../../../lib/notifications';

export default async function handler(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const plan = req.body?.plan === 'yearly' ? 'yearly' : 'monthly';
  const user = await setSubscriptionPlan(me, plan);
  await notifyUser(user, {
    type: 'subscription',
    subject: 'Subscription plan updated',
    message: `Your plan has been changed to ${plan}.`,
    meta: { plan, action: 'change' }
  });
  return res.json({ user });
}
