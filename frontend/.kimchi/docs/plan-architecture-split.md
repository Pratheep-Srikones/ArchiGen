# Plan: Separate Saved & Temporary Architecture Views

## Goal
Split the current architecture detail page into two distinct routes:
1. **`/architecture/$projectId`** — for saved projects fetched from the backend by ID.
2. **`/result`** — temporary page shown immediately after AI generation, before saving.

The processing page should redirect to `/result` after generation. The user can optionally save from `/result`, which will later redirect to `/architecture/$projectId` once saved.

## Files & Changes

### 1. Extract `src/components/architect/ArchitectureView.tsx` (NEW)
Extract the display logic from the current `architecture.$projectId.tsx` into a shared presentational component.

**Interface:**
```tsx
interface ArchitectureViewProps {
  data: ArchitectureOutput;
  onSave?: () => void;
  onGenerateDiagram?: () => void;
  isTemporary?: boolean; // controls whether "Save Project" vs "Share" is shown
  isLoading?: boolean;
}
```

**Contents moved from architecture.$projectId.tsx:**
- Project header with title + requirements
- Section tabs (macro, micro, stack, diagram, repo) + IntersectionObserver scroll tracking
- All 5 content sections
- Extra diagrams state + modal integration
- `TechCard`, `FileTreeNode`, `DiagramModal` sub-components

**What stays OUT of ArchitectureView:**
- Route definition
- Data fetching logic
- NavigationBar wrapper
- `useLocation` / `useParams` calls

### 2. Create `src/routes/result.tsx` (NEW)
Route: `/result` — temporary post-generation page.

**Data source:** Reads `location.state.architecture` (passed from `/processing`).

**Auth guard:** Same pattern as dashboard: show `CheckingAuthentication` while loading, redirect-state if not authenticated.

**UI:**
- Wraps `ArchitectureView` with `isTemporary={true}`
- In the header actions area: prominent **"Save Project"** button (primary) instead of "Share".
- Below the header: a subtle banner ribbon: `This is a generated preview. Save it to your workspace to keep it.`
- `onSave`: Toast via `sonner` (already a dependency) saying "Project saved" then navigate to `/architecture/$projectId` with the project ID.
- `onGenerateDiagram`: same modal flow as current.

**Meta:** Title "Generated Architecture — ArchitectAI"

### 3. Update `src/routes/processing.tsx`
**Change redirect target:**
```tsx
// OLD:
navigate({
  to: "/architecture/$projectId",
  params: { projectId },
  state: navState as Record<string, unknown>,
});

// NEW:
navigate({
  to: "/result",
  state: navState as Record<string, unknown>,
});
```

Remove `projectId` generation logic (not needed for `/result`).

### 4. Update `src/routes/architecture.$projectId.tsx`
**Data fetching pattern:** Use `useQuery` from `@tanstack/react-query` (already in project) with a placeholder query function:
```tsx
function useProjectQuery(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      // TODO: replace with real backend fetch when API is ready
      // const res = await axiosInstance.get(`/projects/${projectId}`);
      // return res.data;
      return MOCK_ARCHITECTURE;
    },
  });
}
```

**UI:**
- Uses `ArchitectureView` with `isTemporary={false}`
- Shows loading state while query is pending
- Header actions: "Share" and secondary actions (no "Save" — already saved)
- Remove all location.state fallback logic

### 5. Update `src/routeTree.gen.ts`
Add `/result` route imports, types, and children entries (same pattern as other routes).

### 6. Update `src/components/architect/NavigationBar.tsx` (if needed)
No changes needed; `/result` uses `showNewButton={true}` same as other pages.

## Acceptance Criteria
- [ ] `/result` route exists and renders the generated architecture from processing
- [ ] `/result` shows a "Save Project" CTA and a temporary-preview banner
- [ ] `/processing` redirects to `/result` instead of `/architecture/$projectId`
- [ ] `/architecture/$projectId` uses React Query placeholder to fetch by ID
- [ ] `/architecture/$projectId` no longer relies on `location.state` from processing
- [ ] Shared `ArchitectureView` component renders correctly in both routes
- [ ] Build compiles without errors

## Complexity
**Simple** — It's mostly moving existing code into a shared component and wiring two route files. No concurrency or state machines.
