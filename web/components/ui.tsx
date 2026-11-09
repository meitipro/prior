import Link from 'next/link';

import { gen, short, shortHash } from '@/lib/format';
import { DEPLOYMENT } from '@/lib/genlayer-core.mjs';
import type { EntryRow, Label, State, Verdict } from '@/lib/types';

export const EXPLORER = DEPLOYMENT.explorer as string;
export const CONTRACT = DEPLOYMENT.prior as string;

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;

export function Tx({ hash, label }: { hash?: string; label?: string }) {
  if (!hash) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={txUrl(hash)} target="_blank" rel="noreferrer">
      {label ? `${label} ` : ''}
      {shortHash(hash)} ↗
    </a>
  );
}

export function Addr({ address }: { address: string }) {
  if (!address) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={addressUrl(address)} target="_blank" rel="noreferrer" title={address}>
      {short(address)}
    </a>
  );
}

export function Money({ wei, strong }: { wei: string | bigint; strong?: boolean }) {
  return <span className={`mono ${strong ? 'font-semibold' : ''}`}>{gen(wei)}</span>;
}

/** Emerald for revealed entries, dotted for sealed ones, plain for seasoned. */
export function StateBadge({ state }: { state: State }) {
  return <span className={`c-state-pill ${state.toLowerCase()}`}>{state}</span>;
}

export function LabelBadge({ label }: { label: Label | '' }) {
  if (!label) return null;
  return <span className={`c-label-pill ${label === 'SUBSTANTIAL' ? 'hit' : label === 'PARTIAL' ? 'half' : ''}`}>{label}</span>;
}

export function VerdictBadge({ verdict }: { verdict: Verdict | '' }) {
  if (!verdict) return <span className="c-verdict">Waiting to be read</span>;
  return <span className={`c-verdict ${verdict === 'PRIOR' ? 'yes' : verdict === 'RELATED' ? 'half' : ''}`}>{verdict}</span>;
}

/** The marks an entry carries: emerald OVERLAPS, hatched related, grey cleared. */
export function Marks({ e }: { e: Pick<EntryRow, 'overlaps' | 'related' | 'cleared'> }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {e.overlaps > 0 && (
        <Link href={`/e/${e.overlaps}`} className="c-mark overlaps">
          overlaps #{e.overlaps}
        </Link>
      )}
      {e.related > 0 && <span className="c-mark related">{e.related} related</span>}
      {e.cleared > 0 && <span className="c-mark cleared">{e.cleared} cleared</span>}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="c-note">{children}</div>;
}

export function ReadError({ message }: { message: string }) {
  return (
    <div className="c-card pad">
      <p className="font-medium">The chain did not answer.</p>
      <p className="c-muted mt-1 text-[14px]">{message}</p>
    </div>
  );
}

export function NotFoundCard({ what, back, backLabel }: { what: string; back: string; backLabel: string }) {
  return (
    <div className="c-wrap py-20">
      <div className="c-card pad max-w-xl">
        <p className="c-eyebrow">Not found</p>
        <h1 className="c-h2 mt-2">There is no {what}.</h1>
        <p className="c-muted mt-2">It may not exist yet on Studio Next, or the number is wrong.</p>
        <Link href={back} className="c-btn mt-4">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

/** An entry as one row: number, text or a seal, date, state and marks. */
export function EntryRowView({ e }: { e: EntryRow }) {
  return (
    <Link href={`/e/${e.id}`} className="c-card c-row-link pad flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="c-h3">Entry #{e.id}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Marks e={e} />
          <StateBadge state={e.state} />
        </div>
      </div>
      {e.revealed ? <p className="c-text line-clamp-2 text-[15px]">{e.text}</p> : <p className="c-faint mono text-[12.5px]">sealed · {e.seal.slice(0, 16)}… · text not revealed</p>}
      <p className="c-faint text-[12.5px]">
        <span className="mono">{short(e.author)}</span> · bond <span className="mono">{gen(e.bond_left)}</span>
      </p>
    </Link>
  );
}
