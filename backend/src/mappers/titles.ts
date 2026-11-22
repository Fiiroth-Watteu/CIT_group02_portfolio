import type { TitleSearchRow } from '../data/titles.js';

// Row → representation (2-C.4). CHAR(4) years become numbers; '\N' or missing become null.
export function toYear(value: string | null): number | null {
  const year = Number.parseInt(value ?? '', 10);
  return Number.isNaN(year) ? null : year;
}

export function toTitleSearchItem(row: TitleSearchRow) {
  return {
    url: `/api/titles/${row.title_id}`,
    primary_title: row.primary_title,
    start_year: toYear(row.start_year),
    rank: row.rank,
  };
}