import { readJson, writeJson } from './data';

const MAX_NOTIFICATIONS = 250;

function notificationsPath() {
  return 'notifications.json';
}

export async function listNotifications() {
  return readJson(notificationsPath(), []);
}

export async function appendNotification(notification) {
  const notifications = await listNotifications();
  const record = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...notification
  };
  notifications.unshift(record);
  await writeJson(notificationsPath(), notifications.slice(0, MAX_NOTIFICATIONS));
  return record;
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Digital Heroes <onboarding@resend.dev>';

  if (!apiKey || !to) return { skipped: true };

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Email send failed');
  }

  return data;
}

export async function notifyUser(user, { type, subject, message, meta = {}, email = true }) {
  const notification = await appendNotification({
    userId: user?.id || null,
    email: user?.email || null,
    type,
    subject,
    message,
    meta
  });

  if (email && user?.email) {
    try {
      await sendEmail({
        to: user.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6">
            <h2>${subject}</h2>
            <p>${message}</p>
          </div>
        `
      });
    } catch (error) {
      await appendNotification({
        userId: user?.id || null,
        email: user?.email || null,
        type: 'email_error',
        subject: `Email failed: ${subject}`,
        message: error.message
      });
    }
  }

  return notification;
}
