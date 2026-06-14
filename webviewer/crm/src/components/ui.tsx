// Small handcrafted primitives on the scaffold's Tailwind/shadcn tokens —
// keeps the single-file build lean (no extra component deps).
import type { ReactNode } from "react";
import { statusTone } from "../lib/fm";

export const Badge = ({ value }: { value: string }) =>
	value ? (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(value)}`}
		>
			{value}
		</span>
	) : null;

export const Button = ({
	children,
	onClick,
	variant = "default",
	type = "button",
	disabled = false,
}: {
	children: ReactNode;
	onClick?: () => void;
	variant?: "default" | "outline" | "danger" | "ghost";
	type?: "button" | "submit";
	disabled?: boolean;
}) => {
	const tones = {
		default:
			"bg-primary text-primary-foreground hover:opacity-90 border-transparent",
		outline: "bg-card text-foreground border-border hover:bg-muted",
		danger:
			"bg-transparent text-red-600 border-transparent hover:bg-red-500/10",
		ghost: "bg-transparent text-muted-foreground border-transparent hover:bg-muted",
	} as const;
	return (
		<button
			className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${tones[variant]}`}
			disabled={disabled}
			onClick={onClick}
			type={type}
		>
			{children}
		</button>
	);
};

export const Field = ({
	label,
	children,
	span = 1,
}: {
	label: string;
	children: ReactNode;
	span?: 1 | 2;
}) => (
	<label className={`block ${span === 2 ? "sm:col-span-2" : ""}`}>
		<span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
			{label}
		</span>
		{children}
	</label>
);

const inputClass =
	"w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export const TextInput = ({
	value,
	onChange,
	placeholder,
	multiline = false,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	multiline?: boolean;
}) =>
	multiline ? (
		<textarea
			className={`${inputClass} min-h-20`}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			value={value}
		/>
	) : (
		<input
			className={inputClass}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			value={value}
		/>
	);

export const Select = ({
	value,
	onChange,
	options,
	allowEmpty = true,
}: {
	value: string;
	onChange: (v: string) => void;
	options: readonly { value: string; label: string }[] | readonly string[];
	allowEmpty?: boolean;
}) => (
	<select
		className={inputClass}
		onChange={(e) => onChange(e.target.value)}
		value={value}
	>
		{allowEmpty ? <option value="">—</option> : null}
		{options.map((o) => {
			const opt = typeof o === "string" ? { label: o, value: o } : o;
			return (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			);
		})}
	</select>
);

export const SearchBox = ({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) => (
	<input
		className={`${inputClass} max-w-xs`}
		onChange={(e) => onChange(e.target.value)}
		placeholder={placeholder}
		type="search"
		value={value}
	/>
);

export const PageHeader = ({
	title,
	subtitle,
	actions,
}: {
	title: string;
	subtitle?: string;
	actions?: ReactNode;
}) => (
	<div className="mb-6 flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
			{subtitle ? (
				<p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
			) : null}
		</div>
		<div className="flex items-center gap-2">{actions}</div>
	</div>
);

export const Card = ({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) => (
	<section
		className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}
	>
		{children}
	</section>
);

export const EmptyState = ({ message }: { message: string }) => (
	<div className="px-6 py-12 text-center text-sm text-muted-foreground">
		{message}
	</div>
);

export const LoadingState = () => (
	<div className="flex items-center justify-center px-6 py-12">
		<div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
	</div>
);

export const ErrorState = ({ error }: { error: unknown }) => (
	<div className="px-6 py-8 text-sm text-red-600">
		{error instanceof Error ? error.message : "Something went wrong."}
	</div>
);
