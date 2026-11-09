'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { gap } from '@/lib/claims';
import { gen, short } from '@/lib/format';
import type { EntryRow } from '@/lib/types';

import { TxProgress, useWrite } from './Actions';
import { WalletGate, useWallet } from './Wallet';

const STAKE = 5n * 10n ** 18n;

/** Pick a later revealed entry, read both side by side, stake 5 GEN and file. Only the author of the earlier entry can sign it. */
export function ChallengeForm({ a, candidates, initial }: { a: EntryRow; candidates: EntryRow[]; initial?: number }) {
  const router = useRouter();
  const w = useWallet();
  const { state, busy, run } = useWrite(['chain', `entry:${a.id}`]);
  const [pick, setPick] = useState<number>(initial && candidates.some((c) => c.id === initial) ? initial : candidates[0]?.id ?? 0);
  const b = candidates.find((c) => c.id === pick);
  const mine = w.account && w.account.toLowerCase() === a.author.toLowerCase();

  async function go() {
    const done = await run('challenge', [a.id, pick], STAKE);
    if (done.phase === 'done' && done.returned !== undefined) router.push(`/c/${String(done.returned)}`);
  }

  if (candidates.length === 0) return <div className="c-note">No later revealed entry from another author exists yet. A challenge needs both entries revealed, with yours sealed strictly before.</div>;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="c-label" htmlFor="later">The later entry you think copies yours</label>
        <select id="later" className="c-select" value={pick} onChange={(e) => setPick(Number(e.target.value))}>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>#{c.id} · {short(c.author)} · {c.text.slice(0, 70)}</option>
          ))}
        </select>
      </div>
      {b && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="c-text-box first">
            <span className="tag">Entry #{a.id}, the earlier · first</span>
            <p className="body">{a.text}</p>
          </div>
          <div className="c-text-box">
            <span className="tag">Entry #{b.id}, the later · sealed {gap(b.sealed_at - a.sealed_at)} after</span>
            <p className="body">{b.text}</p>
          </div>
        </div>
      )}
      <div className="c-card pad flex max-w-xl flex-col gap-3">
        <div className="c-field-row"><span className="c-muted">Stake</span><b className="mono">{gen(STAKE)}</b></div>
        <p className="c-faint text-[13px]">
          PRIOR returns it and, if the later entry is still inside its 90 days, adds that entry&apos;s bond. RELATED returns it. CLEARED pays it to the accused. A pair can be challenged once. The judge sees only the two texts, never the dates or the names.
        </p>
        {!mine && w.account && <p className="text-[13px]" style={{ color: 'var(--danger)' }}>This wallet did not seal entry #{a.id}. Only its author can file.</p>}
        <WalletGate action="file this challenge">
          <button className="c-btn solid wide" disabled={busy || !b || !mine} onClick={go}>
            Stake {gen(STAKE)} and file
          </button>
        </WalletGate>
        <TxProgress state={state} waiting="Recording your challenge" />
      </div>
    </div>
  );
}
