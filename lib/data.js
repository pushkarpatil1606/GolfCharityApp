import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { isSupabaseReady, supabaseRequest } from './supabaseAdmin';

const DATA_DIR = path.join(process.cwd(), 'data');
let initPromise = null;

function seedPayload() {
  const now = new Date().toISOString();
  return {
    'users.json': [
      {
        id: 'u_admin',
        email: 'admin@demo.com',
        passwordHash: 'seed:admin123',
        role: 'admin',
        name: 'Admin',
        subscription: { status: 'active', plan: 'yearly', renewalDate: now, lapsed: false },
        charityId: 'c1',
        charityContribution: 10,
        extraDonation: 0,
        scores: [
          { value: 18, date: now },
          { value: 22, date: now },
          { value: 17, date: now },
          { value: 26, date: now },
          { value: 15, date: now }
        ],
        winnings: []
      },
      {
        id: 'u_demo',
        email: 'user@demo.com',
        passwordHash: 'seed:user123',
        role: 'user',
        name: 'Demo Player',
        subscription: { status: 'active', plan: 'monthly', renewalDate: now, lapsed: false },
        charityId: 'c2',
        charityContribution: 10,
        extraDonation: 5,
        scores: [
          { value: 11, date: now },
          { value: 14, date: now },
          { value: 21, date: now },
          { value: 19, date: now },
          { value: 7, date: now }
        ],
        winnings: []
      }
    ],
    'charities.json': [
      { id: 'c1', name: 'Fairway Futures', region: 'Global', spotlight: true, description: 'Youth access and sport-based mentoring programs.', images: ['Community support'], events: ['Golf Day for Schools'] },
      { id: 'c2', name: 'Green Hearts', region: 'India', spotlight: true, description: 'Food, education, and healthcare programs for underserved families.', images: ['Volunteer day'], events: ['Charity Open'] },
      { id: 'c3', name: 'Hope Links', region: 'Europe', spotlight: false, description: 'Women’s empowerment and local community impact.', images: ['Monthly clinic'], events: ['Impact Drive'] }
    ],
    'draws.json': [],
    'notifications.json': [],
    'sessions.json': [],
    'audit.json': []
  };
}

async function ensureLocalDir() {
  if (!fsSync.existsSync(DATA_DIR)) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function ensureLocalSeed() {
  await ensureLocalDir();
  const usersPath = path.join(DATA_DIR, 'users.json');
  if (fsSync.existsSync(usersPath)) return;
  const payload = seedPayload();
  await Promise.all(
    Object.entries(payload).map(([name, value]) =>
      fs.writeFile(path.join(DATA_DIR, name), JSON.stringify(value, null, 2))
    )
  );
}

async function ensureSupabaseSeed() {
  const existing = await supabaseRequest('app_state', {
    query: '?select=key&key=eq.users.json&limit=1',
  });
  if (Array.isArray(existing) && existing.length) return;

  const rows = Object.entries(seedPayload()).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  await supabaseRequest('app_state', {
    method: 'POST',
    query: '?on_conflict=key',
    body: rows,
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  });
}

export async function seedIfNeeded() {
  if (!initPromise) {
    initPromise = (async () => {
      if (isSupabaseReady()) await ensureSupabaseSeed();
      else await ensureLocalSeed();
    })();
  }
  return initPromise;
}

export async function readJson(name, fallback) {
  await seedIfNeeded();
  if (isSupabaseReady()) {
    const rows = await supabaseRequest('app_state', {
      query: `?select=value&key=eq.${encodeURIComponent(name)}&limit=1`,
    });
    if (!Array.isArray(rows) || !rows.length) {
      await writeJson(name, fallback);
      return fallback;
    }
    return rows[0]?.value ?? fallback;
  }

  const fp = path.join(DATA_DIR, name);
  if (!fsSync.existsSync(fp)) {
    await fs.writeFile(fp, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(await fs.readFile(fp, 'utf8'));
  } catch {
    return fallback;
  }
}

export async function writeJson(name, value) {
  await seedIfNeeded();
  if (isSupabaseReady()) {
    await supabaseRequest('app_state', {
      method: 'POST',
      query: '?on_conflict=key',
      body: [{ key: name, value, updated_at: new Date().toISOString() }],
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
    });
    return;
  }

  const fp = path.join(DATA_DIR, name);
  await ensureLocalDir();
  await fs.writeFile(fp, JSON.stringify(value, null, 2));
}

export async function filePath(name) {
  await seedIfNeeded();
  return isSupabaseReady() ? name : path.join(DATA_DIR, name);
}
