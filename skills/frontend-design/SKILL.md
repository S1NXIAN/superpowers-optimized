---
name: frontend-design
description: Use when implementing any UI component, page, or frontend feature — before writing markup or styles. Do NOT use for backend-only work, API endpoint design, or non-visual logic.
---

# Frontend Design

## Overview

Transform generic UIs into distinctive, production-grade interfaces with accessibility, responsive design, and visual polish built in from the start.

**Core principle:** Every UI must handle all states, be accessible to all users, and work across all viewports. None of these are optional.

## Scope Gate

### Before designing, check for existing design systems:

1. Does the project already have design tokens, a component library, or a theme configuration?
   - Check for: `tailwind.config`, `theme.ts`, `tokens.json`, `design-system/`, `styles/`, CSS custom properties
2. **If yes:** Read it. Work within its constraints. Do NOT generate a new system.
3. **If no (greenfield):** Generate a design direction (see below).

## Design Direction (Greenfield Only)

### 1. Analyze Context

| Factor | Questions |
|--------|-----------|
| Product type | SaaS, e-commerce, dashboard, portfolio, landing page? |
| Audience | Developers, executives, consumers, internal team? |
| Platform | Web, mobile, desktop, responsive web app? |
| Constraints | Brand guidelines, required framework, accessibility level? |
| Primary goal | Convert, explore, monitor, act? |

### 2. Select Direction

| Element | Options |
|---------|---------|
| Style | Glassmorphism, brutalism, flat, neumorphism, minimal, dark |
| Color mood | Trust blue, energetic orange, calm pastels, dark OLED, neutral |
| Typography | Professional (Inter), playful, editorial (serif), technical (mono) |
| Density | Compact (data-dense), balanced, spacious |

### 3. Avoid Anti-Patterns by Domain

| Domain | Avoid |
|--------|-------|
| Finance | Playful colors, excessive animation |
| Healthcare | Neon, motion-heavy, low contrast |
| Creative | Corporate minimalism, generic templates |
| Government | Ornate design, low contrast, non-semantic HTML |

### 4. Output Design Summary

```
Design System: [Product] — [Style]
Colors: [Primary] / [Accent] / [Neutral]
Typography: [Heading] + [Body]
Avoid: [Anti-patterns]
```

## UI States

Every data-dependent view must handle ALL states:

| State | Implementation |
|-------|----------------|
| **Loading** | Skeleton matching content layout — never blank or spinner alone |
| **Error** | What went wrong + how to fix + retry button |
| **Empty** | Helpful message + primary action ("Create your first project") |
| **Success** | Actual content, fully interactive |
| **Partial** | Available data + stale indicator ("Last updated 5m ago") |

## Quality Standards

### Accessibility (Non-Negotiable)

- **Contrast:** 4.5:1 normal text / 3:1 large text (WCAG AA minimum)
- **Focus:** `focus-visible` rings on all interactive elements
- **Semantic HTML:** No `<div onClick>`, proper heading hierarchy (`h1-h6`)
- **Labels:** `aria-label` on icon-only buttons
- **Color independence:** Never convey information by color alone — add icon or text
- **Motion:** `prefers-reduced-motion` on all animations
- **Keyboard:** Tab order matches visual order; full keyboard operability

### Touch & Interaction

- **Touch targets:** Minimum 44x44px with 8px+ gaps between targets
- **Hover:** Never rely on hover alone for primary interactions
- **Loading states:** Disable buttons during async operations; show inline spinner
- **Cursors:** `cursor: pointer` on all clickable elements

### Layout & Responsive

- **Approach:** Mobile-first — base styles for 375px, `min-width` queries scale up
- **Scroll:** No horizontal scroll at any breakpoint
- **Rhythm:** 4pt/8dp spacing rhythm; consistent type scale
- **Viewport:** `min-h-dvh` instead of `100vh` (mobile browser chrome)
- **Line length:** 35–60ch mobile, 60–75ch desktop

### Performance

- **Images:** WebP/AVIF with `srcset`/`sizes`; `loading="lazy"` below fold
- **Layout shift:** `aspect-ratio` on all media elements
- **Lists:** Virtualize lists with 50+ items
- **Loading UX:** Skeleton for operations exceeding 300ms

## Pre-Delivery Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Color contrast meets WCAG AA minimum
- [ ] Touch targets ≥ 44px with 8px+ gaps
- [ ] No horizontal scroll at 375px viewport
- [ ] `prefers-reduced-motion` applied to all animations
- [ ] Semantic HTML (no `<div onClick>`, proper heading hierarchy)
- [ ] Loading/error/empty states for all data-dependent views
- [ ] Responsive tested at 375, 768, 1024, 1440px
- [ ] UI does not look like a generic AI template
- [ ] Clear primary action per major section

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping design direction, using defaults | Generic template with no identity. Choose a direction. |
| "Accessibility can wait" | Excludes users and fails audits. Build it in from the start. |
| Spinners for loading | Use skeleton screens. They reduce perceived latency. |
| Dark mode as an afterthought | Users expect it. Build with CSS custom properties from the start. |
| Color-only indicators | Add icons or text labels. Colorblind users can't distinguish. |
| Ignoring touch targets | 44x44px minimum. 8px gaps. Test on mobile. |
| No loading state for async ops | Users see a frozen UI. Always show inline loading. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "Skip the design direction, use defaults" | Generic template with no visual identity. |
| "Accessibility can wait" | Excludes users, fails audits, costs more to retrofit. |
| "Spinners are fine for loading" | Skeleton screens reduce perceived latency significantly. |
| "Dark mode is an afterthought" | Users expect it. CSS vars from day one costs nothing. |
| "I'll add responsive later" | Responsive isn't optional. Mobile-first from the start. |
| "Performance doesn't matter for this app" | Performance is UX. Slow = users leave. |
| "This state will never happen" | Every state happens in production. Handle it. |

## Red Flags

- Starting markup before defining the design direction (greenfield)
- Using `<div onClick>` instead of `<button>` or `<a>`
- Writing CSS without a spacing or type scale
- Animations without `prefers-reduced-motion`
- Information conveyed by color alone
- UI that works only at one viewport width
- No loading/error/empty states for data views

## Integration

**Required before this skill:**
- `brainstorming` — design decisions should be validated before frontend work begins
- `writing-plans` — plan TDD sequence for components

**Used with:**
- `test-driven-development` — for component and hook tests
- `verification-before-completion` — verify the pre-delivery checklist
