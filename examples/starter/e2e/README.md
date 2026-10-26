# End-to-end and visual tests

- `smoke.spec.ts`: pages render, and `@a11y` tests run axe-core.
- `visual.spec.ts`: `@visual` screenshot tests. They are how the project tracks what the UI looks like.

## Visual baselines

One baseline per page and colour scheme (light and dark) lives in `e2e/__screenshots__/visual.spec.ts/`. The `Visual` workflow (`.github/workflows/visual.yml`) renders the production build in the pinned `mcr.microsoft.com/playwright` image and fails the pull request when any page differs from its baseline. The failing run uploads the actual, expected and diff images as the `visual-diffs` artifact.

Baselines are generated only in that image, never on a laptop: fonts and anti-aliasing differ between operating systems, so a macOS or Windows screenshot would fail in CI.

```
pnpm run test:visual           # compare, inside the pinned image (needs Docker)
pnpm run test:visual:update    # regenerate baselines after an intended UI change
```

After an intended change: run `pnpm run test:visual:update`, review the changed images in the diff, and commit them with the change.

When you upgrade `@playwright/test`, change the image tag in `.github/workflows/visual.yml` to the same version (`pnpm run check:profile` fails if they differ) and regenerate the baselines.

Add a page to `PAGES` in `visual.spec.ts` when you add a route.
