# Layout

## Board Layout Structure
```tsx
<div className="h-screen flex flex-col bg-surface-0 overflow-hidden">
  <Navbar />                     {/* h-14, border-b border-white/[0.06] */}
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />                  {/* w-60, shrink-0, border-r border-white/[0.06] */}
    <main className="flex-1 overflow-hidden flex flex-col">
      <BoardToolbar />           {/* h-12, px-6, border-b */}
      <BoardCanvas />            {/* flex-1, overflow-x-auto, overflow-y-hidden */}
    </main>
  </div>
</div>
```

## Board Canvas
```tsx
<div className="flex gap-4 p-6 h-full items-start w-max min-w-full">
  {columns.map(col => <Column key={col.column_id} ... />)}
  <AddColumnButton />
</div>
```

## Column Dimensions
- Width: 280px (fixed, never fluid)
- Min-height: 80px
- Max-height: `calc(100vh - 14rem)` (room for header + toolbar)
- Overflow-y: auto (custom scrollbar)

## Custom Scrollbar
```css
.board-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
.board-scroll::-webkit-scrollbar-track { background: transparent; }
.board-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 2px;
}
.board-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}
```

## Sidebar
- Width: 240px
- Active project: brand-500/15 bg, brand-400 text, brand-500/40 left border
- Hover: surface-3 bg
- Font: 13px/medium
- Collapse: < 768px hidden, accessible via Sheet (Shadcn)

## Navbar
- Height: 56px (h-14)
- Left: logo + current project name
- Right: member avatars (up to 4, then +N), invite button, user menu
- Separator: `border-b border-white/[0.06] backdrop-blur-sm bg-surface-0/80`

## Responsive Breakpoints
```
sm (640px):  single column view, sidebar hidden
md (768px):  sidebar appears as overlay
lg (1024px): sidebar always visible, board scrollable
xl (1280px): comfortable board with full column widths
```
