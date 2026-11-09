'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { gen, toWei } from '@/lib/format';
import { length, newSalt, sealOf } from '@/lib/seal.mjs';
import { downloadTicket, saveTicket, type Ticket } from '@/lib/ticket';

import { TxProgress, useWrite } from './Actions';
import { WalletGate, useWallet } from './Wallet';

const MIN_BOND = 2n * 10n ** 18n;

/** Write a description, seal it with a bond, keep the ticket. The text never leaves this browser until it is revealed. */
export function SealForm() {
  const w = useWallet();
  const router = useRouter();
  const { state, busy, run } = useWrite(['chain']);
  const [text, setText] = useState('');
  const [salt] = useState(() => newSalt());
  const [bondText, setBondText] = useState('2');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [saved, setSaved] = useState(true);
  const n = length(text);
  const bond = toWei(bondText);
  const seal = useMemo(() => (w.account && text.trim() ? sealOf(text, salt, w.account) : ''), [w.account, text, salt]);
  const hints = [
    ['Names the format', /newsletter|podcast|thread|dashboard|bot|game|app|tool|format|series|campaign|course|report|digest/i.test(text)],
    ['Names the distinctive parts', n > 90],
    ['Says what is new', /\b(new|only|unlike|instead|first|adds|with a|that)\b/i.test(text)],
  ] as const;

  async function go() {
    if (!w.account || !bond) return;
    const done = await run('register', [seal], bond);
    if (done.phase === 'done' && done.returned !== undefined) {
      const t: Ticket = { id: Number(done.returned), address: w.account, text, salt, seal, savedAt: Date.now() };
      setSaved(saveTicket(t));
      setTicket(t);
    }
  }

  if (ticket) {
    return (
      <div className="c-card pad flex max-w-2xl flex-col gap-4">
        <p className="c-eyebrow">Sealed</p>
        <h2 className="c-h2">Entry #{ticket.id} is dated by the chain.</h2>
        <div className="c-note accent">
          <p>Your ticket is {saved ? 'saved in this browser' : 'NOT saved: this browser blocked storage'}. It holds your text and your salt. Without both, the seal can never be revealed. Download it too.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="c-btn" onClick={() => downloadTicket(ticket)}>Download the ticket</button>
          <button className="c-btn solid" onClick={() => router.push(`/e/${ticket.id}`)}>Open the entry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col gap-4">
        <div className="c-card pad flex flex-col gap-3">
          <label className="c-label" htmlFor="idea">Describe it, so a stranger could tell a copy from it</label>
          <textarea id="idea" className="c-textarea" style={{ minHeight: 170 }} maxLength={1600} value={text} onChange={(e) => setText(e.target.value)} placeholder="A weekly newsletter that turns each governance vote into plain language and adds a table of how the ten largest holders voted, with a note when a holder voted against their usual side." />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
            <span className="c-faint">Any language, public once revealed. Seal a description, not a secret.</span>
            <span className={n > 1500 ? '' : 'c-faint'} style={n > 1500 ? { color: 'var(--danger)' } : undefined}>{n} / 1,500</span>
          </div>
        </div>
        <div className="c-card pad">
          <p className="c-eyebrow mb-2">Specific beats broad</p>
          <div className="flex flex-wrap gap-2">
            {hints.map(([label, ok]) => (
              <span key={label} className={`c-mark ${ok ? 'overlaps' : 'cleared'}`}>{ok ? '✓ ' : ''}{label}</span>
            ))}
          </div>
          <p className="c-faint mt-2 text-[12.5px]">Hints only. A broad entry earns a partial mark at most, and a vague one loses to a specific copy.</p>
        </div>
        <div className="c-card pad flex flex-col gap-3">
          <label className="c-label" htmlFor="bond">Bond, GEN (at least 2)</label>
          <input id="bond" className="c-input mono" inputMode="decimal" value={bondText} onChange={(e) => setBondText(e.target.value)} />
          <WalletGate action="seal this entry">
            <button className="c-btn solid wide" disabled={busy || !seal || n > 1500 || !bond || bond < MIN_BOND} onClick={go}>
              Seal with a {bond ? gen(bond) : '…'} bond
            </button>
          </WalletGate>
          <p className="c-faint text-[12.5px]">Network fee estimated by your wallet. Your ticket is saved in this browser.</p>
          <TxProgress state={state} waiting="The chain is stamping the date" />
        </div>
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="c-card pad">
          <p className="c-eyebrow">What gets sealed</p>
          <p className="c-faint mono mt-2 break-all text-[12px]">seal {seal ? `${seal.slice(0, 12)}…${seal.slice(-6)}` : '—'}</p>
          <p className="c-muted mt-2 text-[13.5px]">sha256 of your text, a salt and your address. The date is set by the chain, on signing. The text stays in your browser.</p>
        </div>
        <div className="c-card pad">
          <p className="c-eyebrow">Bond and stake</p>
          <div className="c-field-row"><span className="c-muted">Bond</span><b className="mono">{bond ? gen(bond) : '—'}</b></div>
          <div className="c-field-row"><span className="c-muted">Back after</span><b className="mono">90 days</b></div>
          <div className="c-field-row"><span className="c-muted">If copied and upheld</span><b className="mono">to the challenger</b></div>
          <p className="c-faint mt-3 text-[12.5px]">A challenge against an entry costs its filer 5 GEN. A bond returns if nothing is upheld against the entry for 90 days.</p>
        </div>
      </aside>
    </div>
  );
}
