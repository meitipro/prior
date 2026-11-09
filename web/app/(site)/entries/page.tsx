import type { Metadata } from 'next';
import Link from 'next/link';

import { Empty, EntryRowView, ReadError } from '@/components/ui';
import { listEntries, readError } from '@/lib/read';
import type { Listing } from '@/lib/types';

export const metadata: Metadata = { title: 'Entries' };
export const revalidate = 20;

export default async function EntriesPage() {
  let page: Listing | null = null;
  let error = '';
  try {
    page = await listEntries('', 0, 30);
  } catch (e) {
    error = readError(e);
  }
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Entries</p>
      <h1 className="c-h2 mt-2">Every seal, newest first</h1>
      <p className="c-muted mt-2 max-w-[40em] text-[15px]">A sealed entry shows only its hash, its date and its bond. A revealed one shows its text and every mark touching it.</p>
      <div className="mt-8 flex flex-col gap-3">
        {error ? <ReadError message={error} /> : !page || page.items.length === 0 ? <Empty>Nothing is sealed yet. <Link href="/new" className="c-link">Register the first idea.</Link></Empty> : page.items.map((e) => <EntryRowView key={e.id} e={e} />)}
      </div>
    </div>
  );
}
