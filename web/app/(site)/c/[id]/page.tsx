import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JudgeBox, WithdrawBox } from '@/components/Boxes';
import { Addr, LabelBadge, Marks, Money, NotFoundCard, ReadError, Tx } from '@/components/ui';
import { LABEL_HELP, VERDICT_HELP, gap, seasoningLeft } from '@/lib/claims';
import { txIndex } from '@/lib/explorer';
import { dayTime } from '@/lib/format';
import { getChallenge, readError } from '@/lib/read';
import type { Challenge } from '@/lib/types';

export const revalidate = 20;

export async function generateMetadata(props: PageProps<'/c/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Challenge ${id}` };
}

export default async function ChallengePage(props: PageProps<'/c/[id]'>) {
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  let c: Challenge | null = null;
  let error = '';
  try {
    const found = await getChallenge(id);
    if (!found.found) return <NotFoundCard what="challenge with this number" back="/challenges" backLabel="All challenges" />;
    c = found;
  } catch (e) {
    error = readError(e);
  }
  if (!c) return <div className="c-wrap py-12"><ReadError message={error} /></div>;
  const txs = await txIndex();
  const made = txs.challenge[String(id)];
  const read = txs.judge[String(id)];
  const open = c.verdict === '';
  return (
    <div className="c-wrap py-10">
      <p className="c-eyebrow">Challenge #{c.id} · entry {c.b.id} against entry {c.a.id} {open ? 'waiting to be read' : 'read'}</p>
      <h1 className="c-h1 mt-3" style={{ fontSize: 'clamp(30px, 5vw, 54px)' }}>Entry {c.a.id} was sealed {gap(c.seconds_between)} earlier</h1>
      <p className="c-muted mt-3 text-[14px]">
        filed by <Addr address={c.challenger} /> with <Money wei={c.stake} /> against <Addr address={c.accused} />
        {made && <> · <Tx hash={made.hash} /></>}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="c-text-box first">
          <span className="tag">Entry {c.a.id}, the earlier · first</span>
          <p className="c-faint mono mt-1 text-[12px]">{c.a.author.slice(0, 8)}…{c.a.author.slice(-4)} · sealed {dayTime(c.a.sealed_at)}</p>
          <p className="body">{c.a.text}</p>
        </div>
        <div className="c-text-box">
          <span className="tag">Entry {c.b.id}, the later · later</span>
          <p className="c-faint mono mt-1 text-[12px]">{c.b.author.slice(0, 8)}…{c.b.author.slice(-4)} · sealed {dayTime(c.b.sealed_at)}</p>
          <p className="body">{c.b.text}</p>
        </div>
      </div>

      <div className="c-grid-2 mt-8">
        <section className="c-card pad flex flex-col gap-3" aria-labelledby="verdict-h">
          <h2 id="verdict-h" className="c-eyebrow">Verdict</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="c-stat">{c.verdict || 'Not read yet'}</span>
            <LabelBadge label={c.label} />
          </div>
          {c.verdict ? (
            <>
              <p className="c-muted text-[14.5px]">{VERDICT_HELP[c.verdict]}</p>
              {c.label && <p className="c-faint text-[13px]">{LABEL_HELP[c.label]}</p>}
              {read?.votes ? (
                <p className="c-faint text-[13px]">
                  The label was agreed by {read.votes.agreed} of {read.votes.voted} validators who voted{read.votes.seconds ? `, in ${read.votes.seconds} seconds` : ''}. The judge saw no dates or names. <Tx hash={read.hash} label="read in" />
                </p>
              ) : read ? (
                <p className="c-faint text-[13px]">The judge saw no dates or names. <Tx hash={read.hash} label="read in" /></p>
              ) : null}
              <p className="c-faint text-[12.5px]">{c.resolved_at ? `Decided ${dayTime(c.resolved_at)}.` : ''}</p>
            </>
          ) : (
            <p className="c-muted text-[14.5px]">The validators have not compared these texts yet.</p>
          )}
          {c.verdict === 'PRIOR' && (
            <p className="c-note accent">Entry {c.b.id} is marked as overlapping entry {c.a.id}.</p>
          )}
        </section>
        <div className="flex flex-col gap-6">
          {open ? <JudgeBox challengeId={c.id} deadline={c.judge_deadline} a={c.a.id} b={c.b.id} challenger={c.challenger} /> : <WithdrawBox title="Withdraw what you are owed" />}
          <section className="c-card pad" aria-labelledby="money-h">
            <h2 id="money-h" className="c-eyebrow">Where the money went</h2>
            <div className="mt-2">
              {c.verdict === 'CLEARED' ? (
                <div className="c-field-row"><span className="c-muted">Stake to the accused</span><Money wei={c.to_accused} /></div>
              ) : c.verdict ? (
                <>
                  <div className="c-field-row"><span className="c-muted">Stake back to the challenger</span><Money wei={c.stake} /></div>
                  <div className="c-field-row"><span className="c-muted">Bond of entry {c.b.id}</span><Money wei={c.bonus} /></div>
                </>
              ) : (
                <div className="c-field-row"><span className="c-muted">Stake held by the contract</span><Money wei={c.stake} /></div>
              )}
              <div className="c-field-row"><span className="c-muted">Entry {c.b.id} marked</span><span className="mono">{c.b.overlaps ? `overlaps #${c.b.overlaps}` : 'not marked'}</span></div>
              <div className="c-field-row"><span className="c-muted">Seasoning of {c.b.id}</span><span className="mono">{c.b.state === 'SEASONED' ? 'seasoned' : c.b.overlaps ? 'stopped' : seasoningLeft(c.b.seasons_at)}</span></div>
            </div>
            <div className="mt-3"><Marks e={c.b} /></div>
            <p className="c-faint mt-3 text-[12.5px]">
              {c.winnable ? 'The later entry was inside its 90 days, so its bond could be won.' : 'The later entry was past its 90 days, so there was no bond to win.'} Money leaves the contract only when someone withdraws.
            </p>
          </section>
          <p className="c-faint text-[12.5px]"><Link href={`/e/${c.a.id}`} className="c-link">Entry {c.a.id}</Link> · <Link href={`/e/${c.b.id}`} className="c-link">Entry {c.b.id}</Link></p>
        </div>
      </div>
    </div>
  );
}
