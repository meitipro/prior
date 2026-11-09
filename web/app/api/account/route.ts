import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

import { listEntries, readError } from '@/lib/read';

/**
 * One account's entries and balance, read through the site so the browser
 * spends no RPC budget of its own and the answer is cached with the rest.
 */
export async function GET(request: Request) {
  const address = String(new URL(request.url).searchParams.get('address') ?? '');
  if (!isAddress(address, { strict: false })) return NextResponse.json({ error: 'Send a wallet address.' }, { status: 400 });
  try {
    return NextResponse.json({ listing: await listEntries(address, 0, 30) });
  } catch (error) {
    return NextResponse.json({ error: readError(error) }, { status: 502 });
  }
}
