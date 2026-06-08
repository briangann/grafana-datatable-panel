# Example Set 02 — Server / Host Metrics

Demonstrates per-column threshold coloring, row numbers, pagination, and clickthrough to a host detail view.

## What this showcases

- **Row numbers** — numbered rows enabled in the DataTable options
- **Per-column thresholds** — CPU, Memory, Disk each have independent thresholds
- **Cell coloring** — each metric column colors its own cells; one bad column does not color the whole row
- **Pagination** — large dataset with configurable rows per page
- **Column width hints** — Last Updated column gets explicit width
- **Clickthrough** — click a hostname to open a per-host detail view

## Import order

Import **detail.json first**, then overview.json, then landing.json.

## Datasource required

- **TestData DB** — built in, no setup needed
