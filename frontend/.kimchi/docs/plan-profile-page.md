# Plan: User Profile Page

## Goal

Implement a `/profile` route that is only accessible to authenticated users, displaying their account details.

## Files

### 1. Create `src/routes/profile.tsx`

- Route: `/profile`
- Auth guard: check `loading` → show `<CheckingAuthentication />`, check `!isAuthenticated` → show `<Loading fullScreen label="Redirecting…" />`
- Display user info from `useAuthStore`: `picture`, `username`, `fullName`, `id`
- Layout: `min-h-screen bg-cream`, `<NavigationBar showNewButton={true} />`, centered content card
- Styling: same Tailwind classes used across existing pages (`text-display`, `text-card-title`, `text-body-lg`, `text-caption`, `text-muted`, `text-charcoal`, rounded cards with `border-border-passive`)
- Include `head` meta for title/description

### 2. Update `src/routeTree.gen.ts`

- Import `ProfileRouteImport` from `./routes/profile.tsx`
- Add `ProfileRoute` constant
- Add `/profile` to `FileRoutesByFullPath`, `FileRoutesByTo`, `FileRoutesById`, `FileRouteTypes`
- Add to `RootRouteChildren`
- Add `FileRoutesByPath` entry in module augmentation

### 3. Update `src/components/architect/NavigationBar.tsx`

- Wrap the account picture/avatar button in a `<Link to="/profile">` so authenticated users can navigate to their profile

## Acceptance Criteria

- [ ] `src/routes/profile.tsx` exists and compiles without errors
- [ ] `src/routeTree.gen.ts` includes `/profile` and resolves correctly
- [ ] NavigationBar account avatar navigates to `/profile`
- [ ] Unauthenticated users see a loading redirect state on `/profile`
- [ ] Authenticated users see their username, full name, and avatar on `/profile`

## Complexity

Simple — one page, standard CRUD-like display, no concurrency.
