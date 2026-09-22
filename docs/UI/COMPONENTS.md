# Component Catalog & UI Primitives (33+ Components)

## 1. UI Primitives (`components/ui/` — 19 Components)

| Component | Source File | Base Primitive | Description |
|---|---|---|---|
| `Accordion` | `components/ui/accordion.tsx` | `@radix-ui/react-accordion` | Accessible collapsible panels with animated chevron. |
| `Alert` | `components/ui/alert.tsx` | Native HTML / CVA | Callout banner for error, warning, and success notices. |
| `Badge` | `components/ui/badge.tsx` | CVA / Tailwind | Status badges (`pending`, `active`, `rejected`, `open`, `resolved`). |
| `Button` | `components/ui/button.tsx` | `@radix-ui/react-slot` / CVA | Multi-variant buttons (`default`, `outline`, `secondary`, `ghost`, `destructive`). |
| `Card` | `components/ui/card.tsx` | HTML div / Tailwind | Surface container with Header, Title, Description, and Content. |
| `CustomAudioPlayer` | `components/ui/custom-audio-player.tsx` | HTML5 Audio | Full-featured audio player for lecture voice notes with scrub bar & speed control. |
| `Dialog` | `components/ui/dialog.tsx` | `@radix-ui/react-dialog` | Accessible modal dialog with overlay, title, and close button. |
| `FileUploader` | `components/ui/file-uploader.tsx` | `@uploadthing/react` | Drag-and-drop file upload zone with upload progress feedback. |
| `ImagePreviewModal` | `components/ui/image-preview-modal.tsx` | `@radix-ui/react-dialog` | Lightbox modal for previewing high-resolution lecture diagrams. |
| `Input` | `components/ui/input.tsx` | HTML input | Styled text input with error states and focus rings. |
| `Label` | `components/ui/label.tsx` | `@radix-ui/react-label` | Accessible form label with required indicator support. |
| `MediaActionCard` | `components/ui/media-action-card.tsx` | HTML div | Card component for external links (Google Drive, PDFs). |
| `PdfPreviewModal` | `components/ui/pdf-preview-modal.tsx` | `@radix-ui/react-dialog` | Modal viewer for embedded PDF viewing with new tab fallback. |
| `Progress` | `components/ui/progress.tsx` | `@radix-ui/react-progress` | Animated horizontal progress bar. |
| `Select` | `components/ui/select.tsx` | `@radix-ui/react-select` | Accessible dropdown menu with keyboard navigation. |
| `Separator` | `components/ui/separator.tsx` | `@radix-ui/react-separator` | Accessible horizontal/vertical dividing line. |
| `Sheet` | `components/ui/sheet.tsx` | `@radix-ui/react-dialog` | Slide-over drawer panel for mobile navigation menus. |
| `Skeleton` | `components/ui/skeleton.tsx` | HTML div | Animated pulsing placeholder for asynchronous content loading. |
| `Tabs` | `components/ui/tabs.tsx` | `@radix-ui/react-tabs` | Accessible tab navigation with responsive list wrapping. |
| `Textarea` | `components/ui/textarea.tsx` | HTML textarea | Multi-line text field with auto-resize capability. |

---

## 2. Administrative Modules (`components/admin/` — 14 Modules)

| Module | Source File | Target Tab | Responsibility |
|---|---|---|---|
| `CurriculumManager` | `components/admin/CurriculumManager.tsx` | Curriculum | Full CRUD for courses, lectures, quizzes, and resources. |
| `CourseEnrollmentManager` | `components/admin/CourseEnrollmentManager.tsx` | Enrollments | Approve, reject, and inspect student cohort access requests. |
| `StudentManager` | `components/admin/StudentManager.tsx` | Students | Student directory, university analytics, and status updates. |
| `UserManager` | `components/admin/UserManager.tsx` | Users | Staff account creation and mentor course assignment. |
| `CommunityManager` | `components/admin/CommunityManager.tsx` | Community | Global Q&A moderation and answer authoring. |
| `FeedbackManager` | `components/admin/FeedbackManager.tsx` | Feedback | Triage dashboard for technical bug reports and academic suggestions. |
| `SiteContentManager` | `components/admin/SiteContentManager.tsx` | Site Content | CMS editor for modifying public landing page copy and FAQs. |
| `AnalyticsDashboard` | `components/admin/AnalyticsDashboard.tsx` | Analytics | Visitor trends, completion rates, and event graphs. |
| `DeveloperConsole` | `components/admin/DeveloperConsole.tsx` | Dev Console | System health diagnostics, latency monitor, rate limit state. |
| `VoiceRecorder` | `components/admin/VoiceRecorder.tsx` | Curriculum | In-browser microphone audio recorder with UploadThing pipeline. |
| `AdminModals` | `components/admin/AdminModals.tsx` | Shared | Modal dialogs for course creation and lecture editing. |
| `AdminSidebar` | `components/admin/AdminSidebar.tsx` | Shell | Collapsible navigation sidebar for administrative dashboard. |
| `AdminTopNav` | `components/admin/AdminTopNav.tsx` | Shell | Header navigation bar with role badge, theme toggle, and logout. |
| `AdminLoadingSkeleton` | `components/admin/AdminLoadingSkeleton.tsx` | Shell | Full-page loading skeleton for tab transitions. |

---

## 3. Core Shell & Provider Components

- `Layout.tsx`: Master layout wrapper with SEO meta tags, OpenGraph images, and JSON-LD structured data.
- `Navbar.tsx`: Responsive navigation bar with language switcher (`AR/EN`) and student profile menu.
- `Footer.tsx`: Global footer with links, copyright, and feedback portal anchor.
- `AuthProvider.tsx`: Supabase session lifecycle manager and user state provider.
- `ThemeProvider.tsx`: Light/Dark mode provider syncing HTML class and local storage.
- `SiteContentProvider.tsx`: Context provider supplying dynamic CMS copy across the application.
- `Turnstile.tsx`: Cloudflare Turnstile CAPTCHA widget wrapper.
- `YouTubePlayer.tsx`: Responsive embedded video player for lecture streaming.
- `StudentSetupModal.tsx`: Mandatory onboarding modal prompting new students for university details.
- `InstallAppModal.tsx`: Modal prompt guiding users to install PharmaCore as a PWA.
- `MaintenanceScreen.tsx`: Gated emergency maintenance screen when platform is locked.
- `ErrorBoundary.tsx`: React error boundary catching client-side rendering exceptions.
