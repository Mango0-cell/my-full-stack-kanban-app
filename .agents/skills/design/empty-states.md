# Empty States

## Empty Board (no columns)
```tsx
<div className="flex flex-col items-center justify-center h-full gap-6 py-24">
  <EmptyBoardIllustration />   {/* custom inline SVG, geometric rectangles suggesting columns */}
  <div className="text-center">
    <h3 className="text-slate-200 font-semibold text-lg">No columns yet</h3>
    <p className="text-slate-500 text-sm mt-1">Add your first column to start organizing work</p>
  </div>
  <Button onClick={onCreateColumn}>Add first column</Button>
</div>
```

## Empty Column (no cards)
```tsx
<div className="border border-dashed border-white/10 rounded-lg p-6
                flex flex-col items-center gap-2 mt-2
                hover:border-brand-500/30 hover:bg-brand-500/5
                transition-colors duration-200 cursor-pointer"
     onClick={onCreateCard}>
  <span className="text-slate-600 text-sm">+ Add a card</span>
</div>
```

## Skeleton Loaders
```tsx
// Column skeleton
"animate-pulse bg-surface-1 rounded-xl w-[280px] h-[400px]"

// Card skeleton
"animate-pulse bg-surface-2 rounded-lg p-4 space-y-2"
// Inside: bg-surface-3 rounded bars at 70%, 50%, 30% width
```

### Custom Shimmer (preferred over pulse)
```css
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.shimmer {
  background: linear-gradient(90deg,
    var(--color-surface-2) 25%,
    var(--color-surface-3) 50%,
    var(--color-surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

## Error State
```tsx
<div className="flex flex-col items-center gap-4 py-16">
  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
    <AlertTriangle className="w-5 h-5 text-red-400" />
  </div>
  <p className="text-slate-400 text-sm">Something went wrong</p>
  <button onClick={onRetry}
    className="text-brand-400 text-sm hover:text-brand-300 underline underline-offset-2">
    Try again
  </button>
</div>
```
