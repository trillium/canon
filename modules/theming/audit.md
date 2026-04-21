# Module: Theming

## Check

- [ ] `next-themes` in dependencies
- [ ] `ThemeProvider` component exists in `src/providers/ThemeProvider.tsx`
- [ ] `ThemeProvider` uses `attribute="class"` for Tailwind dark mode compatibility
- [ ] `ThemeProvider` uses `defaultTheme="system"` and `enableSystem`
- [ ] `ThemeProvider` uses `disableTransitionOnChange` to prevent flash
- [ ] `ThemeProvider` wraps the app in root layout
- [ ] `suppressHydrationWarning` is set on `<html>` element in root layout
- [ ] `globals.css` defines CSS custom properties for light and dark themes
- [ ] CSS variables follow the shadcn/ui naming convention (e.g., `--background`, `--foreground`, `--primary`)
- [ ] Dark theme variables are scoped under `.dark` class selector

## Apply

1. Run `pnpm add next-themes`
2. Copy `ThemeProvider.tsx` from this module to `src/providers/ThemeProvider.tsx`
3. Wrap the app with `<ThemeProvider>` in `src/app/layout.tsx` (outermost provider, inside `<body>`)
4. Add `suppressHydrationWarning` to the `<html>` element in root layout
5. Update `globals.css` with CSS custom property definitions for light and dark themes
6. Tailwind dark mode utilities (e.g., `dark:bg-gray-900`) will work automatically via the class strategy

## Conflicts

- If project already has a custom theme system, evaluate whether to replace or wrap it
- If project uses Tailwind's `media` dark mode strategy instead of `class`, switch to `class` — `next-themes` requires it
- If project has inline `style` attributes for theming, they will not respond to the class toggle — flag for migration
