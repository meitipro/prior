import Link from 'next/link';

import { WalletButton } from './Wallet';

/** The site's mark, the same drawing as app/icon.svg: a sealed line, stamped with a first. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden style={{ flexShrink: 0 }}>
      <rect width="512" height="512" rx="72" fill="#34d399" />
      <rect x="112" y="150" width="288" height="36" rx="8" fill="#04210f" />
      <rect x="112" y="224" width="216" height="36" rx="8" fill="#04210f" />
      <rect x="112" y="298" width="252" height="36" rx="8" fill="#04210f" />
      <circle cx="372" cy="372" r="46" fill="#ecfdf5" />
      <rect x="360" y="346" width="10" height="52" rx="5" fill="#04210f" />
      <rect x="346" y="346" width="24" height="10" rx="5" fill="#04210f" />
    </svg>
  );
}

export function Nav() {
  return (
    <header className="c-nav">
      <div className="c-wrap c-nav-row">
        <Link href="/" className="c-brand" aria-label="Prior home">
          <Mark />
          prior
        </Link>
        <nav className="c-links" aria-label="Main">
          <Link href="/entries">Entries</Link>
          <Link href="/challenges">Challenges</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="c-nav-right">
          <span className="c-pill hidden sm:inline-flex" title="GenLayer Studio Next, chain 61997">
            <span className="dot" />
            Studio Next
          </span>
          <WalletButton />
          <Link href="/new" className="c-btn small solid hidden sm:inline-flex">
            Register an idea
          </Link>
        </div>
      </div>
      <nav className="c-links-mobile c-wrap" aria-label="Main, small screens">
        <Link href="/entries">Entries</Link>
        <Link href="/challenges">Challenges</Link>
        <Link href="/me">My entries</Link>
        <Link href="/new">Register an idea</Link>
        <Link href="/docs">Docs</Link>
      </nav>
    </header>
  );
}
