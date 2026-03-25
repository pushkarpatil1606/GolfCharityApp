import { readJson } from '../../../lib/data';

export default async function handler(req, res) {
  const charities = await readJson('charities.json', []);
  return res.json({ charities });
}
