# Mobile Adaptation Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the core Lobster frontend usable on mobile screens while preserving the existing desktop UI.

**Architecture:** Use responsive Tailwind classes in existing React components. Introduce a mobile app shell in the existing `Layout` component and apply focused mobile layout rules to high-risk pages and shared UI surfaces.

**Tech Stack:** React 19, React Router 7, Vite 6, Tailwind CSS 4, lucide-react, motion/react, TypeScript.

## Global Constraints

- Keep the current visual language: bold borders, shadows, warm background, and existing color tokens.
- Do not create separate mobile-only route trees.
- Do not redesign the full skill editor in phase 1.
- Avoid uncontrolled horizontal page overflow at mobile widths.
- Verify with `npm run lint` and `npm run build`.

---

### Task 1: Responsive App Shell

**Files:**
- Modify: `src/components/Layout/index.tsx`

**Interfaces:**
- Consumes: existing `NavItem` props and `useUserStore`.
- Produces: mobile top bar and drawer state inside `Layout`.

- [ ] Add `Menu` and `X` icons to the lucide import.
- [ ] Add `mobileNavOpen` state.
- [ ] Hide the existing `aside` below `md`.
- [ ] Add a mobile top bar inside `main` with brand, menu button, and drawer.
- [ ] Reuse existing navigation item labels, links, badges, and admin gating in the drawer.
- [ ] Change the main content wrapper to `p-4 md:p-8`.
- [ ] Run `npm run lint`.

### Task 2: Core Dashboard And Cards

**Files:**
- Modify: `src/pages/agent/Dashboard/index.tsx`
- Modify: `src/pages/agent/Dashboard/components/AgentCard.tsx`

**Interfaces:**
- Consumes: existing create/delete behavior.
- Produces: responsive header, grid, cards, and create dialog.

- [ ] Stack dashboard header on mobile with full-width create button.
- [ ] Reduce mobile modal padding, radius, and shadow.
- [ ] Make modal action buttons and AI flow buttons stack cleanly.
- [ ] Update `AgentCard` header to wrap on narrow screens without overlapping status and delete controls.
- [ ] Run `npm run lint`.

### Task 3: Market, Detail, And Profile Pages

**Files:**
- Modify: `src/pages/skill/Market/index.tsx`
- Modify: `src/pages/skill/Market/components/SkillCard.tsx`
- Modify: `src/pages/skill/Detail/index.tsx`
- Modify: `src/pages/user/Profile/index.tsx`

**Interfaces:**
- Consumes: existing page data and actions.
- Produces: one-column mobile layouts with safe wrapping.

- [ ] Reduce mobile card padding and shadows.
- [ ] Stack detail hero content and install action.
- [ ] Ensure long file names and preformatted content remain scrollable within their containers.
- [ ] Make profile cards and action tiles fit mobile width.
- [ ] Run `npm run lint`.

### Task 4: Management Lists And Shared Dialogs

**Files:**
- Modify: `src/pages/admin/UserManagement/index.tsx`
- Modify: `src/components/ConfirmDialog.tsx`
- Modify: `src/components/ImageUploader.tsx` if upload preview controls overflow.

**Interfaces:**
- Consumes: existing admin actions and confirm dialog props.
- Produces: stacked mobile list rows and viewport-safe dialogs.

- [ ] Convert admin user row actions to wrap and stretch on mobile.
- [ ] Reduce shared confirm dialog mobile padding and max width.
- [ ] Check uploader preview controls for mobile overflow and adjust only if needed.
- [ ] Run `npm run lint`.

### Task 5: Skill Editor Containment

**Files:**
- Modify: `src/pages/skill/Editor/index.tsx`
- Modify: `src/pages/skill/Editor/components/TopBar.tsx`
- Modify: `src/pages/skill/Editor/components/EditorSidebar.tsx`
- Modify: `src/pages/skill/Editor/components/CodeArea.tsx`

**Interfaces:**
- Consumes: existing editor state and callbacks.
- Produces: mobile-contained editor shell.

- [ ] Keep editor top bar horizontally scrollable but reduce mobile padding and gaps.
- [ ] Hide or constrain the sidebar at mobile widths so the code area remains reachable.
- [ ] Ensure code area has `min-w-0` and does not expand the whole page.
- [ ] Run `npm run lint`.

### Task 6: Build Verification

**Files:**
- No source files required unless verification exposes failures.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified mobile phase 1 build.

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] If either command fails, fix the exact failure and rerun the failed command.
- [ ] Commit implementation changes with `git commit -m "feat: add mobile responsive phase one"`.
