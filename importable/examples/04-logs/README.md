# Example Set 04 — Log Search

Demonstrates timestamp formatting, level-based coloring, search, and column filtering for log-style data.

## What this showcases

- **Timestamp formatting** — DATE style with `YYYY-MM-DD HH:mm:ss` format
- **Level coloring** — ERROR=red, WARN=orange, INFO=blue, DEBUG=gray via cell coloring on `level_num`
- **Value mappings** — numeric level_num (0/1/2/3) mapped to DEBUG/INFO/WARN/ERROR labels
- **Search bar** — primary interaction; searches across all visible columns with highlighting
- **Column filters** — per-column filter dropdowns (`columnFiltersEnabled: true`)
- **Wide message column** — 50% width hint so message dominates the table
- **Large page size** — 50 rows per page for log density

## Import order

Import landing.json then logs.json.

## Datasource required

- **TestData DB** — built in, no setup needed
