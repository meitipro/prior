'use client';

import { useEffect, useState } from 'react';

import { gen } from '@/lib/format';
import { length } from '@/lib/seal.mjs';
import { downloadTicket, forget, ticketFor } from '@/lib/ticket';

import { TxProgress, useWrite } from './Actions';
import { WalletGate, useWallet } from './Wallet';

/** The chain time as the browser sees it, ticking once a second. */
export function useNow(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** The author publishes the text, checked against the seal. The ticket comes from this browser, or is pasted. */
export function RevealBox({ entryId, author }: { entryId: number; author: string }) {
  const w = useWallet();
  const { state, busy, run } = useWrite([`entry:${entryId}`]);
  const [text, setText] = useState('');
  const [salt, setSalt] = useState('');
  const [found, setFound] = useState<boolean | null>(null);
  useEffect(() => {
    if (!w.account) return;
    const t = ticketFor(w.account, entryId);
    setFound(Boolean(t));
    if (t) {
      setText(t.text);
      setSalt(t.salt);
    }
  }, [w.account, entryId]);
  if (!w.account || w.account.toLowerCase() !== author.toLowerCase()) return null;
  async function go() {
    const done = await run('reveal', [entryId, text, salt]);
    if (done.phase === 'done') forget(w.account, entryId);
  }
  return (
    <div className="c-card pad flex flex-col gap-3">
      <p className="c-eyebrow">Your entry, still sealed</p>
      {found === false && (
        <div className="c-note" style={{ color: 'var(--danger)' }}>
          <p>No ticket for this entry is saved in this browser. Paste the text and the salt you kept. Without both, the seal cannot be revealed: that is what makes it a seal.</p>
        </div>
      )}
      {found && <p className="c-muted text-[14px]">Your ticket was found in this browser. A revealed text is public, and revealing never changes the date.</p>}
      <div>
        <label className="c-label" htmlFor="rtext">Text ({length(text)}/1,500)</label>
        <textarea id="rtext" className="c-textarea" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div>
        <label className="c-label" htmlFor="rsalt">Salt</label>
        <input id="rsalt" className="c-input mono" value={salt} onChange={(e) => setSalt(e.target.value)} />
      </div>
      <WalletGate action="reveal this entry">
        <button className="c-btn solid wide" disabled={busy || !text || length(text) > 1500} onClick={go}>
          Reveal the text
        </button>
      </WalletGate>
      <TxProgress state={state} waiting="Checking the text against the seal" />
    </div>
  );
}

/** Anyone asks the validators to compare the two texts. */
export function JudgeBox({ challengeId, deadline, a, b, challenger }: { challengeId: number; deadline: number; a: number; b: number; challenger: string }) {
  const now = useNow();
  const { state, busy, run } = useWrite([`challenge:${challengeId}`, `entry:${a}`, `entry:${b}`, `account:${challenger.toLowerCase()}`]);
  const late = now >= deadline;
  return (
    <div className="c-card pad flex flex-col gap-3">
      <p className="c-eyebrow">{late ? 'Nobody read this in time' : 'Waiting to be read'}</p>
      <p className="c-muted text-[14px]">
        {late
          ? 'This challenge waited more than 48 hours. The next call voids it: no model runs, the stake goes back to the challenger, and the pair can be filed again.'
          : 'Anyone can ask the validators to compare the two texts. They never see dates, names or addresses. Several answer one label each, and the label stands only when they agree. It takes about a minute.'}
      </p>
      <WalletGate action="ask the validators">
        <button className="c-btn solid wide" disabled={busy} onClick={() => run('judge', [challengeId])}>
          {late ? 'Void this challenge' : 'Ask the validators to compare them'}
        </button>
      </WalletGate>
      <TxProgress state={state} waiting="Validators are reading" />
    </div>
  );
}

/** Anyone closes a seasoned entry: the bond returns to its author. */
export function CloseBox({ entryId, author, seasonsAt, overlaps, openChallenges, bondLeft }: { entryId: number; author: string; seasonsAt: number; overlaps: number; openChallenges: number; bondLeft: string }) {
  const now = useNow();
  const { state, busy, run } = useWrite([`entry:${entryId}`, `account:${author.toLowerCase()}`]);
  if (now < seasonsAt) return null;
  return (
    <div className="c-card pad flex flex-col gap-3">
      <p className="c-eyebrow">90 days have passed</p>
      {overlaps > 0 ? (
        <p className="c-muted text-[14px]">This entry is marked as overlapping an earlier one, so it does not season and its bond was forfeited.</p>
      ) : openChallenges > 0 ? (
        <p className="c-muted text-[14px]">A challenge is still waiting to be read. Read it first, then the entry can season.</p>
      ) : (
        <>
          <p className="c-muted text-[14px]">Nothing was upheld against this entry. Closing marks it SEASONED and credits its bond, {gen(bondLeft)}, to its author. Anyone can close it.</p>
          <WalletGate action="close this entry">
            <button className="c-btn solid wide" disabled={busy} onClick={() => run('close_entry', [entryId])}>
              Season it and return the bond
            </button>
          </WalletGate>
          <TxProgress state={state} waiting="Recording the close" />
        </>
      )}
    </div>
  );
}

export function useBalance(address: string): { owed: bigint | null; reload: () => void } {
  const [owed, setOwed] = useState<bigint | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!address) return;
    let live = true;
    fetch(`/api/account?address=${address}&brief=1`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => live && setOwed(BigInt(b?.listing?.balance ?? '0')))
      .catch(() => live && setOwed(null));
    return () => {
      live = false;
    };
  }, [address, n]);
  return { owed, reload: () => setN((v) => v + 1) };
}

/** Withdraw whatever the contract owes the connected account: the only call that pays. */
export function WithdrawBox({ title = 'Your balance' }: { title?: string }) {
  const w = useWallet();
  const { owed, reload } = useBalance(w.account);
  const { state, busy, run } = useWrite(w.account ? [`account:${w.account.toLowerCase()}`] : []);
  if (!w.account || !w.chainOk) return null;
  return (
    <div className="c-card pad flex flex-col gap-3">
      <p className="c-eyebrow">{title}</p>
      <p className="c-stat mono">{owed === null ? '…' : gen(owed)}</p>
      <p className="c-faint text-[13px]">Verdicts only move balances inside the contract. Withdraw is the one call that pays, to you, in its own transaction.</p>
      <button
        className="c-btn solid wide"
        disabled={busy || !owed || owed <= 0n}
        onClick={async () => {
          const done = await run('withdraw', []);
          if (done.phase === 'done') reload();
        }}
      >
        {owed && owed > 0n ? `Withdraw ${gen(owed)}` : 'Nothing to withdraw'}
      </button>
      <TxProgress state={state} waiting="Recording the withdrawal" />
    </div>
  );
}

export { downloadTicket };
