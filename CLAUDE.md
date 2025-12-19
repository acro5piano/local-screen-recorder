# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome extension that records screen and audio locally, outputting WebM video files. It's a free, privacy-focused alternative to services like Loom - all recording happens client-side with no cloud upload.

## Commands

```bash
pnpm install     # Install dependencies
pnpm dev         # Start Vite dev server on port 5173
pnpm build       # Build for production (outputs to dist/)
```

After building, load the `dist` folder as an unpacked Chrome extension.

## Architecture

- **React + TypeScript + Vite** frontend with TailwindCSS styling
- **Chrome Extension (Manifest V3)** - the built app runs as a browser extension
- Uses `navigator.mediaDevices.getDisplayMedia()` for screen capture and `getUserMedia()` for microphone

### Key Files

- `src/recorder.ts` - Core recording logic using MediaRecorder API; handles mic/screen/audio streams and WebM output
- `src/App.tsx` - Main UI component with recording controls and options (mic/audio toggles)
- `public/manifest.json` - Chrome extension manifest
- `public/background.js` - Extension service worker

### Data Flow

1. User selects recording options (mic, computer audio, screen)
2. `startRecording()` acquires media streams and creates a `MediaRecorder`
3. Recording chunks are collected via `ondataavailable`
4. On stop, blobs are combined and downloaded as a timestamped `.webm` file

### Libraries

- `react-hook-form` - Form state for recording options
- `ts-pattern` - Pattern matching for UI state
- `use-local-storage-state` - Persists user preferences
