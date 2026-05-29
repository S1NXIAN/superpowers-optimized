---
name: frontend-design
description: Production-grade frontend implementation — design reasoning, accessibility, responsive layout, and visual polish.
---

# Frontend Design

Transform generic UIs into distinctive, production-grade interfaces.

## Scope Gate

1. Does the project already have a design system / component library?
   - Check for: `tailwind.config`, `theme.ts`, `tokens.json`, `design-system/`, `styles/`
2. **If yes**: read it, work within its constraints. Do not generate a new system.
3. **If no (greenfield)**: proceed with Design System Generation below.

## Design System Generation

### 1. Analyze
- **Product type** — SaaS, e-commerce, dashboard, portfolio, etc.
- **Audience** — developers, executives, consumers
- **Platform** — web, mobile, desktop
- **Constraints** — brand guidelines, required framework, accessibility level
- **Primary goal** — convert, explore, monitor, act

### 2. Select Direction
- **Style** — glassmorphism, brutalism, flat, neumorphism, dark mode
- **Color mood** — trust blue, energetic orange, calm pastels, dark OLED
- **Typography** — professional, playful, editorial, technical
- **Density** — compact (data-dense), balanced, spacious

### 3. Avoid Anti-Patterns
- Finance: playful colors, excessive animation
- Healthcare: neon, motion-heavy, low contrast
- Creative: corporate minimalism, generic templates
- Government: ornate design, low contrast

### 4. Output Design Summary
```
Design System: [Product] — [Style]
Colors: [Primary] / [Accent] / [Neutral]
Typography: [Heading] + [Body]
Avoid: [Anti-patterns]
```

## UI States

Every data-dependent view must handle all states:

| State | Implementation |
|---|---|
| **Loading** | Skeleton matching content layout — never blank/spinner alone |
| **Error** | What went wrong + how to fix + retry button |
| **Empty** | Helpful message + primary action ("Create your first project") |
| **Success** | Actual content, fully interactive |
| **Partial** | Available data + stale indicator ("Last updated 5m ago") |

## Hard Quality Standards

### Accessibility (Non-Negotiable)
- Contrast 4.5:1 normal / 3:1 large text (WCAG AA)
- `focus-visible` rings on all interactive elements
- Semantic HTML — no `<div onclick>`, proper heading hierarchy
- `aria-label` on icon-only buttons
- Never convey info by color alone — add icon or text
- `prefers-reduced-motion` on all animations
- Tab order matches visual order; full keyboard operability

### Touch & Interaction
- Minimum 44x44px touch targets with 8px+ gaps
- Never rely on hover alone for primary interactions
- Disable buttons during async; show inline spinner
- `cursor: pointer` on all clickable elements

### Layout & Responsive
- Mobile-first: base styles for 375px, `min-width` queries scale up
- No horizontal scroll at any breakpoint
- 4pt/8dp spacing rhythm; consistent type scale
- `min-h-dvh` instead of `100vh` (mobile browser chrome)
- Line length: 35–60ch mobile, 60–75ch desktop

### Performance
- WebP/AVIF images with `srcset`/`sizes`; `loading="lazy"` below fold
- `aspect-ratio` on all media to prevent CLS
- Virtualize lists with 50+ items
- Skeleton for operations exceeding 300ms

## Pre-Delivery Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets ≥44px with 8px+ gaps
- [ ] No horizontal scroll at 375px
- [ ] `prefers-reduced-motion` on all animations
- [ ] Semantic HTML (no `<div onclick>`, proper headings)
- [ ] Loading/error/empty states for all data views
- [ ] Responsive tested at 375, 768, 1024, 1440
- [ ] UI does not look like a generic AI template
- [ ] Clear primary action per major section

## Rationalization Table

| Temptation | Danger |
| :--- | :--- |
| "Skip the design direction, use defaults" | Generic template with no identity. |
| "Accessibility can wait" | Excludes users and fails audits. |
| "Spinners are fine for loading" | Skeleton reduces perceived latency. |
| "Dark mode is an afterthought" | Users expect it. Build with CSS vars from the start. |
