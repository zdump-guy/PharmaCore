# Module: PWA Installer & Service Worker (`lib/usePwaInstall.ts`)

## 1. Overview
`lib/usePwaInstall.ts` captures browser `beforeinstallprompt` events, enabling custom in-app PWA install modals (`components/InstallAppModal.tsx`).

---

## 2. Service Worker (`public/sw.js`)
- Registers cache-first strategy for immutable static assets (`/logos_favicon/*`, Google Fonts, SVG icons).
- Employs network-first strategy for dynamic educational routes (`/course/*`, `/lecture/*`).
