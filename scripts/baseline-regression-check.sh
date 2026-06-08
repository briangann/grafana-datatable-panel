#!/usr/bin/env bash
# baseline-regression-check.sh — genuine regression check.
#
# Runs ONLY the test files that existed before our changes (the stable
# baseline) against both the released plugin and the dev build. Any test
# that passed on the released plugin but now fails on dev is a true
# regression introduced by our code.
#
# New test files (row-coloring, row-column-coloring) are explicitly excluded
# because those test features that didn't exist in the released plugin —
# running them here would only produce noise.
#
# Usage: ./scripts/baseline-regression-check.sh
#
# Requires: docker running, dev container already on port 3000

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

# Test files that existed before PR #329 and were not modified by it.
# These form the stable baseline: if they pass on released they must pass on dev.
BASELINE_TESTS=(
  tests/panel/clickthrough-urls.spec.ts
  tests/panel/column-filter.spec.ts
  tests/panel/column-styles.spec.ts
  tests/panel/paging.spec.ts
  tests/panel/rendering.spec.ts
  tests/panel/row-numbers.spec.ts
  tests/panel/sorting.spec.ts
  tests/panel/text-alignment.spec.ts
  tests/panel/thresholds.spec.ts
  tests/setup/grafana-version.spec.ts
  tests/setup/plugin-installed.spec.ts
  tests/setup/ui-setup.spec.ts
)

RELEASED_URL="http://localhost:3001"
DEV_URL="http://localhost:3000"
RESULTS_DIR="/tmp/pw-baseline-regression"
RELEASED_JSON="$RESULTS_DIR/baseline-released.json"
DEV_JSON="$RESULTS_DIR/baseline-dev.json"

mkdir -p "$RESULTS_DIR"

# ---------------------------------------------------------------------------
# 1. Start released container
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
# 2. Run BASELINE tests against RELEASED plugin
# ---------------------------------------------------------------------------
echo ""
echo "▶ Running BASELINE tests against RELEASED plugin (v2.0.2)..."
echo "  (${#BASELINE_TESTS[@]} test files — features that existed before our changes)"
echo ""
cd "$REPO_DIR"
# In CI skip the progress pass (no TTY, saves time); locally show live output.
if [[ "${CI:-}" != "true" ]]; then
  GRAFANA_URL="$RELEASED_URL" npx playwright test "${BASELINE_TESTS[@]}" --reporter=list || true
fi
GRAFANA_URL="$RELEASED_URL" npx playwright test "${BASELINE_TESTS[@]}" --reporter=json > "$RELEASED_JSON" 2>/dev/null || true
echo "  JSON → $RELEASED_JSON"

# ---------------------------------------------------------------------------
# 3. Run BASELINE tests against DEV build
# ---------------------------------------------------------------------------
echo ""
echo "▶ Running BASELINE tests against DEV build..."
echo ""
if [[ "${CI:-}" != "true" ]]; then
  GRAFANA_URL="$DEV_URL" npx playwright test "${BASELINE_TESTS[@]}" --reporter=list || true
fi
GRAFANA_URL="$DEV_URL" npx playwright test "${BASELINE_TESTS[@]}" --reporter=json > "$DEV_JSON" 2>/dev/null || true
echo "  JSON → $DEV_JSON"

# ---------------------------------------------------------------------------
# 4. Stop released container
# ---------------------------------------------------------------------------
echo ""
echo "▶ Stopping released container..."
docker compose -f "$REPO_DIR/docker-compose.released.yml" down 2>&1 | grep -v "^$" || true

# ---------------------------------------------------------------------------
# 5. Report
# ---------------------------------------------------------------------------
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " BASELINE REGRESSION REPORT"
echo " (only tests that existed before our changes)"
echo "═══════════════════════════════════════════════════════════"

python3 - "$RELEASED_JSON" "$DEV_JSON" <<'PYEOF'
import json, sys, os
os.environ["PYTHONUNBUFFERED"] = "1"

def p(*args, **kwargs): print(*args, **kwargs, flush=True)

def collect_specs(suites, prefix=""):
    for suite in suites:
        title = suite.get("title", "")
        full = f"{prefix} › {title}".strip(" › ") if prefix else title
        for spec in suite.get("specs", []):
            yield f"{full} › {spec['title']}".strip(" › "), spec.get("ok", False)
        yield from collect_specs(suite.get("suites", []), full)

def load_results(path):
    try:
        with open(path) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        p(f"  WARNING: could not load {path}: {e}", file=sys.stderr)
        return {}
    return {title: ("passed" if ok else "failed") for title, ok in collect_specs(data.get("suites", []))}

released = load_results(sys.argv[1])
dev      = load_results(sys.argv[2])

released_pass = sum(1 for s in released.values() if s == "passed")
dev_pass      = sum(1 for s in dev.values()      if s == "passed")

# Tests that passed on released but fail on dev = genuine regressions we introduced
regressions = [
    (t, dev.get(t, "missing"))
    for t, s in released.items()
    if s == "passed" and dev.get(t, "missing") != "passed"
]

# Tests that failed on released but pass on dev = improvements (within baseline scope)
improvements = [t for t, s in released.items() if s == "failed" and dev.get(t) == "passed"]

p(f"\n  Released v2.0.2 : {released_pass}/{len(released)} baseline tests passed")
p(f"  Dev build       : {dev_pass}/{len(dev)} baseline tests passed")

if regressions:
    p(f"\n🔴 TRUE REGRESSIONS ({len(regressions)})")
    p("   These passed on the released plugin and now fail on dev.\n")
    for t, status in regressions:
        p(f"   • [{status}] {t}")
    p("\n   ↑ These are genuine bugs introduced by our changes.")
    sys.exit(1)
else:
    p("\n✅ No regressions in baseline tests")
    p("   Every baseline test that passed on v2.0.2 also passes on dev")

if improvements:
    p(f"\n🟢 BASELINE IMPROVEMENTS ({len(improvements)})")
    p("   Baseline tests that failed on released but now pass on dev:\n")
    for t in improvements:
        p(f"   • {t}")
PYEOF
