# Typography

## Font Pairing
```ts
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});
```

## Type Scale
```
xs:   11px / line-height 1.4 / weight 400 → timestamps, metadata
sm:   13px / line-height 1.5 / weight 400 → secondary text, labels
base: 14px / line-height 1.6 / weight 400 → body, card descriptions
md:   16px / line-height 1.6 / weight 500 → card titles, form labels
lg:   18px / line-height 1.4 / weight 600 → column headers
xl:   22px / line-height 1.3 / weight 600 → page headings
2xl:  28px / line-height 1.2 / weight 600 → hero text (auth pages)
```

## Usage Rules
- Card titles: `text-[14px] font-medium leading-snug text-slate-100`
- Column headers: `text-[13px] font-semibold uppercase tracking-widest text-slate-400`
- Timestamps: `font-mono text-[11px] text-slate-500`
- Priority badges: `text-[11px] font-medium uppercase tracking-wide`
- All body text: Plus Jakarta Sans
- Code/IDs: JetBrains Mono
- Never use `font-bold` (700) in the board UI — 600 is the maximum
