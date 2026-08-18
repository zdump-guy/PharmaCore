import { useState } from "react"
import { useRouter } from "next/router"
import {
  FiCheckCircle as CheckCircle2,
  FiKey as KeyRound,
  FiLoader as Loader2,
  FiMail as Mail,
  FiPhone as Phone,
  FiUser as User,
} from "react-icons/fi"
import { FaGraduationCap as GraduationCap } from "react-icons/fa6"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { University, Faculty } from "@/types"

interface StudentSetupModalProps {
  open: boolean
  userEmail?: string
  token?: string
  universities: University[]
  faculties: Faculty[]
  onSuccess: () => void
}

export default function StudentSetupModal({
  open,
  userEmail = "",
  token,
  universities,
  faculties,
  onSuccess,
}: StudentSetupModalProps) {
  const { locale } = useRouter()
  const isAr = locale === "ar"

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState(userEmail)
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [university, setUniversity] = useState("")
  const [faculty, setFaculty] = useState("")
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear() - 1)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Auto-calculated graduation year
  const selectedFacultyObj = faculties.find(
    (f) => f.name_en === faculty || f.name_ar === faculty || f.id === faculty
  )
  const duration = selectedFacultyObj?.duration_years || 5
  const predictedGraduationYear = Number(startYear) + duration

  // Auto-calculated academic year
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const yearIndex = currentYear - Number(startYear) + (currentMonth >= 9 ? 1 : 0)
  let academicLevelText = isAr ? `السنة ${Math.max(1, yearIndex)}` : `Year ${Math.max(1, yearIndex)}`
  if (yearIndex >= duration) {
    academicLevelText = isAr ? "سنة التخرج (السنة الأخيرة)" : `Final Year (Year ${duration})`
  }
  if (yearIndex > duration) {
    academicLevelText = isAr ? "خريج" : "Graduate"
  }

  const copy = isAr
    ? {
        title: "تفعيل الحساب واستكمال البيانات",
        desc: "هذا الحساب تم إنشاؤه مسبقًا من قِبل الإدارة. يُرجى تحديث بياناتك الشخصية وتعيين بريدك وكلمة المرور الخاصة بك للمتابعة.",
        firstName: "الاسم الأول",
        lastName: "اسم العائلة / اللقب",
        email: "بريدك الإلكتروني الشخصي",
        password: "كلمة مرور جديدة",
        phone: "رقم الهاتف / واتساب",
        uni: "الجامعة",
        selectUni: "اختر جامعتك",
        faculty: "الكلية / البرنامج الدراسي",
        selectFaculty: "اختر كليتك",
        startYear: "سنة بدء الدراسة بالكلية",
        gradYear: "سنة التخرج المتوقعة",
        academicLevel: "المستوى الدراسي الحالي",
        submit: "حفظ وتفعيل الحساب",
        submitting: "جارٍ حفظ البيانات...",
      }
    : {
        title: "Account Activation & Profile Setup",
        desc: "This temporary account was provisioned by the administration. Please customize your profile, personal email, and choose a private password to continue.",
        firstName: "First name",
        lastName: "Last name",
        email: "Personal email address",
        password: "New private password",
        phone: "Phone / WhatsApp number",
        uni: "University",
        selectUni: "Select your university",
        faculty: "Faculty / Program",
        selectFaculty: "Select your faculty",
        startYear: "Starting academic year",
        gradYear: "Predicted graduation year",
        academicLevel: "Current academic level",
        submit: "Activate & Save Profile",
        submitting: "Saving details...",
      }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || password.length < 6) {
      setErrorMsg(
        isAr
          ? "يرجى ملء جميع الحقول المطلوبة والتأكد من أن كلمة المرور لا تقل عن 6 أحرف."
          : "Please fill in all required fields and ensure password is at least 6 characters."
      )
      return
    }

    setSaving(true)
    setErrorMsg("")

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) headers["Authorization"] = `Bearer ${token}`

      const res = await fetch("/api/students/profile", {
        method: "POST",
        headers,
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          phone_number: phone,
          university,
          faculty,
          start_year: startYear,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      onSuccess()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving profile")
    } finally {
      setSaving(false)
    }
  }

  const startYears = []
  const nowYear = new Date().getFullYear()
  for (let y = nowYear + 1; y >= nowYear - 8; y--) {
    startYears.push(y)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <GraduationCap className="size-4" />
            <span>PharmaCore Student</span>
          </div>
          <DialogTitle className="text-2xl font-extrabold">{copy.title}</DialogTitle>
          <DialogDescription className="text-sm">{copy.desc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="setup-firstname">{copy.firstName} *</Label>
              <div className="relative">
                <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="setup-firstname"
                  className="ps-9"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={isAr ? "أحمد" : "Ahmed"}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-lastname">{copy.lastName} *</Label>
              <div className="relative">
                <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="setup-lastname"
                  className="ps-9"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isAr ? "علي" : "Ali"}
                  required
                />
              </div>
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="setup-email">{copy.email} *</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="setup-email"
                  type="email"
                  className="ps-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-password">{copy.password} *</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="setup-password"
                  type="password"
                  className="ps-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="setup-phone">{copy.phone}</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="setup-phone"
                type="tel"
                className="ps-9"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 100 000 0000"
              />
            </div>
          </div>

          {/* University & Faculty */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{copy.uni} *</Label>
              <Select value={university} onValueChange={setUniversity}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.selectUni} />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={isAr ? u.name_ar : u.name_en}>
                      {isAr ? u.name_ar : u.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{copy.faculty} *</Label>
              <Select value={faculty} onValueChange={setFaculty}>
                <SelectTrigger>
                  <SelectValue placeholder={copy.selectFaculty} />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={isAr ? f.name_ar : f.name_en}>
                      {isAr ? f.name_ar : f.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Starting Year & Live Academic Level Display */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{copy.startYear}</Label>
              <Select value={String(startYear)} onValueChange={(val) => setStartYear(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {startYears.map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 flex flex-col justify-center">
              <span className="text-xs text-muted-foreground font-medium">{copy.academicLevel}</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{academicLevelText}</span>
                <span className="text-xs text-muted-foreground">({copy.gradYear}: {predictedGraduationYear})</span>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-4" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {saving ? copy.submitting : copy.submit}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
