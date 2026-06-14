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
import type { Account, Contact } from "../lib/data";
import { useEntityList, useEntityWrites } from "../lib/data";
import { ACTIVE_STATUSES, idOf } from "../lib/fm";

export const useAccountOptions = () => {
	const accounts = useEntityList<Account>("accounts");
	const options = useMemo(
		() =>
			(accounts.data ?? [])
				.map((r) => ({ value: idOf(r.fieldData), label: r.fieldData.Name }))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[accounts.data],
	);
	const nameOf = useMemo(() => {
		const m = new Map(options.map((o) => [o.value, o.label]));
		return (accountIdText: string) => m.get(accountIdText) ?? "";
	}, [options]);
	return { options, nameOf };
};

export const ContactsListPage = () => {
	const contacts = useEntityList<Contact>("contacts");
	const { nameOf } = useAccountOptions();
	const [q, setQ] = useState("");
	const rows = useMemo(() => {
		const all = contacts.data ?? [];
		const needle = q.trim().toLowerCase();
		if (!needle) {
			return all;
		}
		return all.filter((r) =>
			[
				r.fieldData.FullName,
				r.fieldData.Title,
				r.fieldData.Email,
				nameOf(r.fieldData.AccountIDText),
			]
				.join(" ")
				.toLowerCase()
				.includes(needle),
		);
	}, [contacts.data, q, nameOf]);

	return (
		<main className="mx-auto w-full max-w-6xl px-6 py-8">
			<PageHeader
				actions={
					<Link to="/contacts/new">
						<Button>+ New contact</Button>
					</Link>
				}
				subtitle={`${contacts.data?.length ?? 0} on file`}
				title="Contacts"
			/>
			<div className="mb-4">
				<SearchBox onChange={setQ} placeholder="Search contacts…" value={q} />
			</div>
			<Card>
				{contacts.isLoading ? <LoadingState /> : null}
				{contacts.isError ? <ErrorState error={contacts.error} /> : null}
				{contacts.isSuccess && rows.length === 0 ? (
					<EmptyState message="No contacts match." />
				) : null}
				{rows.length > 0 ? (
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
								<th className="px-5 py-3">Name</th>
								<th className="px-5 py-3">Account</th>
								<th className="px-5 py-3">Title</th>
								<th className="px-5 py-3">Email</th>
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
											to="/contacts/$recordId"
										>
											{r.fieldData.FullName || "(unnamed)"}
										</Link>
									</td>
									<td className="px-5 py-3">
										{nameOf(r.fieldData.AccountIDText)}
									</td>
									<td className="px-5 py-3">{r.fieldData.Title}</td>
									<td className="px-5 py-3">{r.fieldData.Email}</td>
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
	fk_Account_ID: "",
	NameFirst: "",
	NameLast: "",
	Title: "",
	Email: "",
	Phone: "",
	CellPhone: "",
	Status: "Active",
	Notes: "",
};

export const ContactDetailPage = () => {
	const { recordId } = useParams({ strict: false }) as { recordId: string };
	const isNew = recordId === "new";
	const navigate = useNavigate();
	const contacts = useEntityList<Contact>("contacts");
	const { options } = useAccountOptions();
	const { create, update, remove } = useEntityWrites("contacts");

	const record = contacts.data?.find((r) => r.recordId === recordId);
	const [draft, setDraft] = useState<Record<string, string> | null>(null);
	const form =
		draft ??
		(isNew
			? blank
			: record
				? {
						fk_Account_ID: record.fieldData.AccountIDText || "",
						NameFirst: record.fieldData.NameFirst,
						NameLast: record.fieldData.NameLast,
						Title: record.fieldData.Title,
						Email: record.fieldData.Email,
						Phone: record.fieldData.Phone,
						CellPhone: record.fieldData.CellPhone,
						Status: record.fieldData.Status,
						Notes: record.fieldData.Notes,
					}
				: null);

	if (!isNew && contacts.isLoading) {
		return <LoadingState />;
	}
	if (!(isNew || record)) {
		return <ErrorState error={new Error("Contact not found.")} />;
	}
	const set = (k: string) => (v: string) =>
		setDraft({ ...(form ?? blank), [k]: v });

	const save = async () => {
		if (!form) {
			return;
		}
		// FullName is a stored calc — never write it.
		if (isNew) {
			await create.mutateAsync(form);
			navigate({ to: "/contacts" });
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
									if (window.confirm("Delete this contact?")) {
										await remove.mutateAsync(record.recordId);
										navigate({ to: "/contacts" });
									}
								}}
								variant="danger"
							>
								Delete
							</Button>
						) : null}
						<Link to="/contacts">
							<Button variant="ghost">Back</Button>
						</Link>
						<Button
							disabled={
								create.isPending ||
								update.isPending ||
								!(form?.NameFirst || form?.NameLast)
							}
							onClick={save}
						>
							{isNew ? "Create contact" : "Save changes"}
						</Button>
					</>
				}
				subtitle={isNew ? "New contact" : record?.fieldData.FullName}
				title={isNew ? "New contact" : "Contact"}
			/>

			{form ? (
				<Card className="p-6">
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="First name">
							<TextInput onChange={set("NameFirst")} value={form.NameFirst} />
						</Field>
						<Field label="Last name">
							<TextInput onChange={set("NameLast")} value={form.NameLast} />
						</Field>
						<Field label="Account" span={2}>
							<Select
								onChange={set("fk_Account_ID")}
								options={options}
								value={form.fk_Account_ID}
							/>
						</Field>
						<Field label="Title">
							<TextInput onChange={set("Title")} value={form.Title} />
						</Field>
						<Field label="Status">
							<Select
								allowEmpty={false}
								onChange={set("Status")}
								options={ACTIVE_STATUSES}
								value={form.Status}
							/>
						</Field>
						<Field label="Email">
							<TextInput onChange={set("Email")} value={form.Email} />
						</Field>
						<Field label="Phone">
							<TextInput onChange={set("Phone")} value={form.Phone} />
						</Field>
						<Field label="Cell phone">
							<TextInput onChange={set("CellPhone")} value={form.CellPhone} />
						</Field>
						<Field label="Notes" span={2}>
							<TextInput multiline onChange={set("Notes")} value={form.Notes} />
						</Field>
					</div>
				</Card>
			) : null}
		</main>
	);
};
