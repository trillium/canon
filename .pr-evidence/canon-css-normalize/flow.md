```mermaid
flowchart LR
  A[Before: system fonts] --> B[Mac and Linux render differently] --> C[Docker needed for visual tests]
  D[After: normalize.css + self-hosted fonts] --> E[Consistent fonts and rendering settings across browsers] --> F[Pixel baselines on one native Linux runner, no Docker]
```

check:css output:
```
$ pnpm run check:css
check:css ok
```
