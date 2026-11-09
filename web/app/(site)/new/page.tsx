import type { Metadata } from 'next';

import { SealForm } from '@/components/SealForm';

export const metadata: Metadata = { title: 'Register an idea' };

export default function NewPage() {
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Register an idea</p>
      <h1 className="c-h2 mt-2">Sealed until you reveal</h1>
      <p className="c-muted mt-2 max-w-[42em] text-[15px]">Sealed with a hash, dated by the chain. The text stays with you until you reveal it, and a revealed text is public.</p>
      <div className="mt-8">
        <SealForm />
      </div>
    </div>
  );
}
