# Authentication & Role-Based Access Control (RBAC)

## 1. 5-Tier Privilege Matrix

| Capability / Entity | Anonymous Public (`anon`) | Enrolled Student (`student`) | Course Mentor (`mentor`) | Super Admin (`super_admin`) | Developer (`dev`) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Browse Public Courses & Lectures** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Stream Audio Records & Videos** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Submit Question / Feedback** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Request Course Enrollment** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Student Profile & Notifications** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Manage Assigned Courses & Lectures**| ❌ | ❌ | ✅ | ✅ | ✅ |
| **Upload Audio Records & Quizzes** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Answer Community Questions** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Approve / Reject Enrollments** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Unassigned Courses** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Manage Staff Accounts** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Edit Public Site Content (CMS)** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Access Developer Health Console** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 2. In-Database Security Definer Role Resolver

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated, service_role;
```

---

## 3. Session Management & Cookie Safety

- **Storage**: Supabase Auth session tokens (`access_token` & `refresh_token`) are managed securely via Supabase JS client storage.
- **Token Life**: Short-lived access JWTs (1 hour) with automatic background refresh.
- **Logout Cleanliness**: Explicit `supabase.auth.signOut()` purges all local cached credentials and resets in-memory React state.
