# Design Tokens

Load this skill before choosing ANY color, spacing, shadow, or radius value.
Never hardcode hex — map to CSS variables or Tailwind tokens defined here.

## Color Palette

### Brand (indigo)
```
--color-brand-50:  #eef2ff
--color-brand-100: #e0e7ff
--color-brand-200: #c7d2fe
--color-brand-400: #818cf8
--color-brand-500: #6366f1   /* PRIMARY */
--color-brand-600: #4f46e5
--color-brand-700: #4338ca
--color-brand-900: #1e1b4b
```

### Neutrals (slate surfaces)
```
--color-surface-0:   #0f1117   /* darkest — board canvas */
--color-surface-1:   #161b27   /* column bg */
--color-surface-2:   #1e2433   /* card bg */
--color-surface-3:   #252d3d   /* elevated card / hover */
--color-surface-4:   #2e3749   /* input bg */
--color-border:      rgba(255,255,255,0.08)
--color-border-hover: rgba(255,255,255,0.15)
```

### Text
```
--color-text-primary:   #f1f5f9
--color-text-secondary: #94a3b8
--color-text-muted:     #475569
--color-text-inverse:   #0f172a
```

### Semantic
```
--color-success:  #10b981   /* emerald */
--color-warning:  #f59e0b   /* amber */
--color-danger:   #ef4444   /* red */
--color-info:     #6366f1   /* brand */
```

### Priority colors (MUST be consistent across all card components)
```
--priority-urgent: #ef4444   /* red-500 */
--priority-high:   #f59e0b   /* amber-500 */
--priority-medium: #6366f1   /* indigo-500 */
--priority-low:    #10b981   /* emerald-500 */
```

## Tailwind config extend
```ts
colors: {
  brand: { 50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca', 900:'#1e1b4b' },
  surface: { 0:'#0f1117', 1:'#161b27', 2:'#1e2433', 3:'#252d3d', 4:'#2e3749' },
  border: 'rgba(255,255,255,0.08)',
}
```

## Spacing (8px base grid)
```
4px  → gap-1, p-1   (icon padding)
8px  → gap-2, p-2   (tight)
12px → gap-3, p-3   (component internal)
16px → gap-4, p-4   (standard)
20px → gap-5, p-5   (card padding)
24px → gap-6, p-6   (section gap)
32px → gap-8, p-8   (layout gap)
48px → gap-12        (large section)
```

## Border Radius
```
2px  → rounded-sm   (badges, tags)
6px  → rounded-md   (inputs, buttons)
10px → rounded-lg   (cards, modals)
14px → rounded-xl   (columns, panels)
9999px → rounded-full (avatars, pills)
```

## Shadows (dark mode)
```css
--shadow-card:       0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.3);
--shadow-drag:       0 16px 40px rgba(0,0,0,0.6), 0 0 0 2px rgba(99,102,241,0.5);
--shadow-modal:      0 24px 64px rgba(0,0,0,0.7);
```
