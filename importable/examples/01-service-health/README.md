# Example Set 01 — Service Health

Demonstrates threshold coloring, clickthrough navigation, and template variable passthrough.

## What this showcases

- **Row coloring** — entire row colored by the worst threshold in any metric column
- **Cell coloring** — individual cells colored independently (Latency column)
- **RowColumn coloring** — row + column both highlighted (Error Rate)
- **Clickthrough links** — click a service name to drill into a per-service detail view
- **Hidden columns** — service_id column hidden but used in clickthrough URL via `$__cell_N`
- **Template variables** — detail dashboard receives `$service` from the clickthrough URL
- **Search and sort** — find services by name; sort by any column

## Import order

Import **detail.json first**, then overview.json, then landing.json.
This ensures the UIDs exist before the clickthrough links in overview.json are active.

## Datasource required

- **TestData DB** — built into every Grafana instance, no setup needed

## Try this

1. Open the landing page
2. Open the overview — notice rows colored red for services with high error rates
3. Click a service name in the **Service** column
4. The detail view opens, pre-filtered to that service via the `$service` variable
