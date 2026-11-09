import type { Metadata } from 'next';

import { MePanel } from '@/components/MePanel';

export const metadata: Metadata = { title: 'My entries' };

export default async function MePage(props: PageProps<'/me'>) {
  const search = await props.searchParams;
  const address = typeof search.address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(search.address) ? search.address : '';
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">My entries</p>
      <h1 className="c-h2 mt-2">Entries by state, tickets and balance</h1>
      <p className="c-muted mt-2 max-w-[42em] text-[15px]">Everything an account has on the contract, for the connected wallet or for any address with <span className="mono text-[13.5px]">?address=0x…</span>. Tickets are kept only in this browser.</p>
      <div className="mt-8"><MePanel address={address} /></div>
    </div>
  );
}
