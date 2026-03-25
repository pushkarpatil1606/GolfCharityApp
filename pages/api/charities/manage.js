import { readJson, writeJson } from '../../../lib/data';
import { requireAdmin } from '../../../lib/http';

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const charities = await readJson('charities.json', []);

  if (req.method === 'POST') {
    const { name, region, description, spotlight } = req.body || {};
    const newItem = {
      id: `c_${Date.now()}`,
      name,
      region,
      description,
      spotlight: Boolean(spotlight),
      images: [],
      events: []
    };
    charities.unshift(newItem);
    await writeJson('charities.json', charities);
    return res.json({ charity: newItem });
  }

  if (req.method === 'PUT') {
    const { id, ...patch } = req.body || {};
    const idx = charities.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Charity not found' });
    charities[idx] = { ...charities[idx], ...patch };
    await writeJson('charities.json', charities);
    return res.json({ charity: charities[idx] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    await writeJson('charities.json', charities.filter(c => c.id !== id));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
