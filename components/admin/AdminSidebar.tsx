import React from "react"
import {
  FiActivity as Activity,
  FiBookOpen as BookOpen,
  FiChevronLeft as ChevronLeft,
  FiChevronRight as ChevronRight,
  FiClock as Clock,
  FiFileText as FileText,
  FiFolder as Folder,
  FiHelpCircle as HelpCircle,
  FiInbox as Inbox,
  FiLock as LockKeyhole,
  FiLogOut as LogOut,
  FiServer as Server,
  FiShield as ShieldCheck,
  FiTerminal as Terminal,
  FiType as TypeIcon,
  FiUserPlus as UserPlus,
  FiUsers as UsersIcon,
  FiVideo as FileVideo,
  FiX as X,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import BrandMark from "@/components/BrandMark"
import { Button } from "@/components/ui/button"
import type { UserProfile } from "@/types"

export interface NavItem {
  id: string
  page: string
  subpage?: string
  label_en: string
  label_ar: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number | null
  badgeColor?: string
  roleRequired?: "dev" | "super_admin" | "mentor"
}

export interface NavCategory {
  id: string
  label_en: string
  label_ar: string
  items: NavItem[]
}

interface AdminSidebarProps {
  isAr: boolean
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  activePage: string
  activeSubpage?: string
  onSelectNav: (page: string, subpage?: string) => void
  profile: UserProfile | null
  unansweredCount: number
  pendingStudentsCount: number
  pendingEnrollmentsCount?: number
  openFeedbackCount?: number
  canManageUsers: boolean
  isDev: boolean
  onLogout: () => void
}

export default function AdminSidebar({
  isAr,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  activePage,
  activeSubpage,
  onSelectNav,
  profile,
  unansweredCount,
  pendingStudentsCount,
  pendingEnrollmentsCount = 0,
  openFeedbackCount = 0,
  canManageUsers,
  isDev,
  onLogout,
}: AdminSidebarProps) {
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const CollapseIcon = isAr
    ? collapsed
      ? ChevronLeft
      : ChevronRight
    : collapsed
    ? ChevronRight
    : ChevronLeft

  const categories: NavCategory[] = [
    {
      id: "analytics_cat",
      label_en: "Insights & Telemetry",
      label_ar: "التحليلات والمؤشرات",
      items: [
        {
          id: "analytics",
          page: "analytics",
          label_en: "Analytics & Telemetry",
          label_ar: "لوحة التحليلات والمؤشرات",
          icon: Activity,
        },
      ],
    },
    {
      id: "curriculum_cat",
      label_en: "Academic Curriculum",
      label_ar: "المناهج والمساقات",
      items: [
        {
          id: "curriculum:courses",
          page: "curriculum",
          subpage: "courses",
          label_en: "Courses Library",
          label_ar: "المقررات الدراسية",
          icon: BookOpen,
        },
        {
          id: "curriculum:enrollments",
          page: "curriculum",
          subpage: "enrollments",
          label_en: "Course Enrollments",
          label_ar: "تسجيلات المقررات والطلبات",
          icon: ShieldCheck,
          badge: pendingEnrollmentsCount > 0 ? pendingEnrollmentsCount : null,
          badgeColor: "bg-amber-500 text-white",
        },
        {
          id: "curriculum:lectures",
          page: "curriculum",
          subpage: "lectures",
          label_en: "Video Lectures",
          label_ar: "محاضرات الفيديو",
          icon: FileVideo,
        },
        {
          id: "curriculum:quizzes",
          page: "curriculum",
          subpage: "quizzes",
          label_en: "Quizzes & Questions",
          label_ar: "الاختبارات والأسئلة",
          icon: FileText,
        },
        {
          id: "curriculum:resources",
          page: "curriculum",
          subpage: "resources",
          label_en: "Resources & Documents",
          label_ar: "المراجع والملفات",
          icon: Folder,
        },
      ],
    },
    {
      id: "students_cat",
      label_en: "Student Affairs",
      label_ar: "شؤون الطلاب والتسجيل",
      items: [
        {
          id: "students:roster",
          page: "students",
          subpage: "roster",
          label_en: "Students Roster",
          label_ar: "سجل الطلاب المسجلين",
          icon: UsersIcon,
        },
        {
          id: "students:pending",
          page: "students",
          subpage: "pending",
          label_en: "Pending Approvals",
          label_ar: "طلبات الاعتماد",
          icon: Clock,
          badge: pendingStudentsCount > 0 ? pendingStudentsCount : null,
          badgeColor: "bg-amber-500 text-white",
        },
        {
          id: "students:provision",
          page: "students",
          subpage: "provision",
          label_en: "Account Generator",
          label_ar: "توليد الحسابات (دفعات)",
          icon: UserPlus,
          badge: "Batch",
          badgeColor: "bg-primary/20 text-primary border border-primary/30",
        },
        {
          id: "students:controller",
          page: "students",
          subpage: "controller",
          label_en: "Signup Controller",
          label_ar: "إعدادات وقواعد التسجيل",
          icon: LockKeyhole,
        },
        {
          id: "students:directories",
          page: "students",
          subpage: "directories",
          label_en: "Universities & Faculties",
          label_ar: "الجامعات والكليات",
          icon: GraduationCap,
        },
      ],
    },
    {
      id: "community_cat",
      label_en: "Interaction & Q&A",
      label_ar: "التفاعل والدعم",
      items: [
        {
          id: "qa",
          page: "qa",
          label_en: "Community Q&A",
          label_ar: "نقاشات واستفسارات الطلاب",
          icon: HelpCircle,
          badge: unansweredCount > 0 ? unansweredCount : null,
          badgeColor: "bg-rose-500 text-white animate-pulse",
        },
        {
          id: "feedback",
          page: "feedback",
          label_en: "Feedback & Bug Reports",
          label_ar: "الملاحظات وبلاغات الأخطاء",
          icon: Inbox,
          badge: openFeedbackCount > 0 ? openFeedbackCount : null,
          badgeColor: "bg-amber-500 text-white",
        },
      ],
    },
    {
      id: "governance_cat",
      label_en: "System & Access",
      label_ar: "إدارة النظام والصلاحيات",
      items: [
        ...(canManageUsers
          ? [
              {
                id: "users",
                page: "users",
                label_en: "Staff & Faculty Access",
                label_ar: "الكادر الإداري والتدريسي",
                icon: ShieldCheck,
                roleRequired: "super_admin" as const,
              },
            ]
          : []),
        ...(isDev
          ? [
              {
                id: "content",
                page: "content",
                label_en: "Site CMS & Branding",
                label_ar: "محتوى ونصوص المنصة",
                icon: TypeIcon,
                roleRequired: "dev" as const,
              },
            ]
          : []),
      ],
    },
    ...(isDev
      ? [
          {
            id: "dev_cat",
            label_en: "Developer Console",
            label_ar: "بوابة المطورين والتحكم",
            items: [
              {
                id: "dev:logs",
                page: "dev",
                subpage: "logs",
                label_en: "Live Tracking Logs",
                label_ar: "سجل التتبع المباشر",
                icon: Terminal,
                roleRequired: "dev" as const,
              },
              {
                id: "dev:system",
                page: "dev",
                subpage: "system",
                label_en: "System Telemetry & Health",
                label_ar: "فحص النظام والبيئة",
                icon: Server,
                roleRequired: "dev" as const,
              },
              {
                id: "dev:maintenance",
                page: "dev",
                subpage: "maintenance",
                label_en: "Maintenance Mode",
                label_ar: "وضع الصيانة والتحديث",
                icon: LockKeyhole,
                roleRequired: "dev" as const,
              },
            ],
          },
        ]
      : []),
  ]

  const isItemActive = (item: NavItem) => {
    if (activePage !== item.page) return false
    if (item.subpage) {
      return activeSubpage === item.subpage
    }
    return true
  }

  const handleItemClick = (item: NavItem) => {
    onSelectNav(item.page, item.subpage)
    setMobileOpen(false)
  }

  const roleLabels: Record<string, { en: string; ar: string; color: string }> = {
    dev: {
      en: "Developer",
      ar: "مطور",
      color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    super_admin: {
      en: "Super Admin",
      ar: "مشرف عام",
      color: "bg-primary/15 text-primary border-primary/30",
    },
    mentor: {
      en: "Mentor",
      ar: "مرشد أكاديمي",
      color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
  }

  const roleMeta = profile?.role ? roleLabels[profile.role] : null

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col border-e bg-card transition-all duration-300 ease-in-out ${
          isAr ? "right-0 border-l" : "left-0 border-r"
        } ${
          mobileOpen
            ? "translate-x-0 w-72 shadow-2xl"
            : isAr
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-64 xl:w-72"}`}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Brand & Toggle Header */}
        <div
          className={`flex h-16 items-center border-b bg-card/60 backdrop-blur-md shrink-0 transition-all ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="size-11 rounded-2xl text-primary hover:bg-primary/10 transition-transform hover:scale-105"
              title={tr("Expand sidebar", "توسيع القائمة")}
            >
              <BrandMark className="size-7" />
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <BrandMark className="size-8 shrink-0 text-primary" />
                <div className="min-w-0">
                  <span className="text-sm font-black tracking-tight block truncate">
                    Pharma<span className="text-primary">Core</span>
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block -mt-0.5">
                    {tr("Admin Workspace", "بوابة الإدارة")}
                  </span>
                </div>
              </div>

              {/* Desktop Collapse Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                className="hidden lg:flex size-8 rounded-xl text-muted-foreground hover:text-foreground"
                title={tr("Collapse sidebar", "طي القائمة")}
              >
                <CollapseIcon className="size-4" />
              </Button>

              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="flex lg:hidden size-8 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </>
          )}
        </div>

        {/* Navigation Scrollable Body */}
        <div
          className={`flex-1 overflow-y-auto py-4 space-y-5 custom-scrollbar ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          {categories.map((category) => {
            if (!category.items.length) return null
            return (
              <div key={category.id} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 mb-1.5 select-none truncate">
                    {isAr ? category.label_ar : category.label_en}
                  </p>
                ) : (
                  <div className="w-8 h-px bg-border/60 mx-auto my-2.5" />
                )}

                <div className="space-y-1">
                  {category.items.map((item) => {
                    const active = isItemActive(item)
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`w-full group relative flex items-center rounded-xl text-xs font-bold transition-all ${
                          collapsed
                            ? "justify-center size-11 mx-auto"
                            : "justify-between px-3 py-2.5"
                        } ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                        title={isAr ? item.label_ar : item.label_en}
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-lg transition-colors ${
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "text-foreground group-hover:text-primary"
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>

                        {collapsed && item.badge !== undefined && item.badge !== null && (
                          <span className="absolute top-1.5 end-1.5 flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-rose-500"></span>
                          </span>
                        )}

                        {!collapsed && (
                          <span className="truncate text-start flex-1 ms-2.5 whitespace-nowrap">
                            {isAr ? item.label_ar : item.label_en}
                          </span>
                        )}

                        {!collapsed && item.badge !== undefined && item.badge !== null && (
                          <span
                            className={`badge-nowrap px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ms-2 ${
                              item.badgeColor || "bg-primary/20 text-primary"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer User Pill & Quick Exit */}
        <div
          className={`border-t bg-muted/20 shrink-0 ${
            collapsed ? "p-2 flex flex-col items-center gap-2" : "p-3 space-y-2"
          }`}
        >
          {!collapsed ? (
            <div className="rounded-xl border bg-card p-2.5 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  {profile?.full_name?.charAt(0) || "A"}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">
                    {profile?.full_name || "Admin User"}
                  </p>
                  {roleMeta && (
                    <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm border bg-muted/40 text-muted-foreground">
                      {isAr ? roleMeta.ar : roleMeta.en}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                title={tr("Sign Out", "تسجيل الخروج")}
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <span
                className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-xs shadow-2xs"
                title={profile?.full_name || "Admin"}
              >
                {profile?.full_name?.charAt(0) || "A"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="size-10 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title={tr("Sign Out", "تسجيل الخروج")}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
