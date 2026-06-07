# Example Set 06 — Rack Inventory

Demonstrates device type icons via value mappings, monitoring status row coloring, null handling, and management URL clickthrough.

## What this showcases

- **Device type value mappings** — type codes mapped to icons: 🔀 Switch, 🔁 Router, 🔌 Patch Panel, ⚡ UPS, 🖥️ Server, 🔋 PDU, 📡 Access Point
- **Row coloring by monitoring status** — Monitored=green, Unmonitored=orange, Offline=red
- **Null handling** — devices without an IP (patch panels, PDUs) display "-" via `emptyDataText`
- **Management URL clickthrough** — click a device name to open its management interface
- **Rack unit sorting** — table sorts by rack then rack unit (physical layout order)
- **Hidden URL column** — mgmt_url in a hidden column used for clickthrough via `$__cell_8`
- **Infinity datasource** — inline JSON, no external API needed

## Import order

Import landing.json then inventory.json.

## Datasource required

- **Infinity** — install from the Grafana plugin catalog (`yesoreyeram-infinity-datasource`).
  Add an Infinity datasource instance named "Infinity" in Grafana settings. No external API calls.
