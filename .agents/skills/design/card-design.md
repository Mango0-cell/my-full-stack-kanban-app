# Card Design

The card is the most important element in the board. Every state must be specified.

## Card Anatomy
```
+---------------------------------------------+
| [priority border-left 3px]                  |
|   Title text (14px/medium)                  |
|                                             |
|   description preview (2 lines max, 12px)   |
|                                             |
|   [due date chip]  [assignee avatar]  [...] |
+---------------------------------------------+
```

## Card States

### Resting
```tsx
"bg-surface-2 border border-white/[0.07] rounded-lg p-4
 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)]
 transition-all duration-200 cursor-grab select-none"
```

### Hover
```tsx
"hover:bg-surface-3 hover:border-white/[0.12]
 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,102,241,0.3)]
 hover:-translate-y-0.5"
```

### Dragging (DragOverlay)
```tsx
"rotate-[1.5deg] scale-[1.03]
 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_0_2px_rgba(99,102,241,0.5)]
 opacity-95 cursor-grabbing"
```

### Drag Placeholder
```tsx
"bg-surface-1 border border-dashed border-brand-500/30 rounded-lg p-4 opacity-40"
```

### Selected / Focused
```tsx
"ring-2 ring-brand-500 ring-offset-1 ring-offset-surface-0"
```

## Priority Indicator
```tsx
// Left border accent (3px) — clean editorial look
const priorityBorder = {
  urgent: 'border-l-[3px] border-l-red-500',
  high:   'border-l-[3px] border-l-amber-500',
  medium: 'border-l-[3px] border-l-brand-500',
  low:    'border-l-[3px] border-l-emerald-500',
};
```

## Due Date Chip
```tsx
// Normal
"text-[11px] font-mono text-slate-500 bg-surface-4 px-2 py-0.5 rounded"
// Overdue
"text-red-400 bg-red-500/10 border border-red-500/20"
// Due today
"text-amber-400 bg-amber-500/10 border border-amber-500/20"
```

## Card Drag Handle
```tsx
"opacity-0 group-hover:opacity-100 transition-opacity duration-150
 cursor-grab text-slate-600 hover:text-slate-400"
```
