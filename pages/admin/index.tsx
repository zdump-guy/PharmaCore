import type { GetServerSideProps } from "next"
import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { ArrowUpRight, BarChart3, BookOpen, CheckCircle2, CircleHelp, ClipboardCheck, FileVideo, LayoutDashboard, Loader2, MessageCircle, MoreHorizontal, Plus, Search, Send, ShieldCheck, Sparkles, UsersRound } from "lucide-react"
import Layout from "@/components/Layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { demoCourses, demoLectures, demoQuestions } from "@/lib/demo-data"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import type { CommunityQuestion, Course, UserProfile } from "@/types"

<<<<<<< HEAD
const emptyCourse = { title_en: "", title_ar: "", description_en: "", description_ar: "" }

=======
// ── Admin Layout ────────────────────────────────────────────────
function AdminLayout({ children, activeTab, onTabChange, userRole }: {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: UserRole;
}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
  const isAr = locale === 'ar';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const tabs = [
    { id: 'courses', label: t('admin.courses'), icon: '📚' },
    { id: 'lectures', label: t('admin.lectures'), icon: '🎬' },
    { id: 'quizzes', label: t('admin.quizzes'), icon: '📝' },
    { id: 'qa', label: t('admin.qa'), icon: '💬' },
  ];

  if (userRole === 'super_admin' || userRole === 'dev') {
    tabs.push({ id: 'users', label: 'Users', icon: '👥' });
  }

  return (
    <div lang={locale} dir={isAr ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Head>
        <title>{t('admin.dashboard')} — PharmaCore</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Navbar />
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              className={`admin-sidebar__item${activeTab === tab.id ? ' admin-sidebar__item--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            id="admin-logout-btn"
            className="admin-sidebar__item"
            onClick={handleLogout}
            style={{ color: '#e53e3e', marginTop: 'auto' }}
          >
            <span>🚪</span>
            <span>{t('admin.logout')}</span>
          </button>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}

// ── Courses Tab ─────────────────────────────────────────────────
function CoursesTab({ userRole, userId }: { userRole: UserRole; userId: string }) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isAr = locale === 'ar';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({ title_en: '', title_ar: '', description_en: '', description_ar: '', objectives_en: '', objectives_ar: '', prerequisites_en: '', prerequisites_ar: '', thumbnail_url: '' });
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    let q = supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (userRole === 'mentor') {
      // Fetch only assigned courses
      const { data: assigns } = await supabase.from('mentor_course_assignments').select('course_id').eq('mentor_id', userId);
      const ids = (assigns ?? []).map((a: any) => a.course_id);
      if (ids.length > 0) q = q.in('id', ids); else { setCourses([]); setLoading(false); return; }
    }
    const { data } = await q;
    setCourses(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const openAdd = () => { setEditCourse(null); setForm({ title_en: '', title_ar: '', description_en: '', description_ar: '', objectives_en: '', objectives_ar: '', prerequisites_en: '', prerequisites_ar: '', thumbnail_url: '' }); setShowForm(true); };
  const openEdit = (c: Course) => { setEditCourse(c); setForm({ title_en: c.title_en, title_ar: c.title_ar, description_en: c.description_en, description_ar: c.description_ar, objectives_en: c.objectives_en, objectives_ar: c.objectives_ar, prerequisites_en: c.prerequisites_en, prerequisites_ar: c.prerequisites_ar, thumbnail_url: c.thumbnail_url ?? '' }); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editCourse) {
      await supabase.from('courses').update(form).eq('id', editCourse.id);
    } else {
      await supabase.from('courses').insert([form]);
    }
    setSaving(false);
    setShowForm(false);
    fetchCourses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    await supabase.from('courses').delete().eq('id', id);
    fetchCourses();
  };

  return (
    <div>
      <div className="admin-header">
        <h2>{t('admin.courses')}</h2>
        {userRole !== 'mentor' && (
          <button id="add-course-btn" className="btn btn-primary btn-sm" onClick={openAdd}>
            + {t('admin.addCourse')}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 32 }}>
          <h3 style={{ marginBottom: 20 }}>{editCourse ? t('admin.edit') : t('admin.addCourse')}</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {['title_en', 'title_ar', 'description_en', 'description_ar', 'objectives_en', 'objectives_ar', 'prerequisites_en', 'prerequisites_ar'].map(field => (
                <div key={field} className="form-group">
                  <label htmlFor={`course-${field}`}>{field.replace(/_/g, ' ')}</label>
                  <textarea id={`course-${field}`} className="input" value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} rows={2} />
                </div>
              ))}
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label htmlFor="course-thumbnail">Thumbnail URL</label>
                <input id="course-thumbnail" className="input" type="url" value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button id="course-save-btn" type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? '...' : t('admin.save')}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>{t('admin.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : courses.length === 0 ? (
        <div className="empty-state"><div className="empty-state__icon">📚</div><p>{t('courses.noCourses')}</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map(course => (
            <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              {course.thumbnail_url && <img src={course.thumbnail_url} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{isAr ? course.title_ar : course.title_en}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isAr ? course.title_en : course.title_ar}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/course/${course.id}`} className="btn btn-ghost btn-sm" target="_blank">👁</Link>
                <button id={`edit-course-${course.id}`} className="btn btn-ghost btn-sm" onClick={() => openEdit(course)}>{t('admin.edit')}</button>
                {userRole !== 'mentor' && (
                  <button id={`delete-course-${course.id}`} className="btn btn-ghost btn-sm" style={{ color: '#e53e3e' }} onClick={() => handleDelete(course.id)}>{t('admin.delete')}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Q&A Tab ─────────────────────────────────────────────────────
function QATab({ userId }: { userId: string }) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_questions')
      .select('*, answers:community_answers(*)')
      .order('created_at', { ascending: false });
    setQuestions(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleReply = async (qId: string) => {
    const text = replyText[qId]?.trim();
    if (!text) return;
    setReplying(qId);
    await supabase.from('community_answers').insert([{ question_id: qId, responder_id: userId, text }]);
    setReplyText(r => ({ ...r, [qId]: '' }));
    setReplying(null);
    fetchQuestions();
  };

  return (
    <div>
      <div className="admin-header"><h2>{t('admin.qa')}</h2></div>
      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : questions.length === 0 ? (
        <div className="empty-state"><div className="empty-state__icon">💬</div><p>{t('lecture.qaNoQuestions')}</p></div>
      ) : (
        <div className="qa-section">
          {questions.map(q => (
            <div key={q.id} className="qa-question-card">
              <div className="qa-question-header">
                <div className="qa-author">
                  <div className="qa-avatar">{q.author_name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.author_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.author_email} · {new Date(q.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              <p style={{ marginBottom: 16 }}>{q.text}</p>
              {(q.answers ?? []).map((ans: any) => (
                <div key={ans.id} className="qa-answer">
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{ans.text}</p>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <input
                  id={`reply-input-${q.id}`}
                  className="input"
                  value={replyText[q.id] ?? ''}
                  onChange={e => setReplyText(r => ({ ...r, [q.id]: e.target.value }))}
                  placeholder={locale === 'ar' ? 'اكتب ردك...' : 'Write a reply...'}
                  style={{ flex: 1 }}
                />
                <button
                  id={`reply-btn-${q.id}`}
                  className="btn btn-primary btn-sm"
                  disabled={replying === q.id}
                  onClick={() => handleReply(q.id)}
                >
                  {replying === q.id ? '...' : '↑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users Tab ───────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'mentor' as UserRole });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to create user');
      }
      
      setShowForm(false);
      setForm({ email: '', password: '', full_name: '', role: 'mentor' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>Users Management</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add User</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 32 }}>
          <h3 style={{ marginBottom: 20 }}>Add New User</h3>
          {error && <p className="error-message" style={{ marginBottom: 16 }}>{error}</p>}
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="input" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="input" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="input" required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                  <option value="mentor">Mentor</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="dev">Dev</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div className="qa-avatar">{u.full_name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
              </div>
              <div>
                <span className="badge">{u.role.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ─────────────────────────────────────────────
>>>>>>> 2cee34113deb55d7775fb195b01195423df9c732
export default function AdminPage() {
  const router = useRouter()
  const isAr = router.locale === "ar"
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>(demoCourses)
  const [questions, setQuestions] = useState<CommunityQuestion[]>(demoQuestions)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyCourse)
  const [saving, setSaving] = useState(false)
  const [reply, setReply] = useState<Record<string, string>>({})

  const copy = isAr ? { title: "لوحة إدارة المحتوى", subtitle: "نظّم رحلة التعلّم وراقب ما يحتاج إلى تدخل.", preview: "وضع المعاينة المحلية", role: "مشرف عام", overview: "نظرة عامة", courses: "المقررات", lectures: "المحاضرات", quizzes: "الاختبارات", qa: "الأسئلة", add: "مقرر جديد", search: "ابحث في المقررات...", students: "الطلاب النشطون", completion: "متوسط الإكمال", pending: "أسئلة تنتظر الرد", recent: "المقررات الحديثة", view: "فتح", noResults: "لا توجد نتائج مطابقة.", dialogTitle: "إضافة مقرر جديد", dialogBody: "أدخل المحتوى باللغتين ليظهر بصورة صحيحة لكل طالب.", enTitle: "العنوان بالإنجليزية", arTitle: "العنوان بالعربية", enDesc: "الوصف بالإنجليزية", arDesc: "الوصف بالعربية", cancel: "إلغاء", save: "حفظ المقرر", saving: "جارٍ الحفظ...", publish: "منشور", lessons: "محاضرات", builder: "مساحة بناء المحتوى", coming: "استخدم هذه المساحة لإدارة المحتوى المرتبط بالمقرر.", reply: "اكتب ردًا واضحًا...", send: "إرسال الرد", answered: "تم الرد", unanswered: "يحتاج ردًا" } : { title: "Content administration", subtitle: "Shape the learning journey and see what needs attention.", preview: "Local preview mode", role: "Super admin", overview: "Overview", courses: "Courses", lectures: "Lectures", quizzes: "Quizzes", qa: "Q&A", add: "New course", search: "Search courses...", students: "Active learners", completion: "Average completion", pending: "Questions awaiting reply", recent: "Recent courses", view: "Open", noResults: "No matching courses.", dialogTitle: "Add a new course", dialogBody: "Enter bilingual content so every learner sees the correct version.", enTitle: "English title", arTitle: "Arabic title", enDesc: "English description", arDesc: "Arabic description", cancel: "Cancel", save: "Save course", saving: "Saving...", publish: "Published", lessons: "lectures", builder: "Content builder", coming: "Use this workspace to manage content connected to each course.", reply: "Write a clear reply...", send: "Send reply", answered: "Answered", unanswered: "Needs reply" }

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/login"); return }
      const [{ data: userProfile }, { data: courseData }, { data: questionData }] = await Promise.all([
        supabase.from("users").select("*").eq("id", session.user.id).single(),
        supabase.from("courses").select("*").order("created_at", { ascending: false }),
        supabase.from("community_questions").select("*, answers:community_answers(*)").order("created_at", { ascending: false }),
      ])
      if (userProfile) setProfile(userProfile)
      if (courseData) setCourses(courseData)
      if (questionData) setQuestions(questionData)
      setReady(true)
    })
  }, [router])

  const filtered = useMemo(() => courses.filter((course) => `${course.title_en} ${course.title_ar}`.toLowerCase().includes(search.toLowerCase())), [courses, search])

  async function addCourse(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    const next: Course = { id: `local-${Date.now()}`, ...form, objectives_en: "", objectives_ar: "", prerequisites_en: "", prerequisites_ar: "", thumbnail_url: null, mentor_id: null, created_at: new Date().toISOString() }
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("courses").insert([next]).select().single()
      if (!error && data) setCourses((current) => [data, ...current])
    } else setCourses((current) => [next, ...current])
    setForm(emptyCourse); setSaving(false); setDialogOpen(false)
  }

  function sendReply(questionId: string) {
    const text = reply[questionId]?.trim()
    if (!text) return
    setQuestions((current) => current.map((question) => question.id === questionId ? { ...question, answers: [...(question.answers ?? []), { id: `local-answer-${Date.now()}`, question_id: questionId, responder_id: profile?.id ?? "demo", text, created_at: new Date().toISOString() }] } : question))
    setReply((current) => ({ ...current, [questionId]: "" }))
  }

<<<<<<< HEAD
  if (!ready) return <Layout title={copy.title}><div className="grid min-h-[70vh] place-items-center"><div className="text-center"><Loader2 className="mx-auto size-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">{isAr ? "جارٍ تجهيز لوحة التحكم..." : "Preparing dashboard..."}</p></div></div></Layout>

  const metrics = [
    { label: copy.courses, value: courses.length, Icon: BookOpen, note: "+2 this month" },
    { label: copy.students, value: "1,284", Icon: UsersRound, note: "+12.5%" },
    { label: copy.completion, value: "72%", Icon: BarChart3, note: "Across all courses" },
    { label: copy.pending, value: questions.filter((item) => !item.answers?.length).length, Icon: CircleHelp, note: "Needs attention" },
  ]

  return (
    <Layout title={`${copy.title} — PharmaCore`} description={copy.subtitle}>
      <section className="border-b bg-muted/40">
        <div className="page-shell py-8 lg:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><Badge variant="outline" className="gap-2 bg-card"><ShieldCheck className="size-3.5" />{profile?.role?.replace("_", " ") ?? copy.role}</Badge><h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{copy.title}</h1><p className="mt-2 text-muted-foreground">{copy.subtitle}</p></div>
            {!isSupabaseConfigured && <Badge variant="secondary" className="w-fit px-3 py-2"><Sparkles className="me-2 size-3.5" />{copy.preview}</Badge>}
          </div>
=======
  const renderTab = () => {
    switch (activeTab) {
      case 'courses': return <CoursesTab userRole={userRole} userId={userId} />;
      case 'qa': return <QATab userId={userId} />;
      case 'users': return (userRole === 'super_admin' || userRole === 'dev') ? <UsersTab /> : null;
      default: return (
        <div className="empty-state">
          <div className="empty-state__icon">🚧</div>
          <p>This section is coming soon.</p>
        </div>
      );
    }
  };

  return (
    <ThemeProvider>
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} userRole={userRole}>
        <div style={{ marginBottom: 8 }}>
          <span className="badge">{userRole.replace('_', ' ')}</span>
          {profile?.full_name && <span style={{ marginLeft: 10, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{profile.full_name}</span>}
>>>>>>> 2cee34113deb55d7775fb195b01195423df9c732
        </div>
      </section>

      <div className="page-shell py-8 lg:py-12">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid h-auto w-full grid-cols-5 overflow-hidden bg-muted p-1">
            {[["overview", copy.overview, LayoutDashboard], ["courses", copy.courses, BookOpen], ["lectures", copy.lectures, FileVideo], ["quizzes", copy.quizzes, ClipboardCheck], ["qa", copy.qa, MessageCircle]].map(([value, label, Icon]) => <TabsTrigger key={value as string} value={value as string} className="min-h-12 gap-2 px-2"><Icon className="size-4" /><span className="hidden sm:inline">{label as string}</span></TabsTrigger>)}
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, Icon, note }) => <Card key={label} className="shadow-none"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="icon-tile"><Icon className="size-5" /></span><MoreHorizontal className="size-4 text-muted-foreground" /></div><p className="mt-5 text-3xl font-extrabold">{value}</p><p className="mt-1 text-sm font-semibold">{label}</p><p className="mt-3 text-xs text-muted-foreground">{note}</p></CardContent></Card>)}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
              <Card className="min-w-0 shadow-none"><CardHeader><CardTitle>{copy.recent}</CardTitle></CardHeader><CardContent className="space-y-3">{courses.slice(0, 3).map((course, index) => <div key={course.id} className="flex min-w-0 items-center gap-3 rounded-xl border p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary font-bold text-primary">0{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-bold">{isAr ? course.title_ar : course.title_en}</p><p className="mt-1 text-xs text-muted-foreground">{demoLectures.length} {copy.lessons}</p></div><Button size="icon" variant="ghost" className="shrink-0" asChild><Link href={`/course/${course.id}`} aria-label={copy.view}><ArrowUpRight /></Link></Button></div>)}</CardContent></Card>
              <Card className="min-w-0 shadow-none"><CardHeader><CardTitle>{copy.completion}</CardTitle></CardHeader><CardContent><div className="grid place-items-center rounded-2xl border bg-muted/40 py-8"><p className="text-5xl font-black text-primary">72%</p><p className="mt-2 text-sm text-muted-foreground">+6% this month</p></div><Progress value={72} className="mt-6" /></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.search} aria-label={copy.search} /></div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button><Plus />{copy.add}</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><form onSubmit={addCourse}><DialogHeader><DialogTitle>{copy.dialogTitle}</DialogTitle><DialogDescription>{copy.dialogBody}</DialogDescription></DialogHeader><div className="grid gap-5 py-6 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="title-en">{copy.enTitle}</Label><Input id="title-en" value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="title-ar">{copy.arTitle}</Label><Input id="title-ar" dir="rtl" value={form.title_ar} onChange={(event) => setForm({ ...form, title_ar: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="desc-en">{copy.enDesc}</Label><Textarea id="desc-en" value={form.description_en} onChange={(event) => setForm({ ...form, description_en: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="desc-ar">{copy.arDesc}</Label><Textarea id="desc-ar" dir="rtl" value={form.description_ar} onChange={(event) => setForm({ ...form, description_ar: event.target.value })} required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{copy.cancel}</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />}{saving ? copy.saving : copy.save}</Button></DialogFooter></form></DialogContent></Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((course) => <Card key={course.id} className="card-interactive shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="icon-tile"><BookOpen className="size-5" /></span><Badge variant="secondary"><CheckCircle2 className="me-1 size-3" />{copy.publish}</Badge></div><h2 className="mt-5 text-xl font-bold">{isAr ? course.title_ar : course.title_en}</h2><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{isAr ? course.description_ar : course.description_en}</p><div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-xs text-muted-foreground">{demoLectures.length} {copy.lessons}</span><Button variant="ghost" size="sm" asChild><Link href={`/course/${course.id}`}>{copy.view}<ArrowUpRight /></Link></Button></div></CardContent></Card>)}
            </div>
            {!filtered.length && <Alert><AlertDescription>{copy.noResults}</AlertDescription></Alert>}
          </TabsContent>

          {["lectures", "quizzes"].map((tab) => <TabsContent key={tab} value={tab}><Card className="shadow-none"><CardContent className="p-8 sm:p-12"><div className="mx-auto max-w-lg text-center"><span className="icon-tile mx-auto size-14">{tab === "lectures" ? <FileVideo className="size-6" /> : <ClipboardCheck className="size-6" />}</span><h2 className="mt-5 text-2xl font-bold">{tab === "lectures" ? copy.lectures : copy.quizzes} — {copy.builder}</h2><p className="mt-3 text-muted-foreground">{copy.coming}</p><div className="mt-7 flex justify-center gap-3"><Select><SelectTrigger className="w-56"><SelectValue placeholder={copy.courses} /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{isAr ? course.title_ar : course.title_en}</SelectItem>)}</SelectContent></Select><Button><Plus />{tab === "lectures" ? copy.lectures : copy.quizzes}</Button></div></div></CardContent></Card></TabsContent>)}

          <TabsContent value="qa" className="space-y-5">
            {questions.map((question) => <Card key={question.id} className="shadow-none"><CardContent className="p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary">{question.author_name.charAt(0)}</span><div><p className="font-bold">{question.author_name}</p><p className="text-xs text-muted-foreground">{question.author_email}</p></div></div><Badge variant={question.answers?.length ? "secondary" : "outline"}>{question.answers?.length ? copy.answered : copy.unanswered}</Badge></div><p className="mt-5">{question.text}</p>{question.answers?.map((answer) => <div key={answer.id} className="mt-4 border-s-2 border-primary bg-secondary/50 p-4 text-sm text-muted-foreground">{answer.text}</div>)}<div className="mt-5 flex gap-2"><Input value={reply[question.id] ?? ""} onChange={(event) => setReply({ ...reply, [question.id]: event.target.value })} placeholder={copy.reply} aria-label={copy.reply} /><Button size="icon" onClick={() => sendReply(question.id)} disabled={!reply[question.id]?.trim()} aria-label={copy.send}><Send /></Button></div></CardContent></Card>)}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({ props: { ...(await serverSideTranslations(locale ?? "en", ["common"])) } })
