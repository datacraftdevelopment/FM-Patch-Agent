import { globalSettings } from "@proofkit/webviewer";
import { Link } from "@tanstack/react-router";
import { Briefcase, Building2, Users } from "lucide-react";
import { Badge, Card, EmptyState, LoadingState } from "./components/ui";
import type { Account, Contact, Project } from "./lib/data";
import { useEntityList } from "./lib/data";
import { useAccountOptions } from "./routes/contacts";

// Must match the web viewer object name in the FileMaker layout (ProofKit
// add-on default is "web").
globalSettings.setWebViewerName("web");

const StatCard = ({
	icon: Icon,
	label,
	count,
	to,
}: {
	icon: typeof Building2;
	label: string;
	count: number | undefined;
	to: string;
}) => (
	<Link to={to}>
		<Card className="p-6 transition-colors hover:bg-muted/40">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="mt-1 text-3xl font-semibold tabular-nums">
						{count ?? "–"}
					</p>
				</div>
				<Icon className="h-8 w-8 text-primary/70" />
			</div>
		</Card>
	</Link>
);

export default function App() {
	const accounts = useEntityList<Account>("accounts");
	const contacts = useEntityList<Contact>("contacts");
	const projects = useEntityList<Project>("projects");
	const { nameOf } = useAccountOptions();

	const open = (projects.data ?? []).filter(
		(p) => p.fieldData.Status !== "Closed",
	);

	return (
		<main className="mx-auto w-full max-w-6xl px-6 py-8">
			<div className="mb-8">
				<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
					Example CRM
				</p>
				<h1 className="mt-1 text-3xl font-semibold tracking-tight">
					Good to see you.
				</h1>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					count={accounts.data?.length}
					icon={Building2}
					label="Accounts"
					to="/accounts"
				/>
				<StatCard
					count={contacts.data?.length}
					icon={Users}
					label="Contacts"
					to="/contacts"
				/>
				<StatCard
					count={projects.data?.length}
					icon={Briefcase}
					label="Projects"
					to="/projects"
				/>
			</div>

			<Card className="mt-8">
				<div className="border-b border-border px-5 py-3">
					<h2 className="text-sm font-semibold">
						Open projects ({open.length})
					</h2>
				</div>
				{projects.isLoading ? <LoadingState /> : null}
				{projects.isSuccess && open.length === 0 ? (
					<EmptyState message="Nothing in flight. Create a project to get started." />
				) : null}
				{open.length > 0 ? (
					<ul className="divide-y divide-border/60">
						{open.map((p) => (
							<li key={p.recordId}>
								<Link
									className="flex items-center justify-between gap-4 px-5 py-3 text-sm hover:bg-muted/50"
									params={{ recordId: p.recordId }}
									to="/projects/$recordId"
								>
									<div className="min-w-0">
										<p className="truncate font-medium">{p.fieldData.Name}</p>
										<p className="truncate text-muted-foreground">
											{nameOf(p.fieldData.AccountIDText)}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-3">
										<span className="text-xs text-muted-foreground tabular-nums">
											due {p.fieldData.DateDue || "—"}
										</span>
										<Badge value={p.fieldData.Status} />
									</div>
								</Link>
							</li>
						))}
					</ul>
				) : null}
			</Card>
		</main>
	);
}
