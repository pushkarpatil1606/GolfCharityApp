import crypto from 'crypto';
import { readJson, writeJson } from './data';

const PASSWORD_SALT = 'prd-demo-salt';

function monthsForPlan(plan) {
  return plan === 'yearly' ? 12 : 1;
}

function renewDateForPlan(plan, from = new Date()) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + monthsForPlan(plan));
  return next.toISOString();
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(`${PASSWORD_SALT}:${password}`).digest('hex');
}

export function verifyPassword(password, hash) {
  if (hash?.startsWith('seed:')) return hash === `seed:${password}`;
  return hashPassword(password) === hash;
}

function syncSubscriptionStatus(user) {
  if (!user?.subscription) return user;
  const sub = { ...user.subscription };
  if (sub.status === 'active' && sub.renewalDate) {
    const renewal = new Date(sub.renewalDate);
    if (Number.isFinite(renewal.getTime()) && renewal < new Date()) {
      sub.status = 'inactive';
      sub.lapsed = true;
      sub.expiredAt = new Date().toISOString();
    }
  }
  return { ...user, subscription: sub };
}

async function persistUser(updatedUser) {
  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === updatedUser.id);
  if (idx !== -1) {
    users[idx] = updatedUser;
    await writeJson('users.json', users);
  }
}

export async function createSession(userId) {
  const sessions = await readJson('sessions.json', []);
  const token = crypto.randomBytes(24).toString('hex');
  sessions.push({ token, userId, createdAt: new Date().toISOString() });
  await writeJson('sessions.json', sessions);
  return token;
}

export async function destroySession(token) {
  const sessions = await readJson('sessions.json', []);
  await writeJson('sessions.json', sessions.filter(s => s.token !== token));
}

export async function getUserFromToken(token) {
  if (!token) return null;
  const sessions = await readJson('sessions.json', []);
  const session = sessions.find(s => s.token === token);
  if (!session) return null;
  const users = await readJson('users.json', []);
  const user = users.find(u => u.id === session.userId) || null;
  if (!user) return null;

  const synced = syncSubscriptionStatus(user);
  if (JSON.stringify(synced) !== JSON.stringify(user)) await persistUser(synced);
  return synced;
}

export async function updateSubscription(userId, patch) {
  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], subscription: { ...(users[idx].subscription || {}), ...patch } };
  await writeJson('users.json', users);
  return users[idx];
}

export async function activateSubscription(user, plan = 'monthly') {
  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) return null;
  const renewalDate = renewDateForPlan(plan);
  users[idx].subscription = {
    status: 'active',
    plan,
    renewalDate,
    lapsed: false,
    startedAt: new Date().toISOString(),
    price: plan === 'yearly' ? 10000 : 1000,
  };
  await writeJson('users.json', users);
  return users[idx];
}

export async function setSubscriptionPlan(user, plan) {
  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) return null;
  const current = users[idx].subscription || {};
  const renewalDate = current.status === 'active' ? renewDateForPlan(plan) : current.renewalDate || null;
  users[idx].subscription = {
    ...current,
    plan,
    renewalDate,
    price: plan === 'yearly' ? 10000 : 1000,
  };
  await writeJson('users.json', users);
  return users[idx];
}

export async function cancelSubscription(user) {
  const users = await readJson('users.json', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) return null;
  users[idx].subscription = {
    ...(users[idx].subscription || {}),
    status: 'inactive',
    lapsed: true,
    cancelledAt: new Date().toISOString(),
  };
  await writeJson('users.json', users);
  return users[idx];
}

export function isActiveSubscriber(user) {
  return user?.subscription?.status === 'active' && !user?.subscription?.lapsed;
}
