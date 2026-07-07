# Motion

## Duration Scale
```
instant:  0ms    (state changes with no perceived delay)
fast:     80ms   (button press feedback, badge appear)
quick:   150ms   (tooltip, dropdown open)
normal:  200ms   (card hover, focus ring, color transitions)
medium:  300ms   (modal open, panel slide, toast enter)
slow:    500ms   (page transitions, skeleton shimmer)
```

## Easing Functions
```css
--ease-out:    cubic-bezier(0.0, 0, 0.2, 1);     /* elements entering */
--ease-in:     cubic-bezier(0.4, 0, 1, 1);        /* elements leaving */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* DnD drop, card appear */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);      /* general transitions */
```

## Tailwind Config Extension
```ts
transitionTimingFunction: {
  'out':    'cubic-bezier(0.0, 0, 0.2, 1)',
  'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
},
transitionDuration: {
  '80': '80ms',
  '150': '150ms',
},
```

## Animation Patterns (Framer Motion)

### Card entry (new card created)
```ts
initial: { opacity: 0, y: -8, scale: 0.97 }
animate: { opacity: 1, y: 0,  scale: 1.00 }
transition: { duration: 0.2, ease: [0.0, 0, 0.2, 1] }
```

### Column entry
```ts
initial: { opacity: 0, x: -16 }
animate: { opacity: 1, x: 0 }
transition: { duration: 0.25, ease: [0.0, 0, 0.2, 1] }
```

### Modal open
```ts
// Backdrop
initial: { opacity: 0 }
animate: { opacity: 1 }
transition: { duration: 0.15 }

// Panel
initial: { opacity: 0, scale: 0.96, y: 8 }
animate: { opacity: 1, scale: 1.00, y: 0 }
transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }
```

### Toast enter/exit
```ts
initial:  { opacity: 0, x: 48, scale: 0.95 }
animate:  { opacity: 1, x: 0,  scale: 1.00 }
exit:     { opacity: 0, x: 48, scale: 0.95 }
transition: { duration: 0.2, ease: [0.0, 0, 0.2, 1] }
```

### DnD drag overlay
```css
transform: rotate(2deg) scale(1.03);
box-shadow: var(--shadow-drag);
opacity: 0.95;
transition: box-shadow 150ms ease-out;
```

### DnD drop zone highlight
```css
.drop-target {
  background: rgba(99, 102, 241, 0.08);
  border: 1.5px dashed rgba(99, 102, 241, 0.4);
  border-radius: 10px;
  transition: all 150ms ease-out;
}
```

## Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Setup
- Install: `npm install framer-motion`
- Wrap board in `<AnimatePresence mode="popLayout">`
- Use `<motion.div layout>` on every card for position animation
