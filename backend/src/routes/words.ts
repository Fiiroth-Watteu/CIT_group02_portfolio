import { Router } from 'express';
import { readPageParams, makePage } from '../paging.js';
import { readKeywords } from '../keywords.js';
import { relatedWords, type MatchMode } from '../data/words.js';

export const wordsRouter = Router();

const MATCHES: MatchMode[] = ['all', 'any'];

// GET /api/words?q=…&match=all|any   200 | 400   word-to-words (1-D.13)
wordsRouter.get('/', async (req, res) => {
  const keywords = readKeywords(req.query.q);
  if (keywords.length === 0) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const match = String(req.query.match ?? 'all') as MatchMode;
  if (!MATCHES.includes(match)) {
    return res.status(400).json({ error: 'Unknown match' });
  }

  const params = readPageParams(req.query);
  const rows = await relatedWords(match, keywords, params.limit, params.offset);
  res.json(makePage(rows, params, req.originalUrl));
});