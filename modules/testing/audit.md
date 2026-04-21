# Module: Testing

## Check

- [ ] `vitest` in devDependencies
- [ ] `@testing-library/react` in devDependencies
- [ ] `@testing-library/jest-dom` in devDependencies
- [ ] `vitest.config.ts` exists with React + jsdom setup
- [ ] `playwright` in devDependencies
- [ ] `playwright.config.ts` exists
- [ ] `axe-core` or `@axe-core/playwright` in devDependencies
- [ ] `package.json` has `"test"` script (vitest)
- [ ] `package.json` has `"test:e2e"` script (playwright)

## Apply

1. Run `pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom`
2. Run `pnpm add -D @playwright/test @axe-core/playwright`
3. Copy `vitest.config.ts` from this module to project root
4. Copy `playwright.config.ts` from this module to project root
5. Add scripts to `package.json`:
   ```json
   "test": "vitest",
   "test:ui": "vitest --ui",
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui"
   ```
6. Run `pnpm exec playwright install` to install browsers

## Conflicts

- If project uses Jest, flag for manual review — migration from Jest to Vitest may require updating test syntax (usually minimal)
- Preserve existing test files — they likely work with Vitest with minimal changes
