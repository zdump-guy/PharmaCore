# PharmaCore — Known Issues & Operational Gotchas

## 1. Environment & Third-Party Constraints

### 1.1 Cloudflare Turnstile in Local Development
- **Issue**: Running localhost without registered Cloudflare Turnstile hostnames triggers `invalid-input-secret` or hostname mismatch errors.
- **Resolution / Behavior**: `lib/turnstile.ts` detects local development environments (e.g., `process.env.NODE_ENV !== 'production'`) and bypasses verification when dummy test keys (`1x0000000000000000000000000000000AA`) are used.
- **Production Requirement**: Real `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` must be configured in Vercel environment settings.

### 1.2 Mobile Safari Audio Autoplay Policy
- **Issue**: Mobile Safari blocks automated audio playback unless triggered by direct user gesture.
- **Resolution / Behavior**: The custom audio player (`CustomAudioPlayer.tsx`) requires explicit user tap on the play button before initiating audio streams.

### 1.3 Google Drive PDF Embed Security Policies
- **Issue**: Certain Google Drive links configured without "Anyone with the link can view" permissions fail to render in embedded iframes due to `X-Frame-Options: SAMEORIGIN` headers set by Google.
- **Resolution / Behavior**: The PDF Preview Modal (`pdf-preview-modal.tsx`) provides an "Open in New Tab" fallback button if the inline iframe fails to load.

---

## 2. Browser Compatibility & Edge Cases

| Browser / Client | Tested Versions | Known Quirks | Status |
|---|---|---|---|
| **Chrome (Desktop/Android)** | 110+ | Full support for PWA installation, audio playback, and RTL rendering. | Verified |
| **Safari (iOS/macOS)** | 16.4+ | Audio playback requires user tap; Web App Manifest requires `apple-touch-icon`. | Verified |
| **Firefox (Desktop/Android)** | 115+ | Full support; custom audio scrub bar renders natively. | Verified |
| **Edge (Desktop)** | 110+ | Full support for all features. | Verified |
