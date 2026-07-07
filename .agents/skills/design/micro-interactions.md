# Micro-Interactions

## Button Press
```css
transition: all 150ms cubic-bezier(0.0, 0, 0.2, 1);
&:active { transform: scale(0.97); }
```

## Focus Ring
```css
.focus-visible\:ring-brand:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #6366f1, 0 0 0 4px rgba(99,102,241,0.25);
}
```

## Card Hover Lift
```css
transition: transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out;
&:hover { transform: translateY(-2px); }
```

## Inline Edit (column name, card title)
- On double-click: replace text with borderless input
- Input: `bg-transparent`, underline `border-b border-brand-500`
- On blur or Enter: save + revert to text
- On Escape: revert without saving
- Show pencil icon on hover to signal editability

## Column Add Card Button
- Default: `"+ Add a card"` ghost button at column bottom
- Hover: `brand-500/10` background, `brand-400` text, slight indent animation
- Press: collapse to inline form (CardQuickCreate)

## Toast Notifications
```tsx
toast.custom((t) => (
  <motion.div
    initial={{ opacity: 0, x: 48, scale: 0.95 }}
    animate={t.visible ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 48 }}
    className="bg-surface-2 border border-white/10 rounded-lg px-4 py-3
               shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center gap-3
               text-sm text-slate-200 max-w-xs"
  >
    {icon}
    {message}
  </motion.div>
))
// Position: bottom-right, Duration: success 3000ms, error 5000ms, Max visible: 3
```

## DnD Visual Feedback Sequence
1. **Grab** (mousedown): cursor changes to grabbing
2. **Lift** (drag start): card rotates 1.5deg, scales 1.03, shadow deepens
3. **Over column**: column highlights (dashed border + brand tint)
4. **Over card**: gap opens between cards (Framer layout animation)
5. **Drop**: card springs into position (spring easing)
6. **Drop success**: brief brand glow on card (200ms fade out)
7. **Cursor**: returns to default
