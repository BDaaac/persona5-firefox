# Menu v18 — falling paper and clock

- Paper falls from above. The knife starts hidden, follows vertically, and catches the top-center anchor at 700 ms. Paper settles by 1000 ms; the pin then uses static CSS with no retained animation effects.
- The clock replaces the upper-left logo: outlined digits, red colon, separate weekday/date strips. It updates on minute boundaries and pauses its timer while the document is hidden.
- Characters exit and enter sequentially with small horizontal movement. Rapid changes cancel stale transitions; two portraits are never shown together. Other portraits load/decode on hover, focus, or selection, with a shared promise per asset.
- Removed redundant background, menu-row, and character rotation animations. Weather requests are deduplicated while loading. Search, links, notes, and calendar behavior remain intact.

## Local Chromium measurement

Same isolated fixture, 28 selections spaced 90 ms apart. These are local observations, not an FPS or cross-browser guarantee.

| Metric | v17 | v18 |
|---|---:|---:|
| Peak running animations | 22 | 12 |
| Peak visible portraits | 2 | 1 |
| Animation effects retained at idle | 2 | 0 |
| Synchronous selection median | 6.6 ms | 5.3 ms |
| Synchronous selection p95 | 25.9 ms | 8.3 ms |
| Frame interval median | 16.7 ms | 16.7 ms |
| Frame interval p95 | 16.8 ms | 17.0 ms |

The frame interval stayed essentially unchanged. The improvement is fewer simultaneous effects, no overlapping portraits, and lower measured selection work. Initial character requests decreased from seven to one; calendar assets are unchanged.

Evidence: `performance-v17-baseline.json`, `performance-v18.json`, `menu-v18-checks.txt`, `intro-v18-checks.txt`. Browser fixtures use isolated storage and do not modify the user's saved destinations or notes. Native Firefox was not tested in this environment.
