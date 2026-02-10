# Plan: Bootcamp Supabase Auth (Magic Link + Google OAuth)

## Problem

The bootcamp login has no Supabase Auth session — students just type their email and the app queries `bootcamp_students` by email. This means:
- `auth.jwt()` is always NULL — all RLS policies relying on it fail
- No session management, token refresh, or security
- We had to create RPC workarounds (SECURITY DEFINER) for infra provisions

## Goal

Add proper Supabase Auth (magic link + Google OAuth) without breaking existing students.

## Current Auth Flow

1. Student enters email on login page
2. `verifyBootcampStudent(email)` queries `bootcamp_students` table via `.ilike('email', email)`
3. If found, user object saved to localStorage (`lms_user_obj`)
4. `BootcampApp` reads from localStorage on mount, fetches student record again
5. No Supabase Auth session exists at any point

## Proposed Auth Flow

1. Student enters email on login page
2. App checks if email exists in `bootcamp_students` (keep this gate — only enrolled students can log in)
3. If found, offer two auth methods:
   - **Magic Link**: `supabase.auth.signInWithOtp({ email })` — sends email with login link
   - **Google OAuth**: `supabase.auth.signInWithOAuth({ provider: 'google' })` — redirect flow
4. After auth, `supabase.auth.onAuthStateChange()` fires with session
5. App verifies the auth email matches a `bootcamp_students` record
6. Session persisted by Supabase client (automatic JWT refresh)

## Implementation Steps

### Step 1: Add `auth_user_id` column to `bootcamp_students`

```sql
ALTER TABLE bootcamp_students ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
CREATE INDEX idx_bootcamp_students_auth_user_id ON bootcamp_students(auth_user_id);
```

This links each bootcamp student to their Supabase Auth user. Populated on first login.

### Step 2: Configure Supabase Auth providers

- Magic link (OTP) is enabled by default in Supabase
- Google OAuth: configure in Supabase Dashboard > Auth > Providers > Google
  - Use existing `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from magnetlab (same Supabase project)
  - Add redirect URL: `https://qvawbxpijxlwdkolmjrs.supabase.co/auth/v1/callback`

### Step 3: Update Login component

Replace `components/bootcamp/Login.tsx`:

```
1. Student enters email
2. Check bootcamp_students for email (existing behavior)
3. If not found → "Email not found" error (unchanged)
4. If found → show auth method picker:
   - "Send Magic Link" button → supabase.auth.signInWithOtp({ email })
   - "Continue with Google" button → supabase.auth.signInWithOAuth({
       provider: 'google',
       options: { redirectTo: window.location.origin + '/bootcamp' }
     })
5. For magic link: show "Check your email" message
6. For Google: redirect happens automatically
```

### Step 4: Update AuthContext / BootcampApp session handling

```
1. On mount, call supabase.auth.getSession()
2. Listen to supabase.auth.onAuthStateChange()
3. When session exists:
   a. Get email from session.user.email
   b. Query bootcamp_students by email
   c. If student found and auth_user_id is null, UPDATE to set auth_user_id = session.user.id
   d. Set user state (same as current flow)
4. When session ends (SIGNED_OUT):
   a. Clear user state
   b. Navigate to login
```

### Step 5: Update RLS policies

Replace email-based RLS with auth_user_id:

```sql
-- Drop old email-based policies
DROP POLICY IF EXISTS "Students read own provisions" ON infra_provisions;
DROP POLICY IF EXISTS "Students insert own provisions" ON infra_provisions;

-- New auth_user_id-based policies
CREATE POLICY "Students read own provisions"
ON infra_provisions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM bootcamp_students WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Students insert own provisions"
ON infra_provisions FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM bootcamp_students WHERE auth_user_id = auth.uid()
  )
);
```

Keep the RPC function as fallback during migration period.

### Step 6: Backward compatibility

- Keep the RPC `get_student_provisions` function working (for any edge cases)
- The `auth_user_id` column is nullable — students who haven't re-logged in yet still work via RPC
- Once all students have logged in with the new flow, auth_user_id gets populated automatically
- localStorage `lms_user_obj` can be removed after full migration

### Step 7: Logout

```
supabase.auth.signOut()
localStorage.removeItem('lms_user_obj')
```

## Migration Safety

- **No data changes**: `bootcamp_students` table is untouched except adding nullable `auth_user_id`
- **No breaking changes**: Students who haven't re-logged still work via RPC fallback
- **Gradual migration**: `auth_user_id` populated on each student's next login
- **Google OAuth for convenience**: Students with Google accounts get instant login
- **Magic link as universal fallback**: Works for all email addresses

## Files to Change

| File | Change |
|------|--------|
| `components/bootcamp/Login.tsx` | New auth flow with magic link + Google OAuth |
| `context/AuthContext.tsx` | Add Supabase Auth session listener |
| `pages/bootcamp/BootcampApp.tsx` | Use auth session instead of localStorage |
| `services/bootcamp-supabase.ts` | Add `linkAuthUser()` function |
| `services/infrastructure-supabase.ts` | Can revert to direct queries once all students migrated |
| New migration SQL | Add `auth_user_id` column + updated RLS policies |

## Open Questions

- Should we force re-login for existing students, or keep localStorage working in parallel?
- Do we want to add password auth too, or just magic link + Google?
- Should the magic link email be customized (Supabase allows custom email templates)?
