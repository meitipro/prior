import type { Metadata } from 'next';
import Link from 'next/link';

import { Empty, LabelBadge, ReadError, VerdictBadge } from '@/components/ui';
import { gap } from '@/lib/claims';
import { readError, recentChallenges } from '@/lib/read';
import type { Challenge } from '@/lib/types';

export const metadata: Metadata = { title: 'Challenges' };
export const revalidate = 20;

export default async function ChallengesPage() {
  let list: Challenge[] = [];
  let error = '';
  try {
    list = await recentChallenges(30);
  } catch (e) {
    error = readError(e);
  }
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Challenges</p>
      <h1 className="c-h2 mt-2">Two texts, one against the other</h1>
      <p className="c-muted mt-2 max-w-[40em] text-[15px]">Each challenge names an earlier entry and a later one. The validators read the two texts without dates or names, and the contract applies the seal order.</p>
      <div className="mt-8 flex flex-col gap-3">
        {error ? <ReadError message={error} /> : list.length === 0 ? <Empty>No challenge has been filed yet.</Empty> : list.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="c-card c-row-link pad flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="c-h3">Challenge #{c.id} · entry {c.b.id} against entry {c.a.id}</p>
              <p className="c-faint mt-1 text-[12.5px]">sealed {gap(c.seconds_between)} later</p>
            </div>
            <div className="flex items-center gap-2"><LabelBadge label={c.label} /><VerdictBadge verdict={c.verdict} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
