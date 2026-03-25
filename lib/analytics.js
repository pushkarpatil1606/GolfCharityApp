import { readJson } from './data';

export async function getAnalytics() {
  const users = await readJson('users.json', []);
  const charities = await readJson('charities.json', []);
  const draws = await readJson('draws.json', []);

  const activeUsers = users.filter(u => u.subscription?.status === 'active').length;
  const charityTotals = users.reduce((acc, u) => {
    const key = u.charityId || 'none';
    const donation = Number(u.extraDonation || 0) + Number(u.charityContribution || 0);
    acc[key] = (acc[key] || 0) + donation;
    return acc;
  }, {});

  const prizePool = activeUsers * 1000;
  const verifiedWinnings = users.flatMap(u => (u.winnings || [])).filter(w => w.verificationStatus === 'approved').length;

  return {
    totalUsers: users.length,
    activeUsers,
    charities: charities.length,
    totalPrizePool: prizePool,
    drawCount: draws.length,
    verifiedWinnings,
    charityTotals
  };
}
