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
import type { Contact, Project } from "../lib/data";
import { useEntityList, useEntityWrites } from "../lib/data";
import { idOf, PROJECT_STATUSES } from "../lib/fm";
import { useAccountOptions } from "./contacts";

const useContactOptions = (accountId: string) => {
	const contacts = useEntityList<Contact>("contacts");
	return useMemo(
		() =>
			(contacts.data ?? [])
				.filter(
					(c) =>
						!accountId || c.fieldData.AccountIDText === accountId,
				)
				.map((c) => ({ value: idOf(c.fieldData), label: c.fieldData.FullName }))
				.sort((a, b) => a.label.localeCompare(b.label)),
		[contacts.data, accountId],
	);
};

export const ProjectsListPage = () => {
	const projects = useEntityList<Project>("projects");
	const { nameOf } = useAccountOptions();
	const [q, setQ] = useState("");
	const rows = useMemo(() => {
		const all = projects.data ?? [];
		const needle = q.trim().toLowerCase();
		if (!needle) {
			return all;
		}
		return all.filter((r) =>
			[
				r.fieldData.Name,
				r.fieldData.Status,
				nameOf(r.fieldData.AccountIDText),
			]
				.join(" ")
				.toLowerCase()
				.includes(needle),
		);
	}, [projects.data, q, nameOf]);

	return (
		<main className="mx-auto w-full max-w-6xl px-6 py-8">
			<PageHeader
				actions={
					<Link to="/projects/new">
						<Button>+ New project</Button>
					</Link>
				}
				subtitle={`${projects.data?.length ?? 0} on file`}
				title="Projects"
			/>
			<div className="mb-4">
				<SearchBox onChange={setQ} placeholder="Search projects…" value={q} />
			</div>
			<Card>
				{projects.isLoading ? <LoadingState /> : null}
				{projects.isError ? <ErrorState error={projects.error} /> : null}
				{projects.isSuccess && rows.length === 0 ? (
					<EmptyState message="No projects match." />
				) : null}
				{rows.length > 0 ? (
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
								<th className="px-5 py-3">Project</th>
								<th className="px-5 py-3">Account</th>
								<th className="px-5 py-3">Start</th>
								<th className="px-5 py-3">Due</th>
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
											to="/projects/$recordId"
										>
											{r.fieldData.Name || "(unnamed)"}
										</Link>
									</td>
									<td className="px-5 py-3">
										{nameOf(r.fieldData.AccountIDText)}
									</td>
									<td className="px-5 py-3 tabular-nums">
										{r.fieldData.DateStart}
									</td>
									<td className="px-5 py-3 tabular-nums">
										{r.fieldData.DateDue}
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
	fk_Account_ID: "",
	fk_Contact_ID: "",
	Name: "",
	Description: "",
	Status: "Planned",
	DateStart: "",
	DateDue: "",
	DateEnd: "",
	Notes: "",
};

export const ProjectDetailPage = () => {
	const { recordId } = useParams({ strict: false }) as { recordId: string };
	const isNew = recordId === "new";
	const navigate = useNavigate();
	const projects = useEntityList<Project>("projects");
	const { options: accountOptions } = useAccountOptions();
	const { create, update, remove } = useEntityWrites("projects");

	const record = projects.data?.find((r) => r.recordId === recordId);
	const [draft, setDraft] = useState<Record<string, string> | null>(null);
	const form =
		draft ??
		(isNew
			? blank
			: record
				? {
						fk_Account_ID: record.fieldData.AccountIDText || "",
						fk_Contact_ID: record.fieldData.ContactIDText || "",
						Name: record.fieldData.Name,
						Description: record.fieldData.Description,
						Status: record.fieldData.Status,
						DateStart: record.fieldData.DateStart,
						DateDue: record.fieldData.DateDue,
						DateEnd: record.fieldData.DateEnd,
						Notes: record.fieldData.Notes,
					}
				: null);

	const contactOptions = useContactOptions(form?.fk_Account_ID ?? "");

	if (!isNew && projects.isLoading) {
		return <LoadingState />;
	}
	if (!(isNew || record)) {
		return <ErrorState error={new Error("Project not found.")} />;
	}
	const set = (k: string) => (v: string) =>
		setDraft({ ...(form ?? blank), [k]: v });

	const save = async () => {
		if (!form) {
			return;
		}
		if (isNew) {
			await create.mutateAsync(form);
			navigate({ to: "/projects" });
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
									if (window.confirm("Delete this project?")) {
										await remove.mutateAsync(record.recordId);
										navigate({ to: "/projects" });
									}
								}}
								variant="danger"
							>
								Delete
							</Button>
						) : null}
						<Link to="/projects">
							<Button variant="ghost">Back</Button>
						</Link>
						<Button
							disabled={create.isPending || update.isPending || !form?.Name}
							onClick={save}
						>
							{isNew ? "Create project" : "Save changes"}
						</Button>
					</>
				}
				subtitle={isNew ? "New project" : record?.fieldData.Name}
				title={isNew ? "New project" : "Project"}
			/>

			{form ? (
				<Card className="p-6">
					<div className="grid gap-4 sm:grid-cols-2">
						<Field label="Project name" span={2}>
							<TextInput onChange={set("Name")} value={form.Name} />
						</Field>
						<Field label="Account">
							<Select
								onChange={(v) =>
									setDraft({
										...(form ?? blank),
										fk_Account_ID: v,
										fk_Contact_ID: "",
									})
								}
								options={accountOptions}
								value={form.fk_Account_ID}
							/>
						</Field>
						<Field label="Primary contact">
							<Select
								onChange={set("fk_Contact_ID")}
								options={contactOptions}
								value={form.fk_Contact_ID}
							/>
						</Field>
						<Field label="Status">
							<Select
								allowEmpty={false}
								onChange={set("Status")}
								options={PROJECT_STATUSES}
								value={form.Status}
							/>
						</Field>
						<Field label="Start (MM/DD/YYYY)">
							<TextInput
								onChange={set("DateStart")}
								placeholder="06/12/2026"
								value={form.DateStart}
							/>
						</Field>
						<Field label="Due (MM/DD/YYYY)">
							<TextInput
								onChange={set("DateDue")}
								placeholder="07/01/2026"
								value={form.DateDue}
							/>
						</Field>
						<Field label="Finished (MM/DD/YYYY)">
							<TextInput
								onChange={set("DateEnd")}
								placeholder=""
								value={form.DateEnd}
							/>
						</Field>
						<Field label="Description" span={2}>
							<TextInput
								multiline
								onChange={set("Description")}
								value={form.Description}
							/>
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
