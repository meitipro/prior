import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CloseBox, RevealBox } from '@/components/Boxes';
import { Addr, Empty, Marks, Money, NotFoundCard, ReadError, StateBadge, Tx, VerdictBadge } from '@/components/ui';
import { STATE_HELP, seasoningLeft } from '@/lib/claims';
import { txIndex } from '@/lib/explorer';
import { dayTime } from '@/lib/format';
import { getEntry, listMarks, readError } from '@/lib/read';
import type { Entry, Marks as MarksT } from '@/lib/types';

export const revalidate = 20;

export async function generateMetadata(props: PageProps<'/e/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Entry ${id}` };
}

export default async function EntryPage(props: PageProps<'/e/[id]'>) {
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  let e: Entry | null = null;
  let marks: MarksT | null = null;
  let error = '';
  try {
    const found = await getEntry(id);
    if (!found.found) return <NotFoundCard what="entry with this number" back="/entries" backLabel="All entries" />;
    e = found;
    marks = await listMarks(id);
  } catch (err) {
    error = readError(err);
  }
  if (!e) return <div className="c-wrap py-12"><ReadError message={error} /></div>;
  const txs = await txIndex();
  const sealed = txs.seal[String(id)];
  const revealed = txs.reveal[String(id)];
  return (
    <div className="c-wrap py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="c-eyebrow">Entry #{e.id}</p>
          <h1 className="c-h2 mt-2">Sealed {dayTime(e.sealed_at)}</h1>
          <p className="c-muted mt-2 text-[14px]">
            by <Addr address={e.author} /> · bond <Money wei={e.bond} />{e.bond_left !== e.bond ? <> · left <Money wei={e.bond_left} /></> : null}
            {sealed && <> · <Tx hash={sealed.hash} label="sealed" /></>}
            {revealed && <> · <Tx hash={revealed.hash} label="revealed" /></>}
          </p>
        </div>
        <div className="flex items-center gap-2"><Marks e={e} /><StateBadge state={e.state} /></div>
      </div>
      <p className="c-faint mono mt-3 break-all text-[12px]">seal {e.seal}</p>
      <div className="c-note mt-4">
        <p>{STATE_HELP[e.state]} This entry proves who sealed first, not who wrote it, and it gives no legal rights.</p>
      </div>

      <div className="c-grid-2 mt-8">
        <section aria-labelledby="text-h">
          <h2 id="text-h" className="c-eyebrow mb-3">The text</h2>
          {e.revealed ? (
            <div className="c-text-box first">
              <span className="tag">Revealed {dayTime(e.revealed_at)} · checked against the seal</span>
              <p className="body">{e.text}</p>
              <p className="c-faint mono mt-3 text-[12px]">salt {e.salt}</p>
            </div>
          ) : (
            <Empty>Sealed. Only the author has the text and the salt, until they reveal them.</Empty>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {e.revealed && (
              <Link href={`/e/${e.id}/challenge`} className="c-btn">Challenge a later copy of this</Link>
            )}
          </div>
        </section>
        <section className="flex flex-col gap-4" aria-labelledby="marks-h">
          <h2 id="marks-h" className="c-eyebrow">Every mark touching it</h2>
          {marks && marks.marks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {marks.marks.map((m) => (
                <Link key={m.id} href={`/c/${m.id}`} className="c-card c-row-link pad flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[14.5px] font-medium">Challenge #{m.id}: entry {m.b_id} against entry {m.a_id}</p>
                    <p className="c-faint text-[12.5px]">this entry is the {m.role} one</p>
                  </div>
                  <VerdictBadge verdict={m.verdict as never} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty>No challenge touches this entry.</Empty>
          )}
          <RevealBox entryId={e.id} author={e.author} />
          <CloseBox entryId={e.id} author={e.author} seasonsAt={e.seasons_at} overlaps={e.overlaps} openChallenges={e.open_challenges} bondLeft={e.bond_left} />
          {e.state !== 'SEASONED' && <p className="c-faint text-[12.5px]">Seasoning: {seasoningLeft(e.seasons_at)}.</p>}
        </section>
      </div>
    </div>
  );
}
