# Masar Frontend Application — Agent Guide

This document provides specialized guidelines, build commands, UI/UX accessibility standards, and coding practices for the **Masar Frontend Web Application** (`src/frontend`).

---

## 1. Stack & Technologies

* **Framework**: React 19 with TypeScript.
* **Build Tooling**: Vite with ES modules.
* **Styling**: Tailwind CSS with `clsx` and `tailwind-merge` for robust utility class combining.
* **Component Primitives**: Radix UI primitives (`@radix-ui/react-dialog`) and Lucide React icons (`lucide-react`).
* **Routing**: React Router DOM v7.
* **State Management**: Zustand v5 (lightweight, modular stores).
* **Linter**: `oxlint` for high-performance static analysis.

---

## 2. Build, Lint & Dev Commands

Run all commands from the `src/frontend` directory (or use `--prefix src/frontend` from repo root):

```bash
# Install node dependencies
npm ci

# Start local development server (Vite HMR)
npm run dev

# Fast linting with oxlint
npm run lint

# TypeScript typecheck without emitting output
npx tsc --noEmit

# Production build (TypeScript compile + Vite bundle)
npm run build

# Preview production build locally
npm run preview
```

---

## 3. Design System & Accessibility Standards (WCAG 2.1 AA)

* **Palette (Locked):**
  * Primary Brand: **Teal** (`#0D9488` / `teal-600`).
  * Accent: **Blue** (`#2563EB` / `blue-600` for charts, informational data, and status highlights).
  * Surface neutrals: Slate (`#0F172A` to `#F8FAFC`).
  * Semantic tokens: `success` Forest (`#15803D`), `error-700` Crimson (`#B91C1C`), and warning Amber (`#D97706`).
  * *Note: Navy and Gold accents are retired per the locked Design System.*
* **Typography (Locked):**
  * **Thmanyah Sans** as the sole primary font for both Arabic (RTL) and English (LTR) headings and body copy.
  * Monospace pairing for code snippets and terminal outputs (`JetBrains Mono` or `Fira Code`).
* **Contrast Ratios**: All normal text must maintain at least a **4.5:1** contrast ratio against its background; large headings ($\ge 18\text{pt}$ or bold $\ge 14\text{pt}$) require at least **3:1**.
* **Non-Color Signaling**: Never convey critical status or mastery by color alone:
  * Atom mastery states must include explicit text labels and distinctive icons in addition to background color tints (e.g., checkmark for `Learned`, warning indicator for `Shaky`, lock icon for `Locked`).
* **Bilingual Layout & Directionality**:
  * The primary application shell and navigation support Arabic right-to-left layout (`dir="rtl"`).
  * Technical code blocks, syntax-highlighted snippets, and terminal outputs must remain explicitly isolated as left-to-right islands (`dir="ltr"`).
* **Keyboard Navigation & Accessibility (WCAG 2.1)**:
  * Selection operates via `Tab` and `Shift+Tab`; submission and confirmation use `Enter` or `Space`.
  * **WCAG 2.1.4 (Character Key Shortcuts):** Direct character shortcuts `1`–`4` are omitted to prevent conflicting with assistive tech.
  * **WCAG 2.1.1 (Keyboard Alternative):** For Spot-the-Defect exercises, navigate lines using `ArrowUp`/`ArrowDown` and select with `Enter` or `Space`.
  * **Persistent Reporting:** A fixed Report Problem icon button is placed in the lesson player header next to Exit, accessible at all times regardless of answer state.
* **Responsive Breakpoints**:
  * Mobile: $< 768\text{ px}$ (single-column river path, bottom nav).
  * Tablet: $768\text{ px} - 1023\text{ px}$ (two-column: 80px left rail + fluid path).
  * Desktop: $1024\text{ px} - 1279\text{ px}$ (three-column: 240px nav + fluid path $\ge 504\text{ px}$ + 280px stats rail).
  * Wide Desktop: $\ge 1280\text{ px}$ (three-column: 240px nav + 720px centered path + 320px stats rail).
* **Motion & Animations**: Always respect user system preferences for reduced motion using Tailwind's `motion-reduce:*` utility variants.

---

## 4. State Management & API Integration

* **Zustand Stores**: Organize client state into dedicated stores (e.g., `useAuthStore`, `useRoadmapStore`, `useLessonPlayerStore`). Keep stores lean and business logic deterministic.
* **API Calls & Contract Adherence**:
  * Use Axios or native fetch with standardized request interceptors for JWT Bearer token attachment.
  * All payload keys must strictly follow `camelCase` (e.g., `atomId`, `durationSeconds`, `sessionId`).
* **Error & Session Handling**:
  * Intercept HTTP `401 Unauthorized` responses to trigger silent refresh via the refresh token endpoint, redirecting to login only when token renewal fails.
  * Gracefully handle HTTP `404 Not Found` responses when accessing student roadmaps or private assessments.

---

## 5. Security & Assessment Guardrails

* **Assessment Evaluation Integrity**:
  * Formative practice exercises may include client-side verification for instant step-by-step guidance.
  * High-stakes Unit Checkpoints and Placement Tests must send student submissions to the backend for server-side evaluation. Never request or embed answer keys inside client bundles for high-stakes assessments.
* **Environment Variables**:
  * Any variable prefixed with `VITE_` is baked directly into static client assets and is publicly visible to end users. Never place private API keys, backend secrets, or service credentials in `.env` files within `src/frontend`.
