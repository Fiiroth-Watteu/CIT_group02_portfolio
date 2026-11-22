// Paging for every list in the API (2-A.3, docs/api-design.md).
// Reading and clamping limit/offset follows 7-1, slide 7.

export interface PageParams {
    limit: number;
    offset: number;
  }
  
  export interface Page<T> {
    items: T[];
    prev: string | null;
    next: string | null;
  }
  
  // Default 20, minimum 1, maximum 100. Invalid values are clamped, never rejected.
  export function readPageParams(query: { limit?: unknown; offset?: unknown }): PageParams {
    const limit = Math.min(Math.max(Math.floor(Number(query.limit)) || 20, 1), 100);
    const offset = Math.max(Math.floor(Number(query.offset)) || 0, 0);
    return { limit, offset };
  }
  
  // The data layer fetches limit + 1 rows. If it gets the extra row, a next page exists.
  export function makePage<T>(rows: T[], params: PageParams, originalUrl: string): Page<T> {
    const hasMore = rows.length > params.limit;
    const items = hasMore ? rows.slice(0, params.limit) : rows;
    return {
      items,
      prev: params.offset > 0
        ? pageUrl(originalUrl, params.limit, Math.max(params.offset - params.limit, 0))
        : null,
      next: hasMore ? pageUrl(originalUrl, params.limit, params.offset + params.limit) : null,
    };
  }
  
  // Same URI as the request, with only limit and offset replaced, so q, mode etc. are kept.
  function pageUrl(originalUrl: string, limit: number, offset: number): string {
    const url = new URL(originalUrl, 'http://localhost');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    return url.pathname + url.search;
  }