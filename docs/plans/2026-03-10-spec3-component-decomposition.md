# Spec 3: Component Decomposition — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break apart 8 oversized components into focused sub-components and custom hooks, each under 300 lines.

**Architecture:** For each oversized component: (1) extract state + handlers into a custom hook, (2) extract rendering sections into sub-components, (3) the parent becomes a thin orchestrator that calls the hook and renders sub-components. Files live alongside their parent in the same directory.

**Tech Stack:** TypeScript, React, Vitest, React Testing Library

**Repo:** `/Users/timlife/Documents/claude code/copy-of-gtm-os`
**Important:** No `src/` directory — files are at root level.

**Principles:**
- Each extracted file must be under 300 lines
- Hooks own state + handlers. Components own rendering.
- Props interfaces are explicit — no spreading parent state as `...rest`
- Sub-components live in the same directory as their parent
- No behavior changes — this is purely structural

---

## File Structure

### BootcampApp decomposition (988 → ~250 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `hooks/useBootcampAuth.ts` | Create | `user`, `bootcampStudent`, `showRegister`, login/register/logout/studentUpdate handlers |
| `hooks/useBootcampCurriculum.ts` | Create | `courseData`, `currentLesson`, `loading`, `loadError`, curriculum loading + progress initialization |
| `hooks/useBootcampProgress.ts` | Create | `completedItems`, `proofOfWork`, `taskNotes`, `submittedWeeks`, save handlers |
| `hooks/useBootcampOnboarding.ts` | Create | `onboardingStep`, `completedOnboardingSteps`, `surveyData`, mutations |
| `components/bootcamp/VirtualLessonRouter.tsx` | Create | Routes virtual page IDs to their components |
| `pages/bootcamp/BootcampApp.tsx` | Modify | Thin orchestrator: gates → layout → router. Retains 8 UI-only useState (`mobileMenuOpen`, `isDarkMode`, `showSubscriptionModal`, `dismissedBanner`, `showSettingsModal`, `showRedeemModal`, `commandPaletteOpen`, `showDashboard`) + 5 existing hooks. |

### DfyEngagementDetail decomposition (2,682 → ~280 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `hooks/useDfyEngagementData.ts` | Create | All 10 mutations + 6 queries + refreshAll + milestoneGroups memo |
| `components/admin/dfy/DfyOverviewCard.tsx` | Create | Client details grid (email, rate, dates, links) |
| `components/admin/dfy/DfyActivityPanel.tsx` | Create | Activity log + post update form |
| `components/admin/dfy/DfyDeliverablesPanel.tsx` | Create | Milestone-grouped deliverables list |
| `components/admin/dfy/panels/ContentCallPrepPanel.tsx` | Create | Content call prep tab (move from inline) |
| `components/admin/dfy/panels/ProfileRewriteReviewPanel.tsx` | Create | Profile rewrite tab (move from inline) |
| `components/admin/dfy/panels/OnboardingChecklistSection.tsx` | Create | Onboarding checklist (move from inline) |
| `components/admin/dfy/panels/CallTranscriptSection.tsx` | Create | Call transcript editor (move from inline) |
| `components/admin/dfy/panels/ResourceFilesSection.tsx` | Create | File upload section + formatFileSize + file constants (move from inline) |
| `components/admin/dfy/panels/IntakeFormSection.tsx` | Create | Intake form display + IntakeFileRow (move from inline) |
| `components/admin/dfy/shared/InfoPair.tsx` | Create | Key-value display (move from inline) |
| `components/admin/dfy/shared/ActionButtons.tsx` | Create | Action button bar (move from inline) |
| `components/admin/dfy/shared/DeliverableRow.tsx` | Create | Single deliverable row (move from inline) |
| `components/admin/dfy/shared/MilestoneSection.tsx` | Create | Milestone accordion (move from inline) |
| `components/admin/dfy/shared/ActivityRow.tsx` | Create | Single activity entry (move from inline) |
| `components/admin/dfy/shared/AutomationStatusBadge.tsx` | Create | Status badge (move from inline) |
| `components/admin/dfy/shared/AutomationHistoryPanel.tsx` | Create | Automation history accordion (move from inline) |
| `components/admin/dfy/shared/DeleteConfirmationModal.tsx` | Create | Delete confirmation dialog (move from inline JSX) |
| `lib/formatCurrency.ts` | Create | `formatCurrency` utility (move from inline) |
| `components/admin/dfy/DfyEngagementDetail.tsx` | Modify | Thin orchestrator: hook + tabs + sub-components |

### DfyTemplateEditor decomposition (1,387 → ~250 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `hooks/useDfyTemplateEditor.ts` | Create | All 8 useState + milestone/deliverable helpers + save mutation + 2 useMemo |
| `components/admin/dfy/template/constants.ts` | Create | CATEGORIES, AUTOMATION_TYPES, CATEGORY_COLORS, PRIORITY_COLORS, TEMPLATE_OPTIONS, DEFAULT_MILESTONE, DEFAULT_DELIVERABLE, DEFAULT_TEMPLATE |
| `components/admin/dfy/template/MilestonesEditor.tsx` | Create | Milestones accordion list |
| `components/admin/dfy/template/DeliverableRow.tsx` | Create | Collapsed deliverable row (~140 lines) |
| `components/admin/dfy/template/DeliverableEditForm.tsx` | Create | Expanded edit form (~280 lines) |
| `components/admin/dfy/DfyTemplateEditor.tsx` | Modify | Orchestrator: header + tabs + sub-components. Passes `isDarkMode`-derived style classes as props to sub-components. |

### AdminProposalEdit decomposition (1,050 → ~200 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `hooks/useProposalForm.ts` | Create | FormState type + proposalToForm mapper + form state + all 20 helpers (field updates, save/publish/archive/copyUrl) + query/mutation. Include `toSnakeCase` utility and `StatusBadge` sub-component. |
| `components/admin/proposals/sections/ProposalClientInfo.tsx` | Create | Client info + snapshot fields |
| `components/admin/proposals/sections/ProposalServicesSection.tsx` | Create | Dynamic services list |
| `components/admin/proposals/sections/ProposalRoadmapSection.tsx` | Create | Dynamic roadmap phases |
| `components/admin/proposals/sections/ProposalPricingSection.tsx` | Create | Packages, custom items, totals |
| `components/admin/proposals/AdminProposalEdit.tsx` | Modify | Orchestrator |

### BlueprintLandingPage decomposition (1,097 → ~200 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `hooks/useBlueprintForm.ts` | Create | Submission logic, session restore, logos fetch |
| `components/blueprint/BlueprintQuestionnaire.tsx` | Create | Multi-step wizard (move from inline) |
| `components/blueprint/landing/NavBar.tsx` | Create | Navigation bar (move from inline) |
| `components/blueprint/landing/Hero.tsx` | Create | Hero section with email opt-in |
| `components/blueprint/landing/HowItWorks.tsx` | Create | How it works section |
| `components/blueprint/landing/Footer.tsx` | Create | Footer (move from inline) |
| `components/blueprint/BlueprintLandingPage.tsx` | Modify | Orchestrator |

### EmailEnrichmentPage decomposition (777 → ~150 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `hooks/useEnrichmentPageState.ts` | Create | All 11 useState + callbacks |
| `lib/csv-parser.ts` | Create | `parseRow`, `parseCsv` pure functions |
| `components/bootcamp/email-enrichment/EnrichmentUploadStep.tsx` | Create | Step 1: drag-drop zone |
| `components/bootcamp/email-enrichment/EnrichmentMapStep.tsx` | Create | Step 2: column mapping |
| `components/bootcamp/email-enrichment/EnrichmentProcessingStep.tsx` | Create | Step 3: progress bar + live stats |
| `components/bootcamp/email-enrichment/EnrichmentResultsStep.tsx` | Create | Step 4: results table |
| `components/bootcamp/email-enrichment/EmailEnrichmentPage.tsx` | Modify | Step router orchestrator |

### LmsContentItemModal decomposition (752 → ~250 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `hooks/useContentItemForm.ts` | Create | formData state + URL handlers + submit logic |
| `components/admin/lms/curriculum/TextContentEditor.tsx` | Create | Markdown editor + preview (move from inline) |
| `components/admin/lms/curriculum/CredentialsFields.tsx` | Create | Credentials form fields (componentize from render block) |
| `components/admin/lms/curriculum/LmsContentItemModal.tsx` | Modify | Modal shell + content type selector |

### LessonView decomposition (736 → ~200 lines)
| File | Action | Responsibility |
|------|--------|---------------|
| `lib/markdown-utils.ts` | Create | `preprocessTextContent` pure function |
| `components/bootcamp/LessonContentRenderer.tsx` | Create | Content type switch (9 branches) |
| `components/bootcamp/ChecklistHub.tsx` | Create | Task accordion with notes/proof inputs |
| `hooks/usePickaxeEmbed.ts` | Create | Pickaxe script injection lifecycle |
| `components/bootcamp/LessonView.tsx` | Modify | Header + checklist vs content dispatch |

---

## Chunk 1: BootcampApp Decomposition

### Task 1: Extract useBootcampAuth hook

**Files:**
- Create: `hooks/useBootcampAuth.ts`
- Modify: `pages/bootcamp/BootcampApp.tsx`

- [ ] **Step 1: Read `pages/bootcamp/BootcampApp.tsx`** — identify all auth-related state and handlers

The auth concern includes:
- `useState`: `user`, `bootcampStudent`, `showRegister`
- The `useAuth()` call and its `logout` function
- `useEffect` that auto-loads user from localStorage on mount
- `loginHandler` and `registerHandler` callbacks
- The auto-redeem logic (search params `?code=`)
- `handleStudentUpdate` callback (re-fetches bootcampStudent)

- [ ] **Step 2: Create `hooks/useBootcampAuth.ts`**

Extract the above state + effects + handlers into a hook that returns:
```typescript
interface UseBootcampAuthReturn {
  user: User | null;
  bootcampStudent: BootcampStudent | null;
  showRegister: boolean;
  setShowRegister: (v: boolean) => void;
  handleLogin: (user: User) => void;
  handleRegister: (user: User) => void;
  handleLogout: () => void;
  handleStudentUpdate: () => Promise<void>;
}
```

The hook needs `searchParams`/`setSearchParams` from React Router and `queryClient` from TanStack. It should also accept an optional `refetchGrants` callback for wiring up with `useStudentGrants` (which depends on `bootcampStudent?.id`).

Read the component to find the exact state initialization, effects, and handler code. Move them verbatim into the hook — no behavior changes.

- [ ] **Step 3: Update BootcampApp.tsx** — replace extracted state/handlers with hook call

```typescript
const { user, bootcampStudent, showRegister, setShowRegister, handleLogin, handleRegister, handleLogout, handleStudentUpdate } = useBootcampAuth({ refetchGrants });
```

Remove the extracted `useState`, `useEffect`, and handler definitions from the component.

- [ ] **Step 4: Verify**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add hooks/useBootcampAuth.ts pages/bootcamp/BootcampApp.tsx
git commit -m "refactor: extract useBootcampAuth hook from BootcampApp

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Extract useBootcampCurriculum hook

**Files:**
- Create: `hooks/useBootcampCurriculum.ts`
- Modify: `pages/bootcamp/BootcampApp.tsx`

- [ ] **Step 1: Identify curriculum state and loading logic**

The curriculum concern includes:
- `useState`: `courseData`, `currentLesson`, `loading`, `loadError`
- `loadUserData` function (fetches curriculum from `fetchStudentCurriculumAsLegacy`)
- `loadRequestRef` (prevents duplicate loads)
- `getStorageKey` helper (used by both loading and saving — define here, export for progress hook)
- The `useEffect` that triggers `loadUserData` when enrollment changes

**Cross-hook dependency:** `loadUserData` also initializes progress state (`completedItems`, `proofOfWork`, `taskNotes`, `submittedWeeks`). To avoid circular dependency with the progress hook, `useBootcampCurriculum` accepts progress setter callbacks as parameters:
```typescript
interface UseBootcampCurriculumParams {
  bootcampStudent: BootcampStudent | null;
  activeEnrollment: Enrollment | null;
  onProgressLoaded: (data: { completedItems: Set<string>; proofOfWork: Record<string, string>; taskNotes: Record<string, string>; submittedWeeks: Set<number> }) => void;
}
```

- [ ] **Step 2: Create `hooks/useBootcampCurriculum.ts`**

Returns:
```typescript
interface UseBootcampCurriculumReturn {
  courseData: CourseData | null;
  currentLesson: Lesson | null;
  setCurrentLesson: (lesson: Lesson | null) => void;
  loading: boolean;
  loadError: string | null;
  loadUserData: () => Promise<void>;
  getStorageKey: (suffix: string) => string;
}
```

The hook takes `bootcampStudent`, active enrollment info, and `onProgressLoaded` callback as parameters.

- [ ] **Step 3: Update BootcampApp.tsx** — replace with hook call

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit && git add hooks/useBootcampCurriculum.ts pages/bootcamp/BootcampApp.tsx && git commit -m "refactor: extract useBootcampCurriculum hook from BootcampApp

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Extract useBootcampProgress hook

**Files:**
- Create: `hooks/useBootcampProgress.ts`
- Modify: `pages/bootcamp/BootcampApp.tsx`

- [ ] **Step 1: Identify progress state and handlers**

The progress concern includes:
- `useState`: `completedItems` (Set), `proofOfWork`, `taskNotes`, `submittedWeeks`
- `toggleActionItem`, `updateProofOfWork`, `updateTaskNote` handlers
- `handleWeekSubmit` handler
- `saveProgress` function
- localStorage serialization/deserialization effects

**Note:** Progress state is initialized by the curriculum hook's `loadUserData` via the `onProgressLoaded` callback. This hook exposes `setProgressFromLoad` for that purpose.

- [ ] **Step 2: Create `hooks/useBootcampProgress.ts`**

Takes `userId`, `getStorageKey` (from curriculum hook) as parameters. Returns all progress state + handlers + `setProgressFromLoad`.

- [ ] **Step 3: Update BootcampApp.tsx and commit**

Wire up: pass `progress.setProgressFromLoad` as `onProgressLoaded` to the curriculum hook.

```bash
git add hooks/useBootcampProgress.ts pages/bootcamp/BootcampApp.tsx
git commit -m "refactor: extract useBootcampProgress hook from BootcampApp

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Extract useBootcampOnboarding hook + VirtualLessonRouter

**Files:**
- Create: `hooks/useBootcampOnboarding.ts`
- Create: `components/bootcamp/VirtualLessonRouter.tsx`
- Modify: `pages/bootcamp/BootcampApp.tsx`

- [ ] **Step 1: Extract onboarding hook**

The onboarding concern includes:
- `useState`: `onboardingStep`, `completedOnboardingSteps`, `surveyData`
- `surveyMutation`, `completeOnboardingMutation`
- Step navigation handlers
- `calculateOnboardingProgress` function
- `settings` query (bootcamp_settings)
- `needsOnboarding` derived value

The hook takes `bootcampStudent` as input.

- [ ] **Step 2: Create VirtualLessonRouter sub-component**

The virtual page routing block (lines ~794-904) is a giant `if/else if` that renders different components based on `currentLesson.id` values like `tam-builder`, `connection-qualifier`, `infrastructure`, etc.

Extract to:
```typescript
interface VirtualLessonRouterProps {
  lessonId: string;
  userId: string;
  bootcampStudent: BootcampStudent;
  // ... other needed props
}

export function VirtualLessonRouter({ lessonId, ... }: VirtualLessonRouterProps) {
  switch (lessonId) {
    case 'tam-builder': return <TamBuilder ... />;
    case 'connection-qualifier': return <ConnectionQualifier ... />;
    // etc.
    default: return null;
  }
}
```

- [ ] **Step 3: Update BootcampApp.tsx** — use both hook and sub-component

After all 4 hook extractions + VirtualLessonRouter, `BootcampApp.tsx` should be ~250 lines: hook calls → gates (auth, onboarding, funnel) → layout shell → `<VirtualLessonRouter>` or `<LessonView>` → modals. The remaining 8 UI-only useState + `handleSelectCourse`/`handleCourseOnboardingComplete` orchestration glue + dark mode/Cmd+K effects stay in BootcampApp by design.

- [ ] **Step 4: Verify line count**

```bash
wc -l pages/bootcamp/BootcampApp.tsx
```
Expected: under 300 lines

- [ ] **Step 5: Type check and commit**

```bash
npx tsc --noEmit && git add hooks/useBootcampOnboarding.ts components/bootcamp/VirtualLessonRouter.tsx pages/bootcamp/BootcampApp.tsx && git commit -m "refactor: extract useBootcampOnboarding + VirtualLessonRouter from BootcampApp

BootcampApp reduced from 988 to ~250 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: DfyEngagementDetail Decomposition

### Task 5: Extract useDfyEngagementData hook

**Files:**
- Create: `hooks/useDfyEngagementData.ts`
- Create: `lib/formatCurrency.ts`
- Modify: `components/admin/dfy/DfyEngagementDetail.tsx`

- [ ] **Step 1: Read the root component of DfyEngagementDetail.tsx** (first ~300 lines)

Identify all 10 mutations, 6 queries, `refreshAll` function, and `milestoneGroups` memo.

- [ ] **Step 2: Extract `formatCurrency` to `lib/formatCurrency.ts`** — small pure utility used across the file

- [ ] **Step 3: Create `hooks/useDfyEngagementData.ts`**

Extract all TanStack Query hooks (queries + mutations) and mutation handlers. The hook takes `engagementId` and returns all query data + mutation functions + `refreshAll` + `milestoneGroups`.

Named `useDfyEngagementData` (not `useDfyEngagementMutations`) because it contains both queries and mutations.

- [ ] **Step 4: Update the root component** to use the hook

- [ ] **Step 5: Commit**

```bash
git add hooks/useDfyEngagementData.ts lib/formatCurrency.ts components/admin/dfy/DfyEngagementDetail.tsx
git commit -m "refactor: extract useDfyEngagementData hook + formatCurrency utility

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Move DfyEngagementDetail inline sub-components to separate files

**Files:**
- Create: 17 new files (see file structure table above)
- Modify: `components/admin/dfy/DfyEngagementDetail.tsx`

This is the highest-impact task — the file is 2,682 lines because 14 sub-components are defined inline.

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p components/admin/dfy/panels components/admin/dfy/shared
```

- [ ] **Step 2: Move each sub-component to its own file**

For each inline sub-component, create a new file and:
1. Move the component function + its imports
2. Add explicit props interface
3. Export the component
4. Add `import { logError, logWarn } from '...'` if the component uses them

The sub-components and their target locations:

**panels/ directory** (section-level components):
- `OnboardingChecklistSection` (~143 lines) → `panels/OnboardingChecklistSection.tsx`
- `ContentCallPrepPanel` (~297 lines) → `panels/ContentCallPrepPanel.tsx`
- `ProfileRewriteReviewPanel` (~222 lines) → `panels/ProfileRewriteReviewPanel.tsx`
- `CallTranscriptSection` (~98 lines) → `panels/CallTranscriptSection.tsx`
- `ResourceFilesSection` (~222 lines) → `panels/ResourceFilesSection.tsx` (include `formatFileSize`, `ALLOWED_FILE_EXTENSIONS`, `MAX_FILE_SIZE` constants + its local `deleteMutation`)
- `IntakeFormSection` (~103 lines) → `panels/IntakeFormSection.tsx` (co-locate `IntakeFileRow` in this file since it is only used here)

**shared/ directory** (small reusable components):
- `InfoPair` (~30 lines) → `shared/InfoPair.tsx`
- `ActionButtons` (~90 lines) → `shared/ActionButtons.tsx`
- `DeliverableRow` (~155 lines) → `shared/DeliverableRow.tsx`
- `MilestoneSection` (~70 lines) → `shared/MilestoneSection.tsx`
- `AutomationStatusBadge` (~35 lines) → `shared/AutomationStatusBadge.tsx`
- `AutomationHistoryPanel` (~90 lines) → `shared/AutomationHistoryPanel.tsx`
- `ActivityRow` (~42 lines) → `shared/ActivityRow.tsx`
- `DeleteConfirmationModal` (~50 lines) → `shared/DeleteConfirmationModal.tsx` (extract from inline JSX in root component)

- [ ] **Step 3: Extract DfyOverviewCard, DfyActivityPanel, DfyDeliverablesPanel from root JSX**

The root component's Overview tab JSX (lines ~421-846) contains three large sections:
- **Overview Card** (~240 lines): client details grid, LinkedIn inline edit, Linear customer, Resend Magic Link → `DfyOverviewCard.tsx`
- **Activity Log** (~80 lines): activity list + "Post Update" form. Move `showUpdateForm` and `updateMessage` state here → `DfyActivityPanel.tsx`
- **Deliverables Panel** (~50 lines of wiring): milestone groups + deliverable rows → `DfyDeliverablesPanel.tsx`

- [ ] **Step 4: Update DfyEngagementDetail.tsx imports**

Replace all inline component definitions with imports from the new files.

- [ ] **Step 5: Verify line count**

```bash
wc -l components/admin/dfy/DfyEngagementDetail.tsx
```
Expected: under 300 lines (target ~280 with delete modal extracted)

- [ ] **Step 6: Type check and commit**

```bash
npx tsc --noEmit && git add components/admin/dfy/ hooks/ lib/formatCurrency.ts
git commit -m "refactor: decompose DfyEngagementDetail into sub-component files

DfyEngagementDetail reduced from 2,682 to ~280 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: Template Editor + Proposal Edit Decomposition

### Task 7: Decompose DfyTemplateEditor

**Files:**
- Create: `hooks/useDfyTemplateEditor.ts`
- Create: `components/admin/dfy/template/constants.ts`
- Create: `components/admin/dfy/template/MilestonesEditor.tsx`
- Create: `components/admin/dfy/template/DeliverableRow.tsx`
- Create: `components/admin/dfy/template/DeliverableEditForm.tsx`
- Modify: `components/admin/dfy/DfyTemplateEditor.tsx`

- [ ] **Step 1: Read `DfyTemplateEditor.tsx`** — identify all state, helpers, constants, and rendering sections

- [ ] **Step 2: Create `components/admin/dfy/template/constants.ts`**

Extract ~103 lines of constants: `CATEGORIES`, `AUTOMATION_TYPES`, `CATEGORY_COLORS`, `PRIORITY_COLORS`, `TEMPLATE_OPTIONS`, `DEFAULT_MILESTONE`, `DEFAULT_DELIVERABLE`, `DEFAULT_TEMPLATE`. These are used by both the hook and sub-components.

- [ ] **Step 3: Create `hooks/useDfyTemplateEditor.ts`**

Extract:
- All 8 `useState` calls (`selectedSlug`, `activeTab`, `templateName`, `milestones`, `deliverables`, `hasChanges`, `collapsedMilestones`, `expandedDeliverable`)
- All milestone helper functions (add, remove, update, reorder, toggle)
- All deliverable helper functions (add, remove, update, move, toggle expand)
- `handleCreateFromDefault`
- The query + mutation (fetch template, save template)
- The `useEffect` (sync fetched template)
- The 2 `useMemo` derivations (previewText, groupedDeliverables)

Returns all state + handlers + derived data.

- [ ] **Step 4: Create `components/admin/dfy/template/MilestonesEditor.tsx`**

Move the milestones card section (~180 lines) — the accordion list with reorder, collapse, inline field grid. Receives `isDarkMode`-derived style classes as props (e.g., `inputClass`, `selectClass`, `labelClass`, `cardClass`).

- [ ] **Step 5: Create `components/admin/dfy/template/DeliverableRow.tsx` + `DeliverableEditForm.tsx`**

The single deliverable rendering is ~430 lines total. Split into:
- `DeliverableRow.tsx` — collapsed summary row (~140 lines): badge, title, status, priority, actions
- `DeliverableEditForm.tsx` — expanded edit form (~280 lines): all form fields, category/priority selects, automation config, dependencies

Both receive style classes as props.

- [ ] **Step 6: Update DfyTemplateEditor.tsx** as thin orchestrator

The orchestrator: header + template selector + tab bar + `<MilestonesEditor>` + deliverable list mapping. Computes `isDarkMode`-derived style classes and passes them as props to sub-components.

- [ ] **Step 7: Verify and commit**

```bash
wc -l components/admin/dfy/DfyTemplateEditor.tsx
npx tsc --noEmit && git add hooks/useDfyTemplateEditor.ts components/admin/dfy/template/ components/admin/dfy/DfyTemplateEditor.tsx
git commit -m "refactor: decompose DfyTemplateEditor into hook + sub-components

DfyTemplateEditor reduced from 1,387 to ~250 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Decompose AdminProposalEdit

**Files:**
- Create: `hooks/useProposalForm.ts`
- Create: `components/admin/proposals/sections/ProposalClientInfo.tsx`
- Create: `components/admin/proposals/sections/ProposalServicesSection.tsx`
- Create: `components/admin/proposals/sections/ProposalRoadmapSection.tsx`
- Create: `components/admin/proposals/sections/ProposalPricingSection.tsx`
- Modify: `components/admin/proposals/AdminProposalEdit.tsx`

- [ ] **Step 1: Read `AdminProposalEdit.tsx`**

- [ ] **Step 2: Create `hooks/useProposalForm.ts`**

Extract:
- `toSnakeCase` utility function
- `StatusBadge` sub-component (small, co-locate in hook file or keep in orchestrator)
- `FormState` type and `proposalToForm` mapper
- Form state (`form`, `saving`, `copied`, `saveMessage`) + all 20 form helper functions:
  - Field updates: `updateField`, `updateSnapshot`, `updateGoal`
  - Service CRUD: `addService`, `removeService`, `updateService`
  - Phase CRUD: `addPhase`, `removePhase`, `updatePhase`
  - Next step CRUD: `addNextStep`, `removeNextStep`, `updateNextStep`
  - Pricing: `updatePricingPackage`, `addPricingCustomItem`, `removePricingCustomItem`, `updatePricingCustomItem`
  - Actions: `handleSaveDraft`, `handlePublish`, `handleArchive`, `copyUrl`
- Query (getProposalById) + mutation (updateProposal)

- [ ] **Step 3: Create section sub-components in `components/admin/proposals/sections/`**

Each section becomes a component receiving the form state slice + update handler:
- `ProposalClientInfo` — client info + snapshot + headline/summary (~120 lines)
- `ProposalServicesSection` — dynamic services list (~73 lines)
- `ProposalRoadmapSection` — dynamic roadmap phases (~82 lines)
- `ProposalPricingSection` — packages + custom items + totals (~150 lines)

Goals (~52 lines) and Next Steps (~56 lines) sections are small enough to stay inline in the orchestrator.

- [ ] **Step 4: Update AdminProposalEdit.tsx**

Orchestrator renders: top action bar + published URL + section components + inline Goals/NextSteps + bottom save bar. Expected ~200 lines.

- [ ] **Step 5: Verify and commit**

```bash
wc -l components/admin/proposals/AdminProposalEdit.tsx
npx tsc --noEmit && git add hooks/useProposalForm.ts components/admin/proposals/
git commit -m "refactor: decompose AdminProposalEdit into hook + section components

AdminProposalEdit reduced from 1,050 to ~200 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: Remaining Component Decomposition

### Task 9: Decompose BlueprintLandingPage

**Files:**
- Create: `hooks/useBlueprintForm.ts`
- Create: `components/blueprint/BlueprintQuestionnaire.tsx`
- Create: `components/blueprint/landing/NavBar.tsx`
- Create: `components/blueprint/landing/Hero.tsx`
- Create: `components/blueprint/landing/HowItWorks.tsx`
- Create: `components/blueprint/landing/Footer.tsx`
- Modify: `components/blueprint/BlueprintLandingPage.tsx`

- [ ] **Step 1: Read `BlueprintLandingPage.tsx`**

- [ ] **Step 2: Create `hooks/useBlueprintForm.ts`**

Extract: `phase` state machine, `formData` state, `isSubmitting`, `error`, submission handler (`handleQuestionnaireComplete`), session restore effect, logos fetch. Note: the component has 8 useState calls, which is below the 15 extraction threshold, but the hook keeps the orchestrator focused on rendering.

- [ ] **Step 3: Move inline sub-components to their own files**

The file already has `NavBar`, `Hero`, `StatsRow`, `SocialProof`, `HowItWorks`, `Footer` defined inline. Move each to `components/blueprint/landing/`. Create the `landing/` directory first:

```bash
mkdir -p components/blueprint/landing
```

`BlueprintQuestionnaire` (~316 lines) is the largest — move to `components/blueprint/BlueprintQuestionnaire.tsx`. `StatsRow` and `SocialProof` are small enough to co-locate in `Hero.tsx` or stay inline.

- [ ] **Step 4: Update BlueprintLandingPage.tsx**

- [ ] **Step 5: Verify and commit**

```bash
wc -l components/blueprint/BlueprintLandingPage.tsx
npx tsc --noEmit && git add hooks/useBlueprintForm.ts components/blueprint/
git commit -m "refactor: decompose BlueprintLandingPage into hook + sub-components

BlueprintLandingPage reduced from 1,097 to ~200 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Decompose EmailEnrichmentPage

**Files:**
- Create: `hooks/useEnrichmentPageState.ts`
- Create: `lib/csv-parser.ts`
- Create: `components/bootcamp/email-enrichment/EnrichmentUploadStep.tsx`
- Create: `components/bootcamp/email-enrichment/EnrichmentMapStep.tsx`
- Create: `components/bootcamp/email-enrichment/EnrichmentProcessingStep.tsx`
- Create: `components/bootcamp/email-enrichment/EnrichmentResultsStep.tsx`
- Modify: `components/bootcamp/email-enrichment/EmailEnrichmentPage.tsx`

- [ ] **Step 1: Read `EmailEnrichmentPage.tsx`**

- [ ] **Step 2: Move `parseRow` and `parseCsv` to `lib/csv-parser.ts`** — pure functions with no React dependency

- [ ] **Step 3: Create `hooks/useEnrichmentPageState.ts`** — all 11 useState + all useCallback handlers

Named `useEnrichmentPageState` (not `useEnrichmentFlow`) to avoid confusion with the existing `hooks/useEmailEnrichment.ts` hook that handles the enrichment polling logic.

- [ ] **Step 4: Create step components** — all 4 steps, each a self-contained rendering block:
- `EnrichmentUploadStep` — Step 1: drag-drop CSV upload zone
- `EnrichmentMapStep` — Step 2: column mapping interface
- `EnrichmentProcessingStep` — Step 3: progress bar, live stats, enrichment hook
- `EnrichmentResultsStep` — Step 4: results table with download

- [ ] **Step 5: Update EmailEnrichmentPage.tsx** as step router

```typescript
switch (step) {
  case 'upload': return <EnrichmentUploadStep ... />;
  case 'map': return <EnrichmentMapStep ... />;
  case 'processing': return <EnrichmentProcessingStep ... />;
  case 'results': return <EnrichmentResultsStep ... />;
}
```

- [ ] **Step 6: Verify and commit**

```bash
wc -l components/bootcamp/email-enrichment/EmailEnrichmentPage.tsx
npx tsc --noEmit && git add hooks/useEnrichmentPageState.ts lib/csv-parser.ts components/bootcamp/email-enrichment/
git commit -m "refactor: decompose EmailEnrichmentPage into hook + step components

EmailEnrichmentPage reduced from 777 to ~150 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Decompose LmsContentItemModal

**Files:**
- Create: `hooks/useContentItemForm.ts`
- Create: `components/admin/lms/curriculum/TextContentEditor.tsx`
- Create: `components/admin/lms/curriculum/CredentialsFields.tsx`
- Modify: `components/admin/lms/curriculum/LmsContentItemModal.tsx`

- [ ] **Step 1: Read `LmsContentItemModal.tsx`**

- [ ] **Step 2: Create `hooks/useContentItemForm.ts`**

Extract: `formData` state, `handleUrlChange` handler, `handleSubmit` logic. Per the spec: "Extract form logic to hook."

- [ ] **Step 3: Move `TextContentEditor` to its own file** (~240 lines, already a self-contained sub-component defined inline)

- [ ] **Step 4: Extract `CredentialsFields` component** (~130 lines)

This is currently a render block (not a named component) in the JSX. Wrap it as a proper component with explicit props during extraction.

- [ ] **Step 5: Update LmsContentItemModal.tsx** — import the hook + two extracted components

- [ ] **Step 6: Verify**

```bash
wc -l components/admin/lms/curriculum/LmsContentItemModal.tsx
```
Expected: under 300 lines

- [ ] **Step 7: Type check and commit**

```bash
npx tsc --noEmit && git add hooks/useContentItemForm.ts components/admin/lms/curriculum/
git commit -m "refactor: decompose LmsContentItemModal into hook + sub-components

LmsContentItemModal reduced from 752 to ~250 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Decompose LessonView

**Files:**
- Create: `lib/markdown-utils.ts`
- Create: `components/bootcamp/LessonContentRenderer.tsx`
- Create: `components/bootcamp/ChecklistHub.tsx`
- Create: `hooks/usePickaxeEmbed.ts`
- Modify: `components/bootcamp/LessonView.tsx`

- [ ] **Step 1: Read `LessonView.tsx`**

- [ ] **Step 2: Move `preprocessTextContent` to `lib/markdown-utils.ts`** — pure function

- [ ] **Step 3: Create `hooks/usePickaxeEmbed.ts`** — Pickaxe detection + MutationObserver + script injection lifecycle

- [ ] **Step 4: Create `LessonContentRenderer.tsx`** — the 9-branch content type switch

- [ ] **Step 5: Create `ChecklistHub.tsx`** — task accordion with notes/proof inputs

- [ ] **Step 6: Update LessonView.tsx** — header + dispatch to ChecklistHub or LessonContentRenderer

- [ ] **Step 7: Verify**

```bash
wc -l components/bootcamp/LessonView.tsx
```
Expected: under 300 lines

- [ ] **Step 8: Type check and commit**

```bash
npx tsc --noEmit && git add lib/markdown-utils.ts hooks/usePickaxeEmbed.ts components/bootcamp/LessonView.tsx components/bootcamp/LessonContentRenderer.tsx components/bootcamp/ChecklistHub.tsx
git commit -m "refactor: decompose LessonView into sub-components

LessonView reduced from 736 to ~200 lines.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Final verification sweep

- [ ] **Step 1: Check all 8 original components are under 300 lines**

```bash
cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && wc -l pages/bootcamp/BootcampApp.tsx components/admin/dfy/DfyEngagementDetail.tsx components/admin/dfy/DfyTemplateEditor.tsx components/admin/proposals/AdminProposalEdit.tsx components/blueprint/BlueprintLandingPage.tsx components/bootcamp/email-enrichment/EmailEnrichmentPage.tsx components/admin/lms/curriculum/LmsContentItemModal.tsx components/bootcamp/LessonView.tsx
```

- [ ] **Step 2: Check no extracted file exceeds 300 lines**

```bash
find hooks/ components/ lib/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run
```

- [ ] **Step 5: Build**

```bash
npm run build
```

- [ ] **Step 6: Final commit if cleanup needed**

```bash
git add -A && git commit -m "chore: spec 3 complete — all components under 300 lines

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
