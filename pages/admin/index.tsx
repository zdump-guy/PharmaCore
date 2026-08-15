import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { Course, Lecture, Quiz, CommunityQuestion, UserProfile, UserRole } from '@/types';

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
export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('courses');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setUser(session.user);
      // Fetch profile
      supabase.from('users').select('*').eq('id', session.user.id).single().then(({ data }) => {
        setProfile(data);
        setAuthChecked(true);
      });
    });
  }, []);

  if (!authChecked) {
    return (
      <ThemeProvider>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="loading-state"><div className="spinner" /></div>
        </div>
      </ThemeProvider>
    );
  }

  const userRole = (profile?.role ?? 'mentor') as UserRole;
  const userId = user?.id ?? '';

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
        </div>
        {renderTab()}
      </AdminLayout>
    </ThemeProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
