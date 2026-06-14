import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	Badge,
	Button,
	Card,
	EmptyState,
	ErrorState,
	Field,
	LoadingState,
	PageHeader,
	SearchBox,
	Select,
	TextInput,
} from "../components/ui";
import type { Account, Contact, Project } from "../lib/data";
import { useEntityList, useEntityWrites } from "../lib/data";
import { ACCOUNT_TYPES, ACTIVE_STATUSES, idOf } from "../lib/fm";

export const AccountsListPage = () => {
	const accounts = useEntityList<Account>("accounts");
	const [q, setQ] = useState("");
	const rows = useMemo(() => {
		const all = accounts.data ?? [];
		const needle = q.trim().toLowerCase();
		if (!needle) {
			return all;
		}
		return all.filter((r) =>
			[r.fieldData.Name, r.fieldData.City, r.fieldData.Email, r.fieldData.Type]
				.join(" ")
				.toLowerCase()
				.includes(needle),
		);
	}, [accounts.data, q]);

	return (
		<main className="mx-auto w-full max-w-6xl px-6 py-8">
			<PageHeader
				actions={
					<Link to="/accounts/new">
						<Button>+ New account</Button>
					</Link>
				}
				subtitle={`${accounts.data?.length ?? 0} on file`}
				title="Accounts"
			/>
			<div className="mb-4">
				<SearchBox onChange={setQ} placeholder="Search accounts…" value={q} />
			</div>
			<Card>
				{accounts.isLoading ? <LoadingState /> : null}
				{accounts.isError ? <ErrorState error={accounts.error} /> : null}
				{accounts.isSuccess && rows.length === 0 ? (
					<EmptyState message="No accounts match." />
				) : null}
				{rows.length > 0 ? (
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
								<th className="px-5 py-3">Name</th>
								<th className="px-5 py-3">Type</th>
								<th className="px-5 py-3">City</th>
								<th className="px-5 py-3">Phone</th>
								<th className="px-5 py-3">Status</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((r) => (
								<tr
									className="border-b border-border/60 last:border-0 hover:bg-muted/50"
									key={r.recordId}
								>
									<td className="px-5 py-3 font-medium">
										<Link
											className="hover:text-primary"
											params={{ recordId: r.recordId }}
											to="/accounts/$recordId"
										>
											{r.fieldData.Name || "(unnamed)"}
										</Link>
									</td>
									<td className="px-5 py-3">
										<Badge value={r.fieldData.Type} />
									</td>
									<td className="px-5 py-3">{r.fieldData.City}</td>
									<td className="px-5 py-3 tabular-nums">
										{r.fieldData.Phone}
									</td>
									<td className="px-5 py-3">
										<Badge value={r.fieldData.Status} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : null}
			</Card>
		</main>
	);
};

const blank = {
	Name: "",
	Type: "Customer",
	Status: "Active",
	Phone: "",
	Email: "",
	Website: "",
	City: "",
	Notes: "",
};

export const AccountDetailPage = () => {
	const { recordId } = useParams({ strict: false }) as { recordId: string };
	const isNew = recordId === "new";
	const navigate = useNavigate();
	const accounts = useEntityList<Account>("accounts");
	const contacts = useEntityList<Contact>("contacts");
	const projects = useEntityList<Project>("projects");
	const { create, update, remove } = useEntityWrites("accounts");

	const record = accounts.data?.find((r) => r.recordId === recordId);
	const [draft, setDraft] = useState<Record<string, string> | null>(null);
	const form =
		draft ??
		(isNew
			? blank
			: record
				? {
						Name: record.fieldData.Name,
						Type: record.fieldData.Type,
						Status: record.fieldData.Status,
						Phone: record.fieldData.Phone,
						Email: record.fieldData.Email,
						Website: record.fieldData.Website,
						City: record.fieldData.City,
						Notes: record.fieldData.Notes,
					}
				: null);

	if (!isNew && accounts.isLoading) {
		return <LoadingState />;
	}
	if (!(isNew || record)) {
		return <ErrorState error={new Error("Account not found.")} />;
	}
	const set = (k: string) => (v: string) =>
		setDraft({ ...(form ?? blank), [k]: v });

	const accountId = record ? idOf(record.fieldData) : "";
	const relContacts = (contacts.data ?? []).filter(
		(c) => accountId && c.fieldData.AccountIDText === accountId,
	);
	const relProjects = (projects.data ?? []).filter(
		(p) => accountId && p.fieldData.AccountIDText === accountId,
	);

	const save = async () => {
		if (!form) {
			return;
		}
		if (isNew) {
			await create.mutateAsync(form);
			navigate({ to: "/accounts" });
		} else if (record) {
			await update.mutateAsync({ recordId: record.recordId, fieldData: form });
			setDraft(null);
		}
	};

	return (
		<main className="mx-auto w-full max-w-6xl px-6 py-8">
			<PageHeader
				actions={
					<>
						{!isNew && record ? (
							<Button
								onClick={async () => {
									if (window.confirm("Delete this account?")) {
										await remove.mutateAsync(record.recordId);
										navigate({ to: "/accounts" });
									}
								}}
								variant="danger"
							>
								Delete
							</Button>
						) : null}
						<Link to="/accounts">
							<Button variant="ghost">Back</Button>
						</Link>
						<Button
							disabled={create.isPending || update.isPending || !form?.Name}
							onClick={save}
						>
							{isNew ? "Create account" : "Save changes"}
						</Button>
					</>
				}
				subtitle={isNew ? "New account" : record?.fieldData.Name}
				title={isNew ? "New account" : "Account"}
			/>

			{form ? (
				<Card className="p-6">
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Name">
							<TextInput onChange={set("Name")} value={form.Name} />
						</Field>
						<Field label="City">
							<TextInput onChange={set("City")} value={form.City} />
						</Field>
						<Field label="Type">
							<Select
								allowEmpty={false}
								onChange={set("Type")}
								options={ACCOUNT_TYPES}
								value={form.Type}
							/>
						</Field>
						<Field label="Status">
							<Select
								allowEmpty={false}
								onChange={set("Status")}
								options={ACTIVE_STATUSES}
								value={form.Status}
							/>
						</Field>
						<Field label="Phone">
							<TextInput onChange={set("Phone")} value={form.Phone} />
						</Field>
						<Field label="Email">
							<TextInput onChange={set("Email")} value={form.Email} />
						</Field>
						<Field label="Website" span={2}>
							<TextInput onChange={set("Website")} value={form.Website} />
						</Field>
						<Field label="Notes" span={2}>
							<TextInput multiline onChange={set("Notes")} value={form.Notes} />
						</Field>
					</div>
				</Card>
			) : null}

			{!isNew && record ? (
				<div className="mt-6 grid gap-6 lg:grid-cols-2">
					<Card>
						<div className="flex items-center justify-between border-b border-border px-5 py-3">
							<h2 className="text-sm font-semibold">
								Contacts ({relContacts.length})
							</h2>
							<Link to="/contacts/new">
								<Button variant="ghost">+ Add</Button>
							</Link>
						</div>
						{relContacts.length === 0 ? (
							<EmptyState message="No contacts at this account yet." />
						) : (
							<ul className="divide-y divide-border/60">
								{relContacts.map((c) => (
									<li key={c.recordId}>
										<Link
											className="flex items-center justify-between px-5 py-3 text-sm hover:bg-muted/50"
											params={{ recordId: c.recordId }}
											to="/contacts/$recordId"
										>
											<span className="font-medium">
												{c.fieldData.FullName}
											</span>
											<span className="text-muted-foreground">
												{c.fieldData.Title}
											</span>
										</Link>
									</li>
								))}
							</ul>
						)}
					</Card>
					<Card>
						<div className="flex items-center justify-between border-b border-border px-5 py-3">
							<h2 className="text-sm font-semibold">
								Projects ({relProjects.length})
							</h2>
							<Link to="/projects/new">
								<Button variant="ghost">+ Add</Button>
							</Link>
						</div>
						{relProjects.length === 0 ? (
							<EmptyState message="No projects for this account yet." />
						) : (
							<ul className="divide-y divide-border/60">
								{relProjects.map((p) => (
									<li key={p.recordId}>
										<Link
											className="flex items-center justify-between px-5 py-3 text-sm hover:bg-muted/50"
											params={{ recordId: p.recordId }}
											to="/projects/$recordId"
										>
											<span className="font-medium">{p.fieldData.Name}</span>
											<Badge value={p.fieldData.Status} />
										</Link>
									</li>
								))}
							</ul>
						)}
					</Card>
				</div>
			) : null}
		</main>
	);
};
