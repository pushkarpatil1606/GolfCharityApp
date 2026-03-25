import { requireUser } from '../../../lib/http';
import { activateSubscription } from '../../../lib/auth';
import { notifyUser } from '../../../lib/notifications';

export default async function handler(req, res) {
  const me = await requireUser(req, res);
  if (!me) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const plan = req.body?.plan === 'yearly' ? 'yearly' : (me.subscription?.plan || 'monthly');
  const user = await activateSubscription(me, plan);
  await notifyUser(user, {
    type: 'subscription',
    subject: 'Subscription activated',
    message: `Your ${plan} plan has been activated successfully.`,
    meta: { plan }
  });
  return res.json({ user, provider: 'local' });
}
