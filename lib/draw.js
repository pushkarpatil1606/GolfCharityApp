import { readJson, writeJson } from './data';
import { notifyUser } from './notifications';

export const PRIZE_SPLIT = {
  five: 0.40,
  four: 0.35,
  three: 0.25
};

export function normalizeScores(scores = []) {
  return [...scores]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
}

export function compareSet(userScores = [], drawNumbers = []) {
  const userSet = new Set(userScores.map(s => Number(s.value)));
  const drawSet = new Set(drawNumbers.map(Number));
  let matches = 0;
  for (const n of userSet) if (drawSet.has(n)) matches += 1;
  return matches;
}

export function generateDrawNumbers() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const picked = [];
  while (picked.length < 5) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

export function calcPrizePools(users, rolloverPool = 0) {
  const activeRevenue = users
    .filter(u => u.subscription?.status === 'active')
    .reduce((sum, u) => sum + Number(u.subscription?.price || 0), 0);
  const basePool = activeRevenue + rolloverPool;
  return {
    totalPool: basePool,
    five: Math.round(basePool * PRIZE_SPLIT.five),
    four: Math.round(basePool * PRIZE_SPLIT.four),
    three: Math.round(basePool * PRIZE_SPLIT.three)
  };
}

export async function simulateDraw() {
  const users = await readJson('users.json', []);
  const draws = await readJson('draws.json', []);
  const activeUsers = users.filter(u => u.subscription?.status === 'active');
  const drawNumbers = generateDrawNumbers();

  const winnerBuckets = { five: [], four: [], three: [] };

  for (const user of activeUsers) {
    const scores = normalizeScores(user.scores || []);
    const matches = compareSet(scores, drawNumbers);
    if (matches >= 5) winnerBuckets.five.push(user.id);
    else if (matches === 4) winnerBuckets.four.push(user.id);
    else if (matches === 3) winnerBuckets.three.push(user.id);
  }

  const rolloverPool = draws.reduce((sum, d) => sum + (d.rollover || 0), 0);
  const pools = calcPrizePools(users, rolloverPool);

  const result = {
    id: `draw_${Date.now()}`,
    month: new Date().toISOString().slice(0, 7),
    status: 'simulated',
    drawNumbers,
    activeSubscribers: activeUsers.length,
    pools,
    winners: winnerBuckets,
    publishedAt: null,
    rollover: winnerBuckets.five.length ? 0 : pools.five,
    notes: 'Simulation created from current active subscribers and latest five scores.'
  };

  draws.unshift(result);
  await writeJson('draws.json', draws);
  return result;
}

export async function publishLatestDraw() {
  const draws = await readJson('draws.json', []);
  if (!draws.length) throw new Error('No simulated draw available.');
  const latest = draws[0];
  latest.status = 'published';
  latest.publishedAt = new Date().toISOString();

  const users = await readJson('users.json', []);
  const payoutRecords = [];
  for (const tier of ['five', 'four', 'three']) {
    const ids = latest.winners[tier] || [];
    const tierPool = latest.pools[tier] || 0;
    const payout = ids.length ? Math.floor(tierPool / ids.length) : 0;
    for (const id of ids) {
      const user = users.find(u => u.id === id);
      if (!user) continue;
      user.winnings = user.winnings || [];
      const entry = {
        drawId: latest.id,
        tier,
        amount: payout,
        status: 'pending',
        verificationStatus: 'pending',
        proofStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      user.winnings.unshift(entry);
      payoutRecords.push({ userId: id, tier, amount: payout });

      await notifyUser(user, {
        type: 'draw_result',
        subject: `You won in draw ${latest.month}`,
        message: `You have a ${tier} tier winning of ₹${payout} for draw ${latest.month}. Please upload proof for verification.`,
        meta: { drawId: latest.id, tier, amount: payout }
      });
    }
  }
  await writeJson('users.json', users);
  await writeJson('draws.json', draws);
  return { draw: latest, payouts: payoutRecords };
}
