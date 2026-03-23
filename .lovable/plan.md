

# GIF Splash/Loading Screen

## Overview

Add a full-screen loading splash that displays the user's GIF before the main BookletEditor appears. The GIF plays for a set duration (e.g. 2-3 seconds), then fades out to reveal the app.

## Steps

### 1. Upload the GIF

User uploads their GIF file. It will be placed in `public/` (e.g. `public/loading.gif`).

### 2. Create Splash Component

**New file: `src/components/SplashScreen.tsx`**

- Full-screen overlay (`fixed inset-0 z-50`) with a background color
- Centered GIF image
- After a configurable duration (default 2.5s), triggers a fade-out CSS animation (~500ms)
- Calls an `onComplete` callback when done

### 3. Integrate in App.tsx

- Add state `showSplash = true`
- Render `SplashScreen` above the router when `showSplash` is true
- On `onComplete`, set `showSplash = false`

### 4. CSS Animation

Add a `fade-out` keyframe in `index.css` for the smooth transition.

## Files

| Action | File |
|--------|------|
| Create | `src/components/SplashScreen.tsx` |
| Modify | `src/App.tsx` — wrap with splash state |
| Modify | `src/index.css` — fade-out animation |

