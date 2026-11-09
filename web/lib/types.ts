/** What the contract's views answer. Money is a decimal string of wei; times are chain seconds. */

export type Label = 'SUBSTANTIAL' | 'PARTIAL' | 'NONE';
export type Verdict = 'PRIOR' | 'RELATED' | 'CLEARED' | 'VOID';
export type State = 'SEALED' | 'REVEALED' | 'SEASONED';

export type Totals = { entries: number; challenges: number; received: string; bonds_left: string; stakes_held: string; owed: string; paid: string };
export type NotFound = { found: false; totals: Totals };

export type Entry = {
  found: true;
  id: number;
  author: string;
  seal: string;
  bond: string;
  bond_left: string;
  sealed_at: number;
  seasons_at: number;
  state: State;
  revealed: boolean;
  revealed_at: number;
  text: string;
  salt: string;
  closed_at: number;
  closed_by: string;
  overlaps: number;
  related: number;
  cleared: number;
  open_challenges: number;
  challenges: number;
  totals: Totals;
};
export type EntryRow = Omit<Entry, 'found' | 'totals'>;

export type Challenge = {
  found: true;
  id: number;
  a: EntryRow;
  b: EntryRow;
  seconds_between: number;
  challenger: string;
  accused: string;
  stake: string;
  winnable: boolean;
  label: Label | '';
  verdict: Verdict | '';
  to_challenger: string;
  bonus: string;
  to_accused: string;
  created_at: number;
  judge_deadline: number;
  resolved_at: number;
  resolved_by: string;
  totals: Totals;
};

export type Listing = { found: boolean; account: string; offset: number; total: number; items: EntryRow[]; balance?: string; earned?: string; withdrawn?: string; totals: Totals };
export type Marks = { found: boolean; entry_id: number; overlaps: number; related: number; cleared: number; marks: { id: number; a_id: number; b_id: number; role: 'earlier' | 'later'; label: string; verdict: string; created_at: number }[]; totals: Totals };
