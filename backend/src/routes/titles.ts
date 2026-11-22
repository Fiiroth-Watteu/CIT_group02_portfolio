import { Router } from 'express';
import { readPageParams, makePage } from '../paging.js';
import { searchTitles, type SearchMode } from '../data/titles.js';
import { toTitleSearchItem } from '../mappers/titles.js';

export const titlesRouter = Router();

const MODES: SearchMode[] = ['weighted', 'best', 'exact'];

// GET /api/titles?q=…&q=…&mode=weighted|best|exact   200 | 400
titlesRouter.get('/', async (req, res) => {
  // q may be repeated: ?q=adams&q=mads mikkelsen
  const raw = req.query.q;
  const list = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
  const keywords = list.map(k => String(k).trim()).filter(k => k.length > 0);
  if (keywords.length === 0) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const mode = String(req.query.mode ?? 'weighted') as SearchMode;
  if (!MODES.includes(mode)) {
    return res.status(400).json({ error: 'Unknown mode' });
  }

  const params = readPageParams(req.query);
  const rows = await searchTitles(mode, keywords, params.limit, params.offset);
  res.json(makePage(rows.map(toTitleSearchItem), params, req.originalUrl));
});