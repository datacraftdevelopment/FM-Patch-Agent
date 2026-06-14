// FileMaker data helpers — conventions from the ProofKit webviewer playbook.

// Data API record envelope (list/get return these in res.data).
export type FmRecord<T> = {
	recordId: string;
	modId: string;
	fieldData: T;
};

// BASE-7 audit core present on every scaffolded table, plus IDText.
export type BaseFields = {
	ID: number | string;
	IDText: string;
	RecordID: string;
	kTrue: number;
	CreationTimestamp: string;
	CreationAccount: string;
	ModifyTimestamp: string;
	ModifyAccount: string;
};

// IDs are Get(UUIDNumber) — 57 digits. The Data API serializes raw number
// fields in scientific notation (~14 significant digits), so the app NEVER
// reads ID/fk_* number fields directly: it uses the GetAsText calc twins
// (IDText / AccountIDText / ContactIDText), which arrive exact. FK writes
// send the exact string; FileMaker stores the full-precision number.
export const idOf = (fieldData: { IDText: string }): string =>
	fieldData.IDText ?? "";

// Data API writes parse dates as MM/DD/YYYY — ISO fails silently.
export const formatFmDate = (d: Date): string => {
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${mm}/${dd}/${d.getFullYear()}`;
};

export const ACCOUNT_TYPES = ["Customer", "Vendor", "Partner"] as const;
export const ACTIVE_STATUSES = ["Active", "Inactive"] as const;
export const PROJECT_STATUSES = [
	"Planned",
	"Active",
	"On Hold",
	"Closed",
] as const;

const STATUS_TONES: Record<string, string> = {
	Active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
	Planned: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
	"On Hold": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
	Closed: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
	Inactive: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
	Customer: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
	Vendor: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
	Partner: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
};

export const statusTone = (value: string): string =>
	STATUS_TONES[value] ?? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
