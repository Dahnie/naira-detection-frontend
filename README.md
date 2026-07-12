# Naira Note Detector

An accessibility-first web app that identifies Nigerian Naira banknote denominations from a photo. Users capture an image with their camera or upload a file, and the app returns the detected denomination with a confidence score — spoken aloud, announced to screen readers, and shown on screen.

The app is designed primarily for blind and low-vision users. Every interaction is mirrored through text-to-speech, ARIA live regions, haptic vibration, and full keyboard control.

## Features

- **Camera capture & file upload** — capture a note with the device camera (front/back switching, high-quality constraints with fallback) or upload an existing image.
- **Denomination detection** — sends the image to a detection backend and displays the top denomination with a confidence level (high / medium / low) and a visual confidence bar.
- **Text-to-speech** — results and interface feedback are read aloud via the Web Speech API, with adjustable rate and pitch.
- **Screen-reader support** — ARIA live regions, roles, and descriptive labels throughout.
- **Keyboard-first controls** — every action has a keyboard shortcut (see below).
- **Haptic feedback** — vibration cues on supported devices.
- **Persistent preferences** — auto-speak, speech rate, and pitch saved to `localStorage`.
- **Toast notifications** — error, success, and warning messages.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server & build)
- **React Router 7**
- **lucide-react** (icons), **framer-motion**, **@lottiefiles/dotlottie-react**
- **Web Speech API**, **MediaDevices / getUserMedia**, **Vibration API**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A running detection backend (defaults to `http://localhost:8000`)

### Installation

```bash
npm install
```

### Environment

Create a `.env` file in the project root:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

If unset, the app falls back to `http://localhost:8000`.

### Scripts

```bash
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run ESLint
```

> **Note:** The camera requires a secure context. `localhost` works in development; any other host must be served over HTTPS.

## API

The app expects a single detection endpoint:

```
POST {VITE_API_BASE_URL}/api/detection/detect/image
Content-Type: multipart/form-data
Body: file=<image blob>
```

Expected response shape (see [src/models/Types.ts](src/models/Types.ts)):

```jsonc
{
  "success": true,
  "inference_time": 0.12,
  "detections": [ /* class_id, class_name, confidence, bbox */ ],
  "detection_count": 1,
  "annotated_image": "<base64 or url>",
  "top_detection": { "denomination": "1000", "confidence": 0.94 },
  "error": null
}
```

The UI reads `top_detection.denomination` and `top_detection.confidence`.

## Keyboard Shortcuts

**Camera view**

| Key            | Action              |
| -------------- | ------------------- |
| `Space` / `C`  | Capture photo       |
| `U`            | Upload image file   |
| `F`            | Toggle flash        |
| `S`            | Switch camera       |
| `Ctrl/Cmd + S` | Open settings       |
| `?`            | Help instructions   |

**Result view**

| Key             | Action                |
| --------------- | --------------------- |
| `R`             | Repeat result aloud   |
| `N`             | New scan              |
| `B` / `Escape`  | Back to camera        |
| `Ctrl/Cmd + S`  | Open settings         |

## Project Structure

```
src/
├── api/           # API base URL config
├── assets/        # SVG icons and global styles
├── components/    # Camera, Result, Settings, Layout, Loader, toast handlers
├── constants/     # Static message strings
├── contexts/      # ToastHandler context provider
├── hooks/         # useCamera, useSpeech, useDisplayMessage
├── models/        # Shared TypeScript types
├── pages/home/    # Home — top-level view orchestration & keyboard routing
├── utils/         # detection, preferences, accessibility, toast singleton
└── validation/    # small validators
```

Path aliases (`@components`, `@hooks`, `@utils`, etc.) are configured in [vite.config.ts](vite.config.ts).

## Accessibility

Accessibility is a core requirement, not an add-on:

- Live regions (`aria-live`) announce state changes; `assertive` is downgraded to `polite` on mobile to avoid interrupting VoiceOver/TalkBack.
- Focus is managed on view changes and trapped inside the settings modal.
- All controls are reachable and operable by keyboard, with descriptive `aria-label` / `aria-describedby` text.
- Speech feedback can be tuned or disabled entirely in Settings.
