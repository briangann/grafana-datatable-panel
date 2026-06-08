# Example Set 03 — Space Launches

Demonstrates the Infinity datasource with inline JSON, value mappings, external clickthrough URLs, and search across all columns.

## What this showcases

- **Infinity datasource** — inline JSON data embedded directly in the query, no external endpoint needed
- **Value mappings** — numeric status field mapped to human-readable labels with icons (✓ Success, ✗ Failure, ⚠ Partial)
- **External clickthrough** — clicking an organization name opens their website
- **Hidden URL column** — org URL stored in a hidden column, referenced via `$__cell_7`
- **Search** — find launches by rocket name, organization, or payload
- **Row coloring by status** — green/red/yellow rows

## Import order

Import landing.json, then launches.json.

## Datasource required

- **Infinity** — install from the Grafana plugin catalog (`yesoreyeram-infinity-datasource`).
  After installing, add an Infinity datasource instance named "Infinity" in Grafana settings.
  No external API calls are made — all data is inline JSON.
