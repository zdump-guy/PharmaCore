# PharmaCore — Known Issues & Operational Gotchas

## 1. Environment & Third-Party Constraints

### 1.1 Mobile Safari Audio Autoplay Policy
- **Issue**: Mobile Safari blocks automated audio playback unless triggered by direct user gesture.
- **Resolution / Behavior**: The custom audio player (`CustomAudioPlayer.tsx`) requires explicit user tap on the play button before initiating audio streams.

### 1.2 Google Drive PDF Embed Security Policies
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
