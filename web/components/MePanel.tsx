'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { gen, short } from '@/lib/format';
import { ticketsOf, downloadTicket, type Ticket } from '@/lib/ticket';
import type { Listing } from '@/lib/types';

import { WithdrawBox } from './Boxes';
import { Empty, Marks, StateBadge } from './ui';
import { WalletGate, useWallet } from './Wallet';

/** Entries by state, tickets saved in this browser, balance and withdraw. */
export function MePanel({ address }: { address: string }) {
  const w = useWallet();
  const who = address || w.account;
  const [data, setData] = useState<Listing | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!who) return;
    let live = true;
    setError('');
    fetch(`/api/account?address=${who}`, { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body?.error ?? 'The chain did not answer.');
        if (live) setData(body.listing);
      })
      .catch((e) => live && setError(String(e?.message ?? e)));
    setTickets(ticketsOf(who));
    return () => {
      live = false;
    };
  }, [who, w.balance]);

  if (!who) {
    return (
      <WalletGate action="see your entries">
        <Empty>Connect a wallet to see your entries, tickets and balance, or open this page with ?address=0x…</Empty>
      </WalletGate>
    );
  }
  if (error) return <div className="c-note" style={{ color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <div className="c-note flex items-center gap-2"><span className="c-spin" /> Reading the chain…</div>;
  const mine = !address || address.toLowerCase() === w.account.toLowerCase();
  const sealed = data.items.filter((e) => e.state === 'SEALED');
  const rest = data.items.filter((e) => e.state !== 'SEALED');
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="flex flex-col gap-8">
        {mine && sealed.length > 0 && (
          <section>
            <h2 className="c-eyebrow mb-3">Sealed, waiting for you to reveal</h2>
            <div className="flex flex-col gap-3">
              {sealed.map((e) => {
                const t = tickets.find((x) => x.id === e.id);
                return (
                  <Link key={e.id} href={`/e/${e.id}`} className="c-card c-row-link pad flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="c-h3">Entry #{e.id}</p>
                      <p className="c-faint mono mt-1 text-[12px]">{e.seal.slice(0, 18)}… · bond {gen(e.bond_left)}</p>
                    </div>
                    <span className={t ? 'c-mark overlaps' : 'c-mark cleared'}>{t ? 'ticket saved here' : 'no ticket in this browser'}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        <section>
          <h2 className="c-eyebrow mb-3">Entries by {short(who)} · {data.total}</h2>
          {rest.length === 0 && sealed.length === 0 ? (
            <Empty>No entry yet. <Link href="/new" className="c-link">Register an idea.</Link></Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {rest.map((e) => (
                <Link key={e.id} href={`/e/${e.id}`} className="c-card c-row-link pad flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="c-h3">Entry #{e.id}</p>
                    <div className="flex items-center gap-2"><Marks e={e} /><StateBadge state={e.state} /></div>
                  </div>
                  <p className="c-text line-clamp-2 text-[15px]">{e.text}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="flex flex-col gap-4">
        {mine ? (
          <WithdrawBox />
        ) : (
          <div className="c-card pad">
            <p className="c-eyebrow">Owed to {short(who)}</p>
            <p className="c-stat mono mt-2">{gen(data.balance ?? '0')}</p>
          </div>
        )}
        <div className="c-card pad">
          <p className="c-eyebrow">Earned and withdrawn</p>
          <div className="c-field-row"><span className="c-muted">Credited so far</span><span className="mono">{gen(data.earned ?? '0')}</span></div>
          <div className="c-field-row"><span className="c-muted">Withdrawn</span><span className="mono">{gen(data.withdrawn ?? '0')}</span></div>
        </div>
        {mine && tickets.length > 0 && (
          <div className="c-card pad">
            <p className="c-eyebrow">Tickets saved in this browser</p>
            {tickets.map((t) => (
              <div key={t.seal} className="c-field-row">
                <span className="text-[14px]">Entry #{t.id}</span>
                <button className="c-btn small" onClick={() => downloadTicket(t)}>Download</button>
              </div>
            ))}
            <p className="c-faint mt-2 text-[12.5px]">A ticket holds your text and salt. They live only here until you reveal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
