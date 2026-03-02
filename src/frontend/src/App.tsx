import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AuthGate from "./components/AuthGate";
import Layout from "./components/Layout";
import CalendarPage from "./pages/CalendarPage";
import ClientsPage from "./pages/ClientsPage";
import Dashboard from "./pages/Dashboard";
import EventsPage from "./pages/EventsPage";
import TeamPage from "./pages/TeamPage";

// ─── Root Route ──────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster richColors position="top-right" />
      <AuthGate>
        <Layout>
          <Outlet />
        </Layout>
      </AuthGate>
    </>
  ),
});

// ─── Page Routes ─────────────────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: CalendarPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/events",
  component: EventsPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients",
  component: ClientsPage,
});

const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/team",
  component: TeamPage,
});

// ─── Router ──────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  calendarRoute,
  eventsRoute,
  clientsRoute,
  teamRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
