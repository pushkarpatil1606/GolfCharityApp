import { readJson } from '../../../lib/data';

export default async function handler(req, res) {
  const draws = await readJson('draws.json', []);
  return res.json({ draws });
}
