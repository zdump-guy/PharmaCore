import { useState } from "react"
import {
  FiCheckCircle as ActivateIcon,
  FiClock as ClockIcon,
  FiEdit2 as Pencil,
  FiLoader as Loader2,
  FiPlus as Plus,
  FiRefreshCw as RefreshCw,
  FiSearch as Search,
  FiShield as ShieldCheck,
  FiSlash as SuspendIcon,
  FiTrash2 as Trash2,
  FiUserPlus as UserPlus,
  FiUsers as UsersIcon,
  FiX as X,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { UserProfile, UserRole } from "@/types"

export type ManagedUser = UserProfile & {
  last_sign_in_at: string | null
  banned_until: string | null
}

export type UserForm = {
  full_name: string
  email: string
  password: string
  role: UserRole
}

interface UserManagerProps {
  isAr: boolean
  searchQuery: string
  profile: UserProfile | null
  managedUsers: ManagedUser[]
  loadingUsers: boolean
  creatingUser: boolean
  userActionId: string | null
  userForm: UserForm
  setUserForm: React.Dispatch<React.SetStateAction<UserForm>>
  onLoadUsers: () => void
  onCreateUser: (e: React.FormEvent) => void
  onOpenEditUser: (user: ManagedUser) => void
  onToggleSuspendUser: (user: ManagedUser) => void
  onOpenDeleteUser: (user: ManagedUser) => void
}

export default function UserManager({
  isAr,
  searchQuery,
  profile,
  managedUsers,
  loadingUsers,
  creatingUser,
  userActionId,
  userForm,
  setUserForm,
  onLoadUsers,
  onCreateUser,
  onOpenEditUser,
  onToggleSuspendUser,
  onOpenDeleteUser,
}: UserManagerProps) {
  const [localSearch, setLocalSearch] = useState("")
  const tr = (en: string, ar: string) => (isAr ? ar : en)
  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase()

  const userIsSuspended = (user: ManagedUser) =>
    !!user.banned_until && new Date(user.banned_until).getTime() > Date.now()

  const staffUsers = managedUsers.filter((u) => ["dev", "super_admin", "mentor"].includes(u.role))
  const mentorsCount = staffUsers.filter((u) => u.role === "mentor").length
  const superAdminsCount = staffUsers.filter((u) => u.role === "super_admin").length
  const devsCount = staffUsers.filter((u) => u.role === "dev").length
  const suspendedCount = staffUsers.filter(userIsSuspended).length

  const filteredUsers = staffUsers.filter((u) => {
    if (!effectiveSearch) return true
    return (
      (u.full_name || "").toLowerCase().includes(effectiveSearch) ||
      u.email.toLowerCase().includes(effectiveSearch) ||
      u.role.toLowerCase().includes(effectiveSearch)
    )
  })

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* Top Header & Role Metric Summary */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="size-10 grid place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <UsersIcon className="size-5" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-foreground">{tr("Team & Administrative Access", "فريق العمل وإدارة الصلاحيات")}</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tr(
              "Provision accounts, assign roles (Developer, Super Admin, Mentor), and manage permissions.",
              "إنشاء الحسابات، وتحديد الأدوار (مطور، مشرف عام، مرشد)، وإدارة صلاحيات الفريق."
            )}
          </p>
        </div>

        {/* Quick Role Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold">
            <span className="size-2 rounded-full bg-purple-500 shrink-0" />
            <span>{devsCount} {tr("Devs", "مطورين")}</span>
          </Badge>
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3 bg-primary/10 text-primary border-primary/30 font-bold">
            <span className="size-2 rounded-full bg-primary shrink-0" />
            <span>{superAdminsCount} {tr("Super Admins", "مشرفين عامين")}</span>
          </Badge>
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{mentorsCount} {tr("Mentors", "مرشدين")}</span>
          </Badge>
          {suspendedCount > 0 && (
            <Badge variant="destructive" className="text-xs gap-1.5 py-1 px-3 font-bold">
              <span>{suspendedCount} {tr("Suspended", "موقوف")}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* 2-Column Layout: Create User Form + User Directory */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.3fr)]">
        {/* Create User Form */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-7 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="size-9 grid place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="size-4" />
                </div>
                <h4 className="font-black text-base text-foreground">{tr("Add Staff Member", "إضافة عضو جديد")}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tr(
                  "Create credentials for immediate access to dashboard tools.",
                  "إنشاء حساب بصلاحيات محددة للوصول الفوري إلى لوحة التحكم."
                )}
              </p>
            </div>

            <form onSubmit={onCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-user-name" className="text-xs font-bold text-foreground">
                  {tr("Full Name", "الاسم الكامل")}
                </Label>
                <Input
                  id="new-user-name"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder={tr("e.g. Dr. Sarah Ahmed", "مثال: د. سارة أحمد")}
                  autoComplete="name"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-email" className="text-xs font-bold text-foreground">
                  {tr("Email Address", "البريد الإلكتروني")}
                </Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="mentor@pharmacore.com"
                  autoComplete="email"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-password" className="text-xs font-bold text-foreground">
                  {tr("Temporary Password", "كلمة المرور المؤقتة")}
                </Label>
                <Input
                  id="new-user-password"
                  type="password"
                  minLength={8}
                  value={userForm.password}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="rounded-xl h-11 border-border/80 bg-background/60 text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {tr("Minimum 8 characters. Share securely with staff.", "٨ أحرف على الأقل. شاركها بأمان.")}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">{tr("Role & Access Level", "الدور ومستوى الصلاحيات")}</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(role) => setUserForm((prev) => ({ ...prev, role: role as UserRole }))}
                >
                  <SelectTrigger className="rounded-xl h-11 border-border/80 bg-background/60 text-xs">
                    <SelectValue placeholder={tr("Select role", "اختر الدور")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="mentor">
                      {tr("Mentor (Courses, Quizzes, Q&A)", "مرشد (المناهج والاختبارات والأسئلة)")}
                    </SelectItem>
                    <SelectItem value="super_admin">
                      {tr("Super Admin (Full management + Users)", "مشرف عام (إدارة كاملة + المستخدمين)")}
                    </SelectItem>
                    <SelectItem value="dev">
                      {tr("Developer (Full system + Site CMS)", "مطور (النظام بالكامل + نصوص الموقع)")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 font-bold text-xs h-11 rounded-full shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 mt-2"
                disabled={creatingUser}
              >
                {creatingUser ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                <span>{creatingUser ? tr("Creating account...", "جارٍ إنشاء الحساب...") : tr("Create Staff Account", "إنشاء الحساب")}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Directory List */}
        <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm min-w-0">
          <CardContent className="p-6 sm:p-7 space-y-5">
            <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-foreground">{tr("Staff Directory", "دليل أعضاء الفريق")}</h4>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {managedUsers.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-48">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={tr("Filter staff...", "بحث في الكادر...")}
                    className="h-9 ps-9 pe-7 rounded-xl text-xs bg-background/60"
                  />
                  {localSearch && (
                    <button
                      onClick={() => setLocalSearch("")}
                      className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 rounded-xl shrink-0"
                  onClick={onLoadUsers}
                  disabled={loadingUsers}
                  title={tr("Refresh users list", "تحديث قائمة المستخدمين")}
                >
                  <RefreshCw className={`size-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Users list */}
            <div className="space-y-3">
              {loadingUsers && !managedUsers.length ? (
                <div className="grid min-h-40 place-items-center">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const suspended = userIsSuspended(user)
                  const isCurrent = user.id === profile?.id
                  const isBusy = userActionId === user.id

                  const roleBadgeColor =
                    user.role === "dev"
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                      : user.role === "super_admin"
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"

                  return (
                    <div
                      key={user.id}
                      className={`rounded-2xl border p-4 space-y-3 transition-all ${
                        suspended ? "bg-destructive/5 border-destructive/20" : "bg-card/95 border-border/80 hover:border-primary/40 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="size-10 ring-2 ring-primary/20 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-black text-sm uppercase">
                            {user.full_name ? user.full_name[0] : "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-sm text-foreground truncate">
                              {user.full_name || tr("Unnamed staff", "عضو بدون اسم")}
                            </p>
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30 shrink-0 font-bold">
                                <span>{tr("You", "أنت")}</span>
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-[10px] capitalize shrink-0 font-bold ${roleBadgeColor}`}>
                              <ShieldCheck className="size-3 me-1 shrink-0" />
                              <span>{user.role.replace("_", " ")}</span>
                            </Badge>
                            <Badge
                              variant={suspended ? "destructive" : "secondary"}
                              className="text-[10px] shrink-0 font-bold"
                            >
                              <span>{suspended ? tr("Suspended", "موقوف") : tr("Active", "نشط")}</span>
                            </Badge>
                          </div>

                          <p className="font-mono text-xs text-muted-foreground truncate">{user.email}</p>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <ClockIcon className="size-3 shrink-0" />
                              <span>{tr("Joined:", "انضم:")}{" "}
                              {new Date(user.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</span>
                            </span>
                            {user.last_sign_in_at && (
                              <span className="whitespace-nowrap">
                                {tr("Last active:", "آخر نشاط:")}{" "}
                                {new Date(user.last_sign_in_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-border/60">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-bold gap-1 px-3 rounded-full hover:bg-muted"
                          onClick={() => onOpenEditUser(user)}
                          disabled={isBusy}
                        >
                          <Pencil className="size-3 shrink-0" />
                          <span>{tr("Edit", "تعديل")}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 text-xs font-bold gap-1 px-3 rounded-full hover:bg-muted ${
                            suspended ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                          }`}
                          onClick={() => onToggleSuspendUser(user)}
                          disabled={isBusy || isCurrent}
                        >
                          {suspended ? <ActivateIcon className="size-3 shrink-0" /> : <SuspendIcon className="size-3 shrink-0" />}
                          <span>{suspended ? tr("Restore Access", "تفعيل") : tr("Suspend Access", "إيقاف")}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-bold gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive ms-auto px-3 rounded-full"
                          onClick={() => onOpenDeleteUser(user)}
                          disabled={isBusy || isCurrent}
                        >
                          <Trash2 className="size-3 shrink-0" />
                          <span>{tr("Delete", "حذف")}</span>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}

              {!loadingUsers && !filteredUsers.length && (
                <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-border/80 p-6 text-center text-muted-foreground">
                  <div>
                    <UsersIcon className="mx-auto size-7 opacity-40" />
                    <p className="mt-2 text-xs font-bold">{tr("No staff accounts match the filter.", "لا يوجد مستخدمون يطابقون البحث.")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
