'use client';

/**
 * The ticket of a sealed entry: the text and the salt, which only the author
 * has until they reveal. They are kept in this browser's localStorage, never
 * sent anywhere, and the page says so and offers a download, because losing
 * them means the seal can never be revealed.
 */

export type Ticket = { id: number; address: string; text: string; salt: string; seal: string; savedAt: number };

const KEY = 'prior.tickets.v1';

function read(): Ticket[] {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTicket(ticket: Ticket): boolean {
  try {
    const rest = read().filter((t) => !(t.address.toLowerCase() === ticket.address.toLowerCase() && t.seal === ticket.seal));
    globalThis.localStorage.setItem(KEY, JSON.stringify([...rest, ticket]));
    return true;
  } catch {
    return false;
  }
}

export function ticketFor(address: string, id: number): Ticket | null {
  return read().find((t) => t.address.toLowerCase() === address.toLowerCase() && t.id === id) ?? null;
}

export function ticketsOf(address: string): Ticket[] {
  return read().filter((t) => t.address.toLowerCase() === address.toLowerCase());
}

export function forget(address: string, id: number): void {
  try {
    globalThis.localStorage.setItem(KEY, JSON.stringify(read().filter((t) => !(t.address.toLowerCase() === address.toLowerCase() && t.id === id))));
  } catch {
    /* nothing to forget */
  }
}

/** The ticket as a small JSON file the author can keep. */
export function downloadTicket(ticket: Ticket): void {
  const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prior-entry-${ticket.id}-ticket.json`;
  a.click();
  URL.revokeObjectURL(url);
}
