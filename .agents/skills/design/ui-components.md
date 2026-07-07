# UI Components

Visual spec for every reusable component. Follow these specs when implementing any Shadcn/Radix component.

## Button Variants

### Primary (brand action — "Create card", "Save")
```tsx
className="bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm
           px-4 py-2 rounded-md transition-colors duration-150
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
           active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
```

### Ghost (secondary — "Cancel", "Edit")
```tsx
className="bg-transparent hover:bg-surface-3 text-slate-300 hover:text-slate-100
           font-medium text-sm px-3 py-1.5 rounded-md transition-colors duration-150
           border border-transparent hover:border-white/10"
```

### Danger (delete actions)
```tsx
className="bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300
           border border-red-500/20 hover:border-red-500/40
           font-medium text-sm px-3 py-1.5 rounded-md transition-all duration-150"
```

### Icon button (toolbar actions)
```tsx
className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-surface-3
           transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-400"
```

## Input Field
```tsx
className="w-full bg-surface-4 border border-white/10 hover:border-white/20
           focus:border-brand-500 focus:bg-surface-3
           text-slate-100 placeholder:text-slate-500
           text-sm px-3 py-2 rounded-md outline-none
           transition-all duration-150 caret-brand-400"
```

## Badge / Priority Pill
```tsx
const priorityStyles = {
  urgent: 'bg-red-500/15 text-red-400 border-red-500/25',
  high:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  medium: 'bg-brand-500/15 text-brand-400 border-brand-500/25',
  low:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
};
// Base: "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-sm border"
```

## Avatar
```tsx
// Sizes: sm (24px), md (32px), lg (40px), xl (56px)
// Fallback: initials from display_name, bg from user_id hash
function avatarBg(userId: number) {
  const colors = ['bg-violet-500','bg-indigo-500','bg-teal-500',
                  'bg-rose-500','bg-amber-500','bg-emerald-500'];
  return colors[userId % colors.length];
}
```

## Dropdown / Context Menu
```tsx
// Content:
"bg-surface-2 border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)]
 p-1 min-w-[160px] z-50"

// Item:
"flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100
 hover:bg-surface-3 px-3 py-2 rounded-md cursor-pointer transition-colors duration-100"

// Destructive item:
"text-red-400 hover:text-red-300 hover:bg-red-500/10"
```

## Tooltip
```tsx
"bg-surface-2 border border-white/10 text-slate-200 text-xs px-2 py-1 rounded-md
 shadow-[0_4px_12px_rgba(0,0,0,0.4)] z-50"
// Delay: 400ms open, 0ms close
```
