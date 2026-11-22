import { Router } from 'express';
import { readPageParams, makePage } from '../paging.js';
import { personExists } from '../data/persons.js';
import { personWords } from '../data/words.js';

export const personsRouter = Router();

// GET /api/persons/{nconst}/words   200 | 404   person words (1-D.10)
// 404 if the person does not exist; a person with no indexed words gives 200 + [].
personsRouter.get('/:nconst/words', async (req, res) => {
  const { nconst } = req.params;
  if (!(await personExists(nconst))) {
    return res.status(404).json({ error: 'No such person' });
  }
  const params = readPageParams(req.query);
  const rows = await personWords(nconst, params.limit, params.offset);
  res.json(makePage(rows, params, req.originalUrl));
});