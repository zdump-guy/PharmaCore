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
  FiUser as UserIcon,
  FiUserPlus as UserPlus,
  FiUsers as UsersIcon,
} from "react-icons/fi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  const mentorsCount = managedUsers.filter((u) => u.role === "mentor").length
  const superAdminsCount = managedUsers.filter((u) => u.role === "super_admin").length
  const devsCount = managedUsers.filter((u) => u.role === "dev").length
  const suspendedCount = managedUsers.filter(userIsSuspended).length

  const filteredUsers = managedUsers.filter((u) => {
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
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight">{tr("Team & Administrative Access", "فريق العمل وإدارة الصلاحيات")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {tr(
              "Provision accounts, assign roles (Developer, Super Admin, Mentor), and manage permissions.",
              "إنشاء الحسابات، وتحديد الأدوار (مطور، مشرف عام، مرشد)، وإدارة صلاحيات الفريق."
            )}
          </p>
        </div>

        {/* Quick Role Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge variant="outline" className="text-xs gap-1.5 py-1">
            <span className="size-2 rounded-full bg-purple-500" />
            {devsCount} {tr("Devs", "مطورين")}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1.5 py-1">
            <span className="size-2 rounded-full bg-primary" />
            {superAdminsCount} {tr("Super Admins", "مشرفين عامين")}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1.5 py-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            {mentorsCount} {tr("Mentors", "مرشدين")}
          </Badge>
          {suspendedCount > 0 && (
            <Badge variant="destructive" className="text-xs gap-1.5 py-1">
              {suspendedCount} {tr("Suspended", "موقوف")}
            </Badge>
          )}
        </div>
      </div>

      {/* 2-Column Layout: Create User Form + User Directory */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.35fr)]">
        {/* Create User Form */}
        <Card className="shadow-none border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="size-4" />
                </span>
                <h4 className="font-bold text-base">{tr("Add Staff Member", "إضافة عضو جديد")}</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                {tr(
                  "Create credentials for immediate access to dashboard tools.",
                  "إنشاء حساب بصلاحيات محددة للوصول الفوري إلى لوحة التحكم."
                )}
              </p>
            </div>

            <form onSubmit={onCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-user-name" className="text-xs font-semibold">
                  {tr("Full Name", "الاسم الكامل")}
                </Label>
                <Input
                  id="new-user-name"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder={tr("e.g. Dr. Sarah Ahmed", "مثال: د. سارة أحمد")}
                  autoComplete="name"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-email" className="text-xs font-semibold">
                  {tr("Email Address", "البريد الإلكتروني")}
                </Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="mentor@pharmacore.com"
                  autoComplete="email"
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-user-password" className="text-xs font-semibold">
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
                  className="text-sm sm:text-xs min-h-[40px] sm:min-h-[36px]"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {tr("Minimum 8 characters. Share securely with staff.", "٨ أحرف على الأقل. شاركها بأمان.")}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{tr("Role & Access Level", "الدور ومستوى الصلاحيات")}</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(role) => setUserForm((prev) => ({ ...prev, role: role as UserRole }))}
                >
                  <SelectTrigger className="text-xs min-h-[40px] sm:min-h-[36px]">
                    <SelectValue placeholder={tr("Select role", "اختر الدور")} />
                  </SelectTrigger>
                  <SelectContent>
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
                className="w-full gap-2 font-bold text-xs min-h-[40px] sm:min-h-[36px]"
                disabled={creatingUser}
              >
                {creatingUser ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                {creatingUser ? tr("Creating account...", "جارٍ إنشاء الحساب...") : tr("Create Staff Account", "إنشاء الحساب")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Directory List */}
        <Card className="shadow-none min-w-0">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base">{tr("Staff Directory", "دليل أعضاء الفريق")}</h4>
                <Badge variant="secondary" className="text-xs">
                  {managedUsers.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-40">
                  <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={tr("Filter...", "بحث...")}
                    className="h-9 sm:h-8 ps-7 pe-2 text-xs w-full"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 sm:size-8 shrink-0"
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
                      className={`rounded-xl border p-3.5 sm:p-4 space-y-3 transition-colors ${
                        suspended ? "bg-destructive/5 border-destructive/20" : "bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-9 sm:size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary font-bold text-sm">
                          <UserIcon className="size-4" />
                        </span>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <p className="font-extrabold text-sm text-foreground truncate">
                              {user.full_name || tr("Unnamed staff", "عضو بدون اسم")}
                            </p>
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30">
                                {tr("You", "أنت")}
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-[10px] capitalize ${roleBadgeColor}`}>
                              <ShieldCheck className="size-3 me-1" />
                              {user.role.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant={suspended ? "destructive" : "secondary"}
                              className="text-[10px]"
                            >
                              {suspended ? tr("Suspended", "موقوف") : tr("Active", "نشط")}
                            </Badge>
                          </div>

                          <p className="font-mono text-xs text-muted-foreground truncate">{user.email}</p>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="size-3" />
                              {tr("Joined:", "انضم:")}{" "}
                              {new Date(user.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                            </span>
                            {user.last_sign_in_at && (
                              <span>
                                {tr("Last active:", "آخر نشاط:")}{" "}
                                {new Date(user.last_sign_in_at).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-semibold gap-1 px-2.5"
                          onClick={() => onOpenEditUser(user)}
                          disabled={isBusy}
                        >
                          <Pencil className="size-3" />
                          {tr("Edit", "تعديل")}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 text-xs font-semibold gap-1 px-2.5 ${
                            suspended ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                          }`}
                          onClick={() => onToggleSuspendUser(user)}
                          disabled={isBusy || isCurrent}
                        >
                          {suspended ? <ActivateIcon className="size-3" /> : <SuspendIcon className="size-3" />}
                          {suspended ? tr("Restore Access", "تفعيل") : tr("Suspend Access", "إيقاف")}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-semibold gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive ms-auto px-2.5"
                          onClick={() => onOpenDeleteUser(user)}
                          disabled={isBusy || isCurrent}
                        >
                          <Trash2 className="size-3" />
                          {tr("Delete", "حذف")}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}

              {!loadingUsers && !filteredUsers.length && (
                <div className="grid min-h-32 place-items-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                  <div>
                    <UsersIcon className="mx-auto size-6 opacity-40" />
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
