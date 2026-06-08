# DataTable Panel — Example Dashboards

Six sets of importable Grafana dashboards showcasing the major features of the [briangann-datatable-panel](https://github.com/briangann/grafana-datatable-panel) plugin.

## Sets

| # | Set | Datasource | Key features |
|---|-----|-----------|-------------|
| [01](./01-service-health/) | Service Health | TestData | Row/cell/RowColumn coloring, clickthrough → detail, hidden columns, template vars |
| [02](./02-server-metrics/) | Server Metrics | TestData | Per-column thresholds, row numbers, pagination, clickthrough |
| [03](./03-space-launches/) | Space Launches | Infinity | Inline JSON, value mappings, external clickthrough URLs |
| [04](./04-logs/) | Log Search | TestData | Timestamp formatting, level coloring, search, column filters |
| [05](./05-network-topology/) | Network Topology | Infinity | Mixed types (IP/MAC/speed), value mappings, clickthrough to mgmt UI |
| [06](./06-rack-inventory/) | Rack Inventory | Infinity | Device icons via value mappings, null handling, monitoring status coloring |

## Prerequisites

- **Grafana** 11.x or later
- **briangann-datatable-panel** installed (unsigned; allow via `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=briangann-datatable-panel`)
- **Infinity datasource** (for sets 03, 05, 06) — install from the Grafana plugin catalog, create an instance named "Infinity"

## How to import

1. In Grafana: Dashboards → New → Import
2. Upload the JSON file or paste its contents
3. Map the datasource(s) when prompted
4. For sets with cross-linked dashboards, see the per-set README for import order

## Quick start (local Docker)

```bash
docker compose up
```

Grafana available at `http://localhost:3000` (admin/admin).
