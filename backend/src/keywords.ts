// Reads the repeated q parameter (?q=adams&q=mads mikkelsen) into a list of keywords.
// Empty values are dropped; an empty list means the request is invalid (400, 2-D.2).
export function readKeywords(raw: unknown): string[] {
    const list = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
    return list.map(k => String(k).trim()).filter(k => k.length > 0);
  }