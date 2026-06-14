// Typed data layer over the typegen clients. All lists load whole tables
// (limit 1000) and filter client-side — right-sized for a small CRM, and it
// keeps FK joins purely on the client (the file has no relationship graph
// by design; the web layer joins on FK values).
import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	AccountsLayout,
	ContactsLayout,
	ProjectsLayout,
} from "../config/schemas/filemaker/client";
import type { BaseFields, FmRecord } from "./fm";

export type Account = BaseFields & {
	Name: string;
	Type: string;
	Status: string;
	Phone: string;
	Email: string;
	Website: string;
	City: string;
	Notes: string;
};

export type Contact = BaseFields & {
	fk_Account_ID: number | string;
	AccountIDText: string;
	NameFirst: string;
	NameLast: string;
	FullName: string;
	Title: string;
	Email: string;
	Phone: string;
	CellPhone: string;
	Status: string;
	Notes: string;
};

export type Project = BaseFields & {
	fk_Account_ID: number | string;
	fk_Contact_ID: number | string;
	AccountIDText: string;
	ContactIDText: string;
	Name: string;
	Description: string;
	Status: string;
	DateStart: string;
	DateDue: string;
	DateEnd: string;
	Notes: string;
};

type EntityKey = "accounts" | "contacts" | "projects";

// The generated clients share this surface (WebViewerAdapter underneath).
type LayoutClient = {
	list: (args: {
		limit: number;
	}) => Promise<{ data: FmRecord<Record<string, unknown>>[] }>;
	create: (args: {
		fieldData: Record<string, string>;
	}) => Promise<unknown>;
	update: (args: {
		recordId: string;
		fieldData: Record<string, string>;
	}) => Promise<unknown>;
	delete: (args: { recordId: string }) => Promise<unknown>;
};

const clients: Record<EntityKey, LayoutClient> = {
	accounts: AccountsLayout as unknown as LayoutClient,
	contacts: ContactsLayout as unknown as LayoutClient,
	projects: ProjectsLayout as unknown as LayoutClient,
};

export function useEntityList<T>(entity: EntityKey) {
	return useQuery({
		queryKey: [entity, "list"],
		queryFn: async () => {
			const res = await clients[entity].list({ limit: 1000 });
			return res.data as FmRecord<T>[];
		},
	});
}

// One mutation hook per verb; every write invalidates the entity list so
// related views refresh (the bridge is the source of truth, not our cache).
export function useEntityWrites(entity: EntityKey) {
	const qc = useQueryClient();
	const invalidate = () =>
		qc.invalidateQueries({ queryKey: [entity, "list"] });
	const create = useMutation({
		mutationFn: (fieldData: Record<string, string>) =>
			clients[entity].create({ fieldData }),
		onSettled: invalidate,
	});
	const update = useMutation({
		mutationFn: (args: {
			recordId: string;
			fieldData: Record<string, string>;
		}) => clients[entity].update(args),
		onSettled: invalidate,
	});
	const remove = useMutation({
		mutationFn: (recordId: string) => clients[entity].delete({ recordId }),
		onSettled: invalidate,
	});
	return { create, update, remove };
}
