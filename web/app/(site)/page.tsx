import Link from 'next/link';

import { Empty, LabelBadge, Marks, StateBadge, VerdictBadge } from '@/components/ui';
import { gap } from '@/lib/claims';
import { dayTime, gen, short } from '@/lib/format';
import { featuredEntry, getTotals, readError, recentChallenges } from '@/lib/read';
import type { Challenge, Entry, Totals } from '@/lib/types';

export const revalidate = 20;

const FAQ = [
  ['Is it a copyright?', 'No. Prior records who sealed a description first and whether a later one reproduces it. It gives no legal rights, and it proves neither authorship nor originality.'],
  ['Can others see my idea?', 'Not until you reveal it. The chain stores only a hash of your text, a salt and your address, with the date. Your text and salt stay in your browser as a ticket. Once you reveal, the text is public: seal a description, not a secret.'],
  ['What if someone sealed it first?', 'Then they are first on chain, whoever wrote it. Prior cannot tell a stolen idea from an original one, and it says so on every entry. What it can prove is the order of the seals.'],
  ['Which network is it on?', 'GenLayer Studio Next, chain 61997. The contract address is in the footer, and every figure on this site is read from it.'],
] as const;

function Hero({ featured, error }: { featured: Entry | null; error: string }) {
  return (
    <section className="c-wrap grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:py-20">
      <div>
        <p className="c-eyebrow">Priority registry, judged on GenLayer</p>
        <h1 className="c-h1 mt-4">
          Be first, <em>provably.</em>
        </h1>
        <p className="c-lead mt-5">Seal a description of your idea. The chain stamps the date and nobody sees the text. If a later entry copies it, GenLayer validators compare the two.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/new" className="c-btn solid">Register an idea</Link>
          <Link href="/challenges" className="c-btn">See a dispute</Link>
        </div>
        <p className="c-faint mt-6 text-[13.5px]">A copy loses its bond to you.</p>
      </div>
      <div>
        {featured ? (
          <div className="c-card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] p-4">
              <div>
                <p className="c-eyebrow">Entry #{featured.id} · {short(featured.author)}</p>
                <p className="c-faint mono mt-1 text-[12px]">sealed {dayTime(featured.sealed_at)} · seal {featured.seal.slice(0, 4)}…{featured.seal.slice(-4)} · bond {gen(featured.bond)}</p>
              </div>
              <StateBadge state={featured.state} />
            </div>
            <div className="p-4">
              {featured.revealed ? <p className="c-text serif text-[18px]">{featured.text}</p> : <p className="c-faint text-[14px]">Sealed. The text has not been revealed.</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] p-4 text-[13px]">
              <Marks e={featured} />
              <Link href={`/e/${featured.id}`} className="c-link">Open the entry →</Link>
            </div>
          </div>
        ) : (
          <Empty>{error || 'No entry has been sealed yet. Register the first one.'}</Empty>
        )}
      </div>
    </section>
  );
}

function Recent({ list }: { list: Challenge[] }) {
  return (
    <section className="c-wrap pb-14">
      <p className="c-eyebrow mb-3">Recent challenges</p>
      {list.length === 0 ? (
        <Empty>No challenge has been filed yet.</Empty>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-[4px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {list.map((c) => (
            <Link key={c.id} href={`/c/${c.id}`} className="c-row-link bg-[var(--surface)] p-4">
              <VerdictBadge verdict={c.verdict} />
              <p className="mt-3 text-[14.5px] font-medium">Entry {c.b.id} vs {c.a.id}</p>
              <p className="c-faint mt-1 text-[13px]">{gap(c.seconds_between)} later{c.label ? ` · ${c.label.toLowerCase()}` : ''}</p>
              <p className="c-faint mono mt-2 text-[11.5px]">challenge #{c.id}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function How() {
  const steps = [
    ['01', 'Seal', 'A hash of your description, a date set by the chain, and a bond of at least 2 GEN.'],
    ['02', 'Reveal', 'Publish the text when you are ready. The contract checks it against the seal, and the date never moves.'],
    ['03', 'Challenge', 'The earlier author stakes 5 GEN against a later entry that copies it. Both must be revealed.'],
    ['04', 'Mark', 'Validators compare the two texts, never the dates. The verdict follows in code, and the mark goes on the later entry.'],
  ];
  return (
    <section id="how" className="c-section">
      <div className="c-wrap">
        <p className="c-eyebrow">How it works</p>
        <h2 className="c-h2 mt-2 max-w-[18em]">Seal, reveal, challenge, mark</h2>
        <div className="c-steps mt-8">
          {steps.map(([n, t, d]) => (
            <div key={n}>
              <p className="mono c-faint text-[12px]">{n}</p>
              <p className="c-h3 mt-3">{t}</p>
              <p className="c-muted mt-2 text-[14.5px]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatASealProves() {
  return (
    <section className="c-section">
      <div className="c-wrap c-grid-2">
        <div>
          <p className="c-eyebrow">What a seal proves</p>
          <h2 className="c-h2 mt-2">A date on chain, and what it does not show</h2>
          <p className="c-muted mt-4 max-w-[34em] text-[15.5px]">A hash proves a text existed on a date. A copy that is reworded or translated has a different hash and the same substance, which is why a neutral reading of two texts decides the overlap, and a fact on chain decides who was first.</p>
        </div>
        <div className="c-card pad">
          <table className="c-table">
            <thead><tr><th>It shows</th><th>It does not show</th></tr></thead>
            <tbody>
              <tr><td>Who sealed first, by chain time</td><td className="c-muted">Who wrote the idea</td></tr>
              <tr><td>That a revealed text matches its seal</td><td className="c-muted">That the idea is original</td></tr>
              <tr><td>Whether a later entry reproduces it, as validators read it</td><td className="c-muted">Any legal right</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ForWriters({ totals }: { totals: Totals | null }) {
  return (
    <section id="writers" className="c-section">
      <div className="c-wrap c-grid-2">
        <div>
          <p className="c-eyebrow">For writers and communities</p>
          <h2 className="c-h2 mt-2">What the bond and the stake are for</h2>
          <p className="c-muted mt-4 max-w-[34em] text-[15.5px]">A bond makes sealing everything costly, so vague entries do not hoard dates. A stake makes challenging everything costly, so only real copies are filed. A neutral record of who proposed a format first settles the feud before it starts.</p>
        </div>
        <div className="c-card pad">
          <p className="c-eyebrow mb-1">The rules</p>
          <div className="c-field-row"><span className="c-muted">Bond per entry</span><b className="mono">at least 2 GEN</b></div>
          <div className="c-field-row"><span className="c-muted">Stake to challenge</span><b className="mono">5 GEN</b></div>
          <div className="c-field-row"><span className="c-muted">PRIOR</span><b className="mono">stake back + the later bond</b></div>
          <div className="c-field-row"><span className="c-muted">RELATED</span><b className="mono">stake back</b></div>
          <div className="c-field-row"><span className="c-muted">CLEARED</span><b className="mono">stake to the accused</b></div>
          <div className="c-field-row"><span className="c-muted">SEASONED</span><b className="mono">bond back after 90 days</b></div>
          {totals && <p className="c-faint mt-3 text-[12.5px]">On the chain now: {totals.entries} entries, {totals.challenges} challenges, {gen(totals.bonds_left)} held in bonds.</p>}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="c-section">
      <div className="c-wrap c-grid-2">
        <div>
          <p className="c-eyebrow">FAQ</p>
          <h2 className="c-h2 mt-2">Questions people ask first</h2>
          <p className="c-muted mt-4 text-[15px]">More in the <Link href="/docs/more/faq" className="c-link">docs</Link>.</p>
        </div>
        <div className="c-faq">
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  let featured: Entry | null = null;
  let recent: Challenge[] = [];
  let totals: Totals | null = null;
  let error = '';
  try {
    totals = await getTotals();
    featured = await featuredEntry();
    recent = await recentChallenges(4, true);
  } catch (e) {
    error = readError(e);
  }
  return (
    <>
      <Hero featured={featured} error={error} />
      <Recent list={recent} />
      <How />
      <WhatASealProves />
      <ForWriters totals={totals} />
      <Faq />
    </>
  );
}
