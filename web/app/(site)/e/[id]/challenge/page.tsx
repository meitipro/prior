import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ChallengeForm } from '@/components/ChallengeForm';
import { Empty, NotFoundCard, ReadError } from '@/components/ui';
import { getEntry, listEntries, readError } from '@/lib/read';
import type { Entry, EntryRow } from '@/lib/types';

export const revalidate = 20;
export const metadata: Metadata = { title: 'Challenge a copy' };

export default async function ChallengePickPage(props: PageProps<'/e/[id]/challenge'>) {
  const { id: raw } = await props.params;
  const search = await props.searchParams;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  let a: Entry | null = null;
  let later: EntryRow[] = [];
  let error = '';
  try {
    const found = await getEntry(id);
    if (!found.found) return <NotFoundCard what="entry with this number" back="/entries" backLabel="All entries" />;
    a = found;
    const page = await listEntries('', 0, 50);
    later = page.items.filter((e) => e.id !== a!.id && e.revealed && e.sealed_at > a!.sealed_at && e.author.toLowerCase() !== a!.author.toLowerCase());
  } catch (err) {
    error = readError(err);
  }
  if (!a) return <div className="c-wrap py-12"><ReadError message={error} /></div>;
  const initial = typeof search.later === 'string' ? Number(search.later) : undefined;
  return (
    <div className="c-wrap py-10">
      <p className="c-eyebrow"><Link href={`/e/${a.id}`} className="hover:underline">Entry #{a.id}</Link> · challenge a copy</p>
      <h1 className="c-h2 mt-2">Pick a later entry, read both side by side</h1>
      <p className="c-muted mt-2 max-w-[44em] text-[15px]">Only the author of the earlier entry can file, with a 5 GEN stake, and both entries must be revealed. The earlier text always goes to the judge as TEXT 1.</p>
      <div className="mt-8">
        {!a.revealed ? <Empty>Reveal this entry first. A challenge needs both texts on chain.</Empty> : <ChallengeForm a={a} candidates={later} initial={initial} />}
      </div>
    </div>
  );
}
