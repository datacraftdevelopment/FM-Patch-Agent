import type { QueryClient } from "@tanstack/react-query";
import {
	createHashHistory,
	createRootRouteWithContext,
	createRoute,
	createRouter,
	Link,
	Outlet,
} from "@tanstack/react-router";

import App from "./app";
import { AccountDetailPage, AccountsListPage } from "./routes/accounts";
import { ContactDetailPage, ContactsListPage } from "./routes/contacts";
import { ProjectDetailPage, ProjectsListPage } from "./routes/projects";

const navLink =
	"[&.active]:text-primary [&.active]:bg-muted rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

const RootLayout = () => (
	<div className="min-h-screen bg-background text-foreground">
		<header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
			<nav className="mx-auto flex w-full max-w-6xl items-center gap-1 px-6 py-2.5">
				<Link className="mr-4 text-sm font-semibold tracking-tight" to="/">
					CRM
				</Link>
				<Link className={navLink} to="/accounts">
					Accounts
				</Link>
				<Link className={navLink} to="/contacts">
					Contacts
				</Link>
				<Link className={navLink} to="/projects">
					Projects
				</Link>
			</nav>
		</header>
		<Outlet />
	</div>
);

type RouterContext = {
	queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

// Paths must stay literal (no helper indirection) so TanStack Router can
// infer the typed route tree for <Link>/useParams.
const routeTree = rootRoute.addChildren([
	createRoute({ component: App, getParentRoute: () => rootRoute, path: "/" }),
	createRoute({
		component: AccountsListPage,
		getParentRoute: () => rootRoute,
		path: "/accounts",
	}),
	createRoute({
		component: AccountDetailPage,
		getParentRoute: () => rootRoute,
		path: "/accounts/$recordId",
	}),
	createRoute({
		component: ContactsListPage,
		getParentRoute: () => rootRoute,
		path: "/contacts",
	}),
	createRoute({
		component: ContactDetailPage,
		getParentRoute: () => rootRoute,
		path: "/contacts/$recordId",
	}),
	createRoute({
		component: ProjectsListPage,
		getParentRoute: () => rootRoute,
		path: "/projects",
	}),
	createRoute({
		component: ProjectDetailPage,
		getParentRoute: () => rootRoute,
		path: "/projects/$recordId",
	}),
]);

export const createAppRouter = async (queryClient: QueryClient) =>
	createRouter({
		context: { queryClient },
		history: createHashHistory(),
		routeTree,
	});

declare module "@tanstack/react-router" {
	interface Register {
		router: Awaited<ReturnType<typeof createAppRouter>>;
	}
}
