import { unstable_cache } from 'next/cache';

import { CONTRACT, readClient, retried } from './genlayer-core.mjs';
import type { Challenge, Entry, Listing, Marks, NotFound, Totals } from './types';

/**
 * Reads happen on the server, cached for 20 seconds under tags: Studio Next
 * rate-limits each IP at about thirty requests a minute. After a decided write
 * the page POSTs /api/refresh, which expires the tags it touched.
 */

const client = readClient();
const REVALIDATE = 20;

async function view<T>(method: string, args: (number | string)[]): Promise<T> {
  const raw = await retried(() => client.readContract({ address: CONTRACT, functionName: method, args }), 3);
  return JSON.parse(String(raw)) as T;
}

export const tags = {
  all: 'chain',
  entry: (id: number) => `entry:${id}`,
  challenge: (id: number) => `challenge:${id}`,
  account: (address: string) => `account:${address.toLowerCase()}`,
};

export function getTotals(): Promise<Totals> {
  return unstable_cache(async () => (await view<NotFound>('get_entry', [0])).totals, ['totals'], { revalidate: REVALIDATE, tags: [tags.all] })();
}

export function getEntry(id: number): Promise<Entry | NotFound> {
  return unstable_cache(() => view<Entry | NotFound>('get_entry', [id]), ['get_entry', String(id)], { revalidate: REVALIDATE, tags: [tags.all, tags.entry(id)] })();
}

export function getChallenge(id: number): Promise<Challenge | NotFound> {
  return unstable_cache(() => view<Challenge | NotFound>('get_challenge', [id]), ['get_challenge', String(id)], { revalidate: REVALIDATE, tags: [tags.all, tags.challenge(id)] })();
}

export function listEntries(address = '', offset = 0, limit = 20): Promise<Listing> {
  return unstable_cache(
    () => view<Listing>('list_entries', [address.toLowerCase(), offset, limit]),
    ['list_entries', address.toLowerCase(), String(offset), String(limit)],
    { revalidate: REVALIDATE, tags: [tags.all, ...(address ? [tags.account(address)] : [])] },
  )();
}

export function listMarks(id: number): Promise<Marks> {
  return unstable_cache(() => view<Marks>('list_marks', [id]), ['list_marks', String(id)], { revalidate: REVALIDATE, tags: [tags.all, tags.entry(id)] })();
}

/** The newest challenges first. */
export async function recentChallenges(limit = 4, decidedOnly = false): Promise<Challenge[]> {
  const totals = await getTotals();
  const out: Challenge[] = [];
  for (let id = totals.challenges; id >= 1 && out.length < limit; id--) {
    const c = await getChallenge(id);
    if (c.found && (!decidedOnly || c.verdict !== '')) out.push(c);
  }
  return out;
}

/** The entry shown on the front page: the newest revealed one that carries a mark, else the newest revealed, else the newest. */
export async function featuredEntry(): Promise<Entry | null> {
  const page = await listEntries('', 0, 12);
  const pick = page.items.find((e) => e.revealed && (e.overlaps > 0 || e.related > 0)) ?? page.items.find((e) => e.revealed) ?? page.items[0];
  if (!pick) return null;
  const full = await getEntry(pick.id);
  return full.found ? full : null;
}

export function readError(error: unknown): string {
  const text = String((error as Error)?.message ?? error);
  if (/-32029|rate limit/i.test(text)) return 'Studio Next is rate limiting reads right now. Wait a minute and reload.';
  return 'Studio Next did not answer this read. Reload in a moment.';
}
