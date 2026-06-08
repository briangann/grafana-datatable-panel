# Example Set 05 — Network Topology

Demonstrates mixed column types (IP address, MAC, port speed), value mappings for port speed, status row coloring, and clickthrough to device management interfaces.

## What this showcases

- **Mixed column types** — text, numeric speed, IP, MAC in the same table
- **Value mappings for speed** — 1000 → "1G", 10000 → "10G", 100000 → "100G"
- **Row coloring by port status** — UP=green, DOWN=red, DISABLED=gray
- **Hidden URL column** — management interface URL in a hidden column, used in clickthrough via `$__cell_8`
- **Column width hints** — MAC and IP columns narrow, Description wide
- **Search** — find devices by name, IP, or MAC
- **Infinity datasource** — inline JSON, no external API needed

## Import order

Import landing.json then topology.json.

## Datasource required

- **Infinity** — install from the Grafana plugin catalog (`yesoreyeram-infinity-datasource`).
  Add an Infinity datasource instance named "Infinity" in Grafana settings.
  No external API calls — all data is inline JSON.
