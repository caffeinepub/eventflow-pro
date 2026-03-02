# EventFlow Pro

## Current State

Full-stack event management app with:
- Motoko backend with authorization component (MixinAuthorization + AccessControl)
- All backend endpoints require `isTeamMember` or `isAdminOrManager` checks via caller role
- React frontend with Internet Identity (`useInternetIdentity`), `useActor`, TanStack Query
- Pages: Dashboard, Calendar, Events, Clients, Team
- Layout has a login/logout button but app renders fully to anonymous users
- `useActor` creates an anonymous actor when not authenticated — all backend queries fire for anonymous callers, which causes backend traps on every query (unauthorized), leading to broken listings, failed adds, etc.
- Client listing/adding fails because `getAllClients` and `createClient` trap on anonymous callers
- No auth gate: unauthenticated users can see all pages but every data fetch fails silently or with errors

## Requested Changes (Diff)

### Add
- Auth gate: a full-page login screen (InternetIdentity) shown to unauthenticated users instead of the app
- After login, auto-register user with `saveCallerUserProfile` so they pass `isTeamMember` checks
- Loading state while identity is initializing (spinner/splash before routing)
- `useIsAuthenticated` helper that combines `identity` presence and `loginStatus !== "initializing"`

### Modify
- `App.tsx`: wrap routes in an `AuthGate` component that redirects/replaces content with login screen when not authenticated
- `useActor`: skip anonymous actor creation entirely — return `null` actor when unauthenticated so queries don't fire with anonymous principal (which would get rejected by backend)
- All `useQuery` hooks already have `enabled: !!actor && !isFetching` — this already suppresses queries, but actor is created anonymously and some hooks still trigger. Ensuring actor is `null` when unauthenticated makes this reliable.
- `Layout.tsx`: improve login/logout UX — show user principal/name in sidebar, prominent login prompt when not signed in
- Client page: fix form state reset on open (currently `useState` initial value is computed once, so editing a client then opening "New Client" shows stale data) — reset form fields in `useEffect` when `open` or `client` changes

### Remove
- Anonymous actor creation path in `useActor` (return null instead)

## Implementation Plan

1. **`useActor.ts`**: When `identity` is undefined/anonymous, return `{ actor: null, isFetching }` — do NOT create an anonymous actor. This prevents all queries from firing unauthenticated.

2. **`AuthGate` component**: New component in `components/AuthGate.tsx`. Reads `loginStatus` and `identity` from `useInternetIdentity`. Shows:
   - Spinner/splash while `loginStatus === "initializing"`  
   - Full-page branded login screen with "Sign In with Internet Identity" button when not authenticated
   - `children` when authenticated

3. **Auto-register on first login**: In `AuthGate` (or a hook), after identity is confirmed, call `saveCallerUserProfile` with a default profile (name derived from principal, role: member, isActive: true) if `getCallerUserProfile` returns null. This ensures the user passes `isTeamMember` backend checks.

4. **`App.tsx`**: Wrap `<Layout><Outlet/></Layout>` inside `<AuthGate>`.

5. **`ClientsPage.tsx`**: Fix `ClientForm` state — replace `useState` initial value with `useEffect` to sync form when `client` prop or `open` changes. This ensures "New Client" form is always blank and "Edit Client" always shows current values.

6. **`Layout.tsx`**: Minor improvements — while auth is initializing show a subtle loading indicator, ensure user display name and role show correctly post-login.
