# Accessibility

All design choices must pass WCAG 2.1 AA minimum.

## Color Contrast
```
Body text on surface-2:   slate-100 (#f1f5f9) on #1e2433 → 12:1 pass
Secondary text:           slate-400 (#94a3b8) on #1e2433 → 4.8:1 pass
Muted text minimum:       slate-400 (#94a3b8) — never use slate-500 for readable text
Brand button text:        white on brand-500 → 5.1:1 pass
```

## Keyboard Navigation
- Tab order: Navbar -> Sidebar -> Board toolbar -> Columns (left->right) -> Cards (top->bottom)
- Card focus: visible ring (2px brand-500), Enter to open detail
- Column header: Enter/Space to open column menu
- DnD keyboard: Space to pick up, arrow keys to move, Space to drop, Escape to cancel
- Modal: focus trap, Escape to close, focus returns to trigger on close

## ARIA Attributes
```tsx
// Board
<main role="main" aria-label="Kanban board">

// Column
<section aria-label={`${column.name}, ${cards.length} cards`}>

// Card
<article aria-label={card.title} tabIndex={0} role="article">

// Drag handle
<button aria-label={`Drag ${card.title}`} aria-roledescription="Draggable card">

// Priority badge
<span aria-label={`Priority: ${card.priority}`}>

// Loading state
<div aria-busy="true" aria-label="Loading cards...">
```

## Motion Preference
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? {} : cardAnimation}
  transition={prefersReducedMotion ? { duration: 0 } : transition}
>
```

## DnD Screen Reader Announcements
```tsx
import { announcements } from '@dnd-kit/accessibility';

const customAnnouncements = {
  onDragStart: ({ active }) => `Picked up card: ${active.data.current?.title}`,
  onDragOver:  ({ active, over }) => over
    ? `Card over column ${over.data.current?.columnName}` : `Not over any column`,
  onDragEnd:   ({ active, over }) => over
    ? `Dropped in ${over.data.current?.columnName}` : `Returned to original position`,
};
```
