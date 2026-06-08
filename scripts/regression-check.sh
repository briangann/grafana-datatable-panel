#!/usr/bin/env bash
# regression-check.sh — run the e2e suite against the released plugin and
# the local dev build, then report tests that PASSED on released but FAIL on
# dev (unexpected regressions).
#
# Usage: ./scripts/regression-check.sh
#
# Prerequisites:
#   - Docker running
#   - Local dev container already running on port 3000 (docker compose up)
#   - pnpm and npx available

set -uo pipefail   # note: no -e so test failures don't abort the script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
# Use /tmp — NOT inside test-results/ because Playwright cleans that dir at startup
RESULTS_DIR="/tmp/pw-regression-check"

RELEASED_URL="http://localhost:3001"
DEV_URL="http://localhost:3000"
RELEASED_JSON="$RESULTS_DIR/released.json"
DEV_JSON="$RESULTS_DIR/dev.json"

mkdir -p "$RESULTS_DIR"

# ---------------------------------------------------------------------------
# 1. Start the released-version container
# ---------------------------------------------------------------------------
echo "▶ Starting released plugin container (port 3001)..."
docker compose -f "$REPO_DIR/docker-compose.released.yml" up -d 2>&1 | grep -v "^$" || true

echo "▶ Waiting for released Grafana to be ready..."
for i in $(seq 1 30); do
  if curl -sf "$RELEASED_URL/api/health" 2>/dev/null | grep -q '"database": "ok"'; then
    echo "  ✓ Ready after ${i}s"
    break
  fi
  sleep 2
done

# ---------------------------------------------------------------------------
# 2. Run e2e suite against RELEASED plugin — list reporter for visibility,
#    json reporter to file for comparison
# ---------------------------------------------------------------------------
echo ""
echo "▶ Running e2e suite against RELEASED plugin (v2.0.2)..."
echo "  (many failures expected — only regressions matter)"
echo ""
cd "$REPO_DIR"
# First pass: list reporter for real-time progress
GRAFANA_URL="$RELEASED_URL" npx playwright test --reporter=list || true
# Second pass: json reporter — stdout → file for diff
GRAFANA_URL="$RELEASED_URL" npx playwright test --reporter=json > "$RELEASED_JSON" 2>/dev/null || true

echo ""
echo "  JSON results → $RELEASED_JSON"

# ---------------------------------------------------------------------------
# 3. Run e2e suite against DEV build
# ---------------------------------------------------------------------------
echo ""
echo "▶ Running e2e suite against DEV build..."
echo ""
GRAFANA_URL="$DEV_URL" npx playwright test --reporter=list || true
mkdir -p "$(dirname "$DEV_JSON")"
GRAFANA_URL="$DEV_URL" npx playwright test --reporter=json > "$DEV_JSON" 2>/dev/null || true

echo ""
echo "  JSON results → $DEV_JSON"

# ---------------------------------------------------------------------------
# 4. Stop the released container
# ---------------------------------------------------------------------------
echo ""
echo "▶ Stopping released container..."
docker compose -f "$REPO_DIR/docker-compose.released.yml" down 2>&1 | grep -v "^$" || true

# ---------------------------------------------------------------------------
# 5. Diff: passed on released → failed on dev = regression
# ---------------------------------------------------------------------------
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " REGRESSION REPORT"
echo "═══════════════════════════════════════════════════════════"

python3 - "$RELEASED_JSON" "$DEV_JSON" <<'PYEOF'
import json, sys

def collect_specs(suites, prefix=""):
    """Recursively walk nested suites, yield (title, ok) for each spec."""
    for suite in suites:
        title = suite.get("title", "")
        full = f"{prefix} › {title}".strip(" › ") if prefix else title
        for spec in suite.get("specs", []):
            spec_title = f"{full} › {spec['title']}".strip(" › ")
            yield spec_title, spec.get("ok", False)
        yield from collect_specs(suite.get("suites", []), full)

def load_results(path):
    try:
        with open(path) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"  WARNING: could not load {path}: {e}", file=sys.stderr)
        return {}
    results = {}
    for title, ok in collect_specs(data.get("suites", [])):
        results[title] = "passed" if ok else "failed"
    return results

released = load_results(sys.argv[1])
dev      = load_results(sys.argv[2])

regressions = []
improvements = []
new_failures = []

for title, released_status in released.items():
    dev_status = dev.get(title, "missing")
    if released_status == "passed" and dev_status in ("failed", "missing"):
        regressions.append((title, dev_status))
    elif released_status == "failed" and dev_status == "passed":
        improvements.append(title)

for title, dev_status in dev.items():
    if title not in released and dev_status == "failed":
        new_failures.append(title)

released_pass = sum(1 for s in released.values() if s == "passed")
dev_pass      = sum(1 for s in dev.values()      if s == "passed")

import os
os.environ["PYTHONUNBUFFERED"] = "1"

def p(*args, **kwargs):
    print(*args, **kwargs, flush=True)

p(f"\n  Released v2.0.2 : {released_pass}/{len(released)} passed")
p(f"  Dev build       : {dev_pass}/{len(dev)} passed")

if regressions:
    p(f"\n🔴 UNEXPECTED REGRESSIONS ({len(regressions)})")
    p("   Passed on released → failed/missing on dev:\n")
    for t, status in regressions:
        p(f"   • [{status}] {t}")
else:
    p("\n✅ No unexpected regressions")
    p("   Every test that passed on v2.0.2 also passes on dev")

if improvements:
    p(f"\n🟢 IMPROVEMENTS ({len(improvements)})")
    p("   Failed on released → now pass on dev:\n")
    for t in improvements:
        p(f"   • {t}")

if new_failures:
    p(f"\n⚪ NEW TESTS FAILING on dev ({len(new_failures)})")
    p("   Not in released — expected for newly added features:\n")
    for t in new_failures:
        p(f"   • {t}")
PYEOF
