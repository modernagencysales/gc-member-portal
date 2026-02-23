# Lead Magnet Invite Codes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the admin Generate Codes modal to support access level, tool grants, credits, and custom codes — so invite codes can be used as lead magnets that grant limited AI tool access.

**Architecture:** The service layer (`createInviteCode`), mutation hook, database schema, and registration flow already support all fields. This is purely a UI wiring task: expand the modal form, pass new fields through the callback, and show grant info in the table.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, TanStack Query, Supabase

---

### Task 1: Expand GenerateCodeModal with new fields

**Files:**
- Modify: `components/admin/bootcamp/invite-codes/GenerateCodeModal.tsx`

**Step 1: Update the modal's props interface and form state**

The current `onGenerate` callback is:
```typescript
onGenerate: (
  cohortId: string,
  count: number,
  options?: { maxUses?: number; expiresAt?: Date }
) => Promise<void>;
```

Replace the entire file with the expanded version. Key changes:
- Import `useQuery` from `@tanstack/react-query`, `fetchActiveAITools` from `services/chat-supabase`, `AITool` from `types/chat-types`, `ToolGrant` from `types/bootcamp-types`
- Expand `onGenerate` options to include `customCode?: string`, `accessLevel?: string`, `toolGrants?: ToolGrant[]`
- Add form state: `accessLevel` (default `'Lead Magnet'`), `customCode` (default `''`), `creditsPerTool` (default `10`), `selectedToolSlugs` (default `[]` as `string[]`)
- Fetch active AI tools with `useQuery` keyed on `['ai-tools', 'active']`
- Add Access Level dropdown below Cohort (options: `Lead Magnet`, `Funnel Access`, `Curriculum Only`, `Full Access`)
- Add "Tool Grants" section with credits-per-tool number input and checkbox list of active tools
- Add Custom Code text input above Number of Codes
- When `customCode` is non-empty, lock count to 1 and disable the count input
- Auto-uppercase `customCode` on change
- In `handleSubmit`, build `toolGrants` array from selected slugs: `selectedToolSlugs.map(slug => ({ toolSlug: slug, credits: creditsPerTool }))`
- Pass `customCode`, `accessLevel`, `toolGrants` in the options to `onGenerate`

```typescript
// New form state shape:
const [formData, setFormData] = useState({
  cohortId: '',
  count: 1,
  maxUses: '',
  expiresAt: '',
  accessLevel: 'Lead Magnet',
  customCode: '',
  creditsPerTool: 10,
  selectedToolSlugs: [] as string[],
});
```

```typescript
// Tool grants section JSX (inside the form, after Access Level dropdown):
{/* Tool Grants */}
<div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
  <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
    Tool Grants (Optional)
  </label>
  <div className="mb-3">
    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
      Credits per tool
    </label>
    <input
      type="number"
      min="1"
      max="100"
      value={formData.creditsPerTool}
      onChange={(e) => setFormData({ ...formData, creditsPerTool: parseInt(e.target.value, 10) || 10 })}
      className={`w-24 px-3 py-1.5 rounded-lg border text-sm ${
        isDarkMode
          ? 'bg-slate-800 border-slate-600 text-white'
          : 'bg-white border-slate-300 text-slate-900'
      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
    />
  </div>
  {isLoadingTools ? (
    <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading tools...</p>
  ) : (
    <div className="space-y-2">
      {aiTools?.map((tool) => (
        <label key={tool.id} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.selectedToolSlugs.includes(tool.slug)}
            onChange={(e) => {
              const slugs = e.target.checked
                ? [...formData.selectedToolSlugs, tool.slug]
                : formData.selectedToolSlugs.filter((s) => s !== tool.slug);
              setFormData({ ...formData, selectedToolSlugs: slugs });
            }}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            {tool.name}
          </span>
        </label>
      ))}
    </div>
  )}
</div>
```

```typescript
// Custom code field JSX (before Number of Codes):
<div>
  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
    Custom Code (Optional)
  </label>
  <input
    type="text"
    value={formData.customCode}
    onChange={(e) => setFormData({
      ...formData,
      customCode: e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ''),
      count: e.target.value ? 1 : formData.count,
    })}
    className={`w-full px-4 py-2.5 rounded-lg border font-mono ${
      isDarkMode
        ? 'bg-slate-800 border-slate-700 text-white'
        : 'bg-white border-slate-300 text-slate-900'
    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
    placeholder="e.g. POSTGEN10"
  />
  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
    Letters, numbers, hyphens, underscores only. Sets count to 1.
  </p>
</div>
```

```typescript
// handleSubmit builds full options:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.cohortId) return;

  const options: {
    maxUses?: number;
    expiresAt?: Date;
    customCode?: string;
    accessLevel?: string;
    toolGrants?: ToolGrant[];
  } = {};

  if (formData.maxUses) options.maxUses = parseInt(formData.maxUses, 10);
  if (formData.expiresAt) options.expiresAt = new Date(formData.expiresAt);
  if (formData.customCode) options.customCode = formData.customCode;
  if (formData.accessLevel) options.accessLevel = formData.accessLevel;
  if (formData.selectedToolSlugs.length > 0) {
    options.toolGrants = formData.selectedToolSlugs.map((slug) => ({
      toolSlug: slug,
      credits: formData.creditsPerTool,
    }));
  }

  await onGenerate(formData.cohortId, formData.count, options);

  // Reset form
  setFormData({
    cohortId: '',
    count: 1,
    maxUses: '',
    expiresAt: '',
    accessLevel: 'Lead Magnet',
    customCode: '',
    creditsPerTool: 10,
    selectedToolSlugs: [],
  });
};
```

**Step 2: Verify modal renders correctly**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit 2>&1 | head -30`
Expected: No type errors in the modified file.

**Step 3: Commit**

```bash
git add components/admin/bootcamp/invite-codes/GenerateCodeModal.tsx
git commit -m "feat: add access level, tool grants, and custom code to invite code modal"
```

---

### Task 2: Update AdminBootcampInviteCodesPage to pass new fields and show grants column

**Files:**
- Modify: `components/admin/bootcamp/invite-codes/AdminBootcampInviteCodesPage.tsx`

**Step 1: Update handleCreateCodes callback signature**

Current signature on line 91-95:
```typescript
const handleCreateCodes = async (
  cohortId: string,
  count: number,
  options?: { maxUses?: number; expiresAt?: Date }
) => {
```

Expand to match the new modal callback:
```typescript
const handleCreateCodes = async (
  cohortId: string,
  count: number,
  options?: {
    maxUses?: number;
    expiresAt?: Date;
    customCode?: string;
    accessLevel?: string;
    toolGrants?: ToolGrant[];
  }
) => {
  for (let i = 0; i < count; i++) {
    await createMutation.mutateAsync({ cohortId, options });
  }
  setIsModalOpen(false);
};
```

Import `ToolGrant` from `types/bootcamp-types` at the top.

**Step 2: Add "Grants" column to the table**

In the `<thead>`, add a new `<th>` between "Cohort" and "Uses":
```tsx
<th className="px-4 py-3 text-left">Grants</th>
```

Update `colSpan` in the empty state `<td>` from 6 to 7.

In each `<tr>` row, add a new `<td>` between Cohort and Uses:
```tsx
<td className="px-4 py-3">
  <div className="flex flex-col gap-1">
    {code.grantedAccessLevel && code.grantedAccessLevel !== 'Full Access' && (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        code.grantedAccessLevel === 'Lead Magnet'
          ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      }`}>
        {code.grantedAccessLevel}
      </span>
    )}
    {code.toolGrants && code.toolGrants.length > 0 && (
      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {code.toolGrants.length} tool{code.toolGrants.length !== 1 ? 's' : ''} · {code.toolGrants[0].credits} credits
      </span>
    )}
    {(!code.grantedAccessLevel || code.grantedAccessLevel === 'Full Access') && (!code.toolGrants || code.toolGrants.length === 0) && (
      <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
    )}
  </div>
</td>
```

**Step 3: Verify with type check**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npx tsc --noEmit 2>&1 | head -30`
Expected: No type errors.

**Step 4: Commit**

```bash
git add components/admin/bootcamp/invite-codes/AdminBootcampInviteCodesPage.tsx
git commit -m "feat: pass tool grants through to mutation, add Grants column to invite codes table"
```

---

### Task 3: Manual smoke test

**Step 1: Run dev server and verify**

Run: `cd "/Users/timlife/Documents/claude code/copy-of-gtm-os" && npm run dev`

Test checklist:
1. Navigate to `/admin/courses/invite-codes`
2. Click "Generate Codes" — verify modal shows all new fields
3. Select a cohort, set access level to "Lead Magnet"
4. Check 1-2 tools, set credits to 10
5. Enter a custom code like `TEST123` — verify count locks to 1
6. Generate the code
7. Verify the new code appears in the table with "Lead Magnet" badge and tool count
8. Copy the registration link and verify it includes the code
9. Delete the test code

**Step 2: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish invite code modal after smoke test"
```
