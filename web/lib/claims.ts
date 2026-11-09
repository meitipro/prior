import type { Label, State, Verdict } from './types';

export const LABEL_HELP: Record<Label, string> = {
  SUBSTANTIAL: 'The later text contains the core of the earlier one: its central idea, method or distinctive parts.',
  PARTIAL: 'The later text shares some parts of the earlier one, but not its core.',
  NONE: 'They share nothing beyond what is common in the field.',
};

export const VERDICT_HELP: Record<Verdict, string> = {
  PRIOR: 'The later entry reproduces the earlier one and is marked as overlapping it. If it was inside its 90 days, its bond goes to the challenger.',
  RELATED: 'A partial overlap. The stake goes back to the challenger, the bond stays, and both entries show a related note.',
  CLEARED: 'No overlap beyond what is common in the field. The stake goes to the accused.',
  VOID: 'Nobody could read it in time, so the stake went back and nothing was decided.',
};

export const STATE_HELP: Record<State, string> = {
  SEALED: 'A hash and a date. The text is still with its author.',
  REVEALED: 'The text is public and checked against the seal. The date did not change.',
  SEASONED: '90 days passed with nothing upheld against it, and the bond went back to its author.',
};

/** Whole days and hours between two chain times, for "sealed 19 days earlier". */
export function gap(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d >= 2) return `${d} days`;
  if (d === 1) return h ? `1 day ${h} h` : '1 day';
  if (h >= 1) return `${h} h`;
  const m = Math.floor(seconds / 60);
  return m >= 1 ? `${m} min` : `${seconds} s`;
}

/** Days left of the 90, from the browser's clock. */
export function seasoningLeft(seasonsAt: number, nowMs = Date.now()): string {
  const left = seasonsAt - Math.floor(nowMs / 1000);
  if (left <= 0) return 'complete';
  const d = Math.ceil(left / 86400);
  return d === 1 ? '1 day left' : `${d} days left`;
}
