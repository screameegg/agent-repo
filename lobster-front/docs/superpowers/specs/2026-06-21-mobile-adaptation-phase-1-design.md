# Mobile Adaptation Phase 1 Design

## Goal

Make the core Lobster frontend usable on mobile screens without replacing the desktop information architecture or visual language.

## Scope

Phase 1 covers browsing and management workflows:

- Login and registration.
- Authenticated application shell and navigation.
- Agent dashboard and create/delete flows.
- Skill market and skill detail.
- Profile hub, token/skill list style pages, notifications, and admin list pages.
- Shared dialogs, forms, cards, and list containers that appear in the above flows.

The skill editor receives only basic mobile containment in this phase. It must not create uncontrolled horizontal page overflow, and users should be able to open it and perform basic viewing/editing. A dedicated mobile editor workflow is out of scope.

## Recommended Approach

Use small, responsive Tailwind changes across existing components. Keep the current desktop sidebar, card system, colors, borders, and shadows. Add mobile-specific layout rules at existing breakpoints instead of creating separate mobile page trees.

## Navigation And Shell

Desktop keeps the current fixed side navigation. Mobile hides the side navigation and uses a compact top bar with a menu button. Opening the menu shows the existing navigation entries in a drawer-style panel, including unread notification badges and admin-only entries.

The main content container uses smaller mobile padding and avoids fixed desktop assumptions:

- Mobile: `p-4`, one-column content, stacked page headers.
- Desktop: keep the current `p-8`, max-width content, and side navigation.

## Core Page Rules

For dashboard, market, detail, profile, notifications, and admin pages:

- Header rows stack vertically on mobile.
- Primary action buttons may become full-width on mobile.
- Card padding, radius, and shadow are reduced on mobile while preserving the bold visual identity.
- Grids collapse to one column on mobile.
- Table-like management rows become stacked information blocks.
- Long names, URLs, tokens, and file paths wrap or truncate intentionally.

## Dialog And Form Rules

Dialogs should fit inside the viewport on mobile:

- Width: near full viewport with safe margin.
- Height: max viewport height with internal scrolling.
- Padding and shadows reduced on mobile.
- Action buttons stack when horizontal space is tight.
- Inputs and buttons retain touch-friendly height.

## Skill Editor Rule

Phase 1 does not redesign the editor. The goal is containment:

- Top bar remains reachable on narrow screens.
- Sidebar and code area must not force the outer app shell into uncontrolled horizontal overflow.
- Monaco remains the editing surface.

## Testing And Verification

Run:

- `npm run lint`
- `npm run build`

Manual browser checks should include mobile widths around 375px and desktop widths around 1280px for:

- Login.
- App shell navigation.
- Agent dashboard and create dialog.
- Skill market and detail.
- Profile.
- Admin user management.
- Skill editor basic open state.
