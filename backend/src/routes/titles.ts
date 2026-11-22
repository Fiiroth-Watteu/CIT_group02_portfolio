import { Router } from 'express';
import { readPageParams, makePage } from '../paging.js';
import { searchTitles, getSimilarMovies, titleExists, type SearchMode} from '../data/titles.js';
import { toTitleSearchItem } from '../mappers/titles.js';
import { getPopularActors } from '../data/persons.js';

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

// GET /api/titles/{tconst}/similar   200 | 404   similar titles (1-D.9)
titlesRouter.get('/:tconst/similar', async (req, res) => {
    const { tconst } = req.params;
    if (!(await titleExists(tconst))) {
      return res.status(404).json({ error: 'No such title' });
    }
    const params = readPageParams(req.query);
    const rows = await getSimilarMovies(tconst, params.limit + 1, params.offset);
    res.json(makePage(rows.map(r => ({
      url: `/api/titles/${r.title_id}`,
      primary_title: r.primary_title,
      similarity_score: r.similarity_score,
    })), params, req.originalUrl));
  });
  
  // GET /api/titles/{tconst}/actors   200 | 404   popular actors (1-D.8)
  titlesRouter.get('/:tconst/actors', async (req, res) => {
    const { tconst } = req.params;
    if (!(await titleExists(tconst))) {
      return res.status(404).json({ error: 'No such title' });
    }
    const params = readPageParams(req.query);
    const rows = await getPopularActors(tconst, params.limit + 1, params.offset);
    res.json(makePage(rows.map(r => ({
      url: `/api/persons/${r.person_id}`,
      primary_name: r.primary_name,
      // numeric comes back from pg as a string; a person without a rating stays null (2-C.4)
      name_rating: r.name_rating === null ? null : Number(r.name_rating),
    })), params, req.originalUrl));
  });