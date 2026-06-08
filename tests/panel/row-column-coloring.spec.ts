import { expect, test } from '@grafana/plugin-e2e';

// Datatable-RowColumnColoring.json has one panel with 5 columns:
//   Time (date, non-metric), Host (string, non-metric),
//   CPU% (METRIC/row-column), Memory% (METRIC/row-column), Disk% (METRIC/row-column)
//
// colorMode=row-column behavior:
//   - Non-METRIC cells (Time, Host) receive the WORST row threshold color via
//     applyRowColumnColor, using setProperty(..., 'important').
//   - Each METRIC cell (CPU%, Memory%, Disk%) keeps its OWN per-cell threshold
//     color via computeMetricCellColors — uses jQuery .css(), no !important.
//
// We verify both the color VALUES and the CSS priority (!important vs not) to
// confirm each cell was painted by the correct code path.

const GREEN  = 'rgb(41, 156, 70)';   // #299c46
const ORANGE = 'rgb(237, 129, 40)';  // #ed8128
const RED    = 'rgb(245, 54, 54)';   // #f53636

// Column indices in the rendered table
const NON_METRIC = [0, 1];           // Time, Host — painted by applyRowColumnColor
const METRIC     = [2, 3, 4];        // CPU%, Memory%, Disk% — keep own per-cell color

// Static CSV rows and their expected colors:
//   CPU%=5  → GREEN,  CPU%=15 → ORANGE,  CPU%=25 → RED
//   Memory%=5 → GREEN, Memory%=15 → ORANGE, Memory%=25 → RED
//   Disk%=5 → GREEN,  Disk%=15  → ORANGE, Disk%=25  → RED
//   Row worst = highest threshold index across all 3 metric columns.
//
// Row 0: CPU=5(G),  Mem=5(G),  Disk=5(G)   → row worst = GREEN
// Row 1: CPU=5(G),  Mem=15(O), Disk=5(G)   → row worst = ORANGE
// Row 2: CPU=5(G),  Mem=5(G),  Disk=25(R)  → row worst = RED
// Row 3: CPU=15(O), Mem=25(R), Disk=5(G)   → row worst = RED
// Row 4: CPU=5(G),  Mem=15(O), Disk=15(O)  → row worst = ORANGE
const ROW_EXPECTATIONS = [
  { rowWorst: GREEN,  metricColors: [GREEN,  GREEN,  GREEN]  },
  { rowWorst: ORANGE, metricColors: [GREEN,  ORANGE, GREEN]  },
  { rowWorst: RED,    metricColors: [GREEN,  GREEN,  RED]    },
  { rowWorst: RED,    metricColors: [ORANGE, RED,    GREEN]  },
  { rowWorst: ORANGE, metricColors: [GREEN,  ORANGE, ORANGE] },
];

test('row-column coloring — non-METRIC cells get worst row color (!important); each METRIC cell keeps its own per-cell color (no !important)', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColumnColoring.json' });
  await gotoDashboardPage({ uid: dashboard.uid });

  const table = page.locator('[data-testid="datatable-panel-table"]:has(tbody tr)').first();

  await test.step('wait for rows to render', async () => {
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('non-METRIC cells (Time, Host) get worst row color with !important', async () => {
    await expect
      .poll(
        async () => {
          const rows = table.locator('tbody tr');
          if (await rows.count() !== ROW_EXPECTATIONS.length) {
            return `expected ${ROW_EXPECTATIONS.length} rows, got ${await rows.count()}`;
          }
          for (let r = 0; r < ROW_EXPECTATIONS.length; r++) {
            const { rowWorst } = ROW_EXPECTATIONS[r];
            const cells = rows.nth(r).locator('td');
            for (const c of NON_METRIC) {
              const result = await cells.nth(c).evaluate((el: HTMLElement) => ({
                bg: el.style.backgroundColor,
                priority: el.style.getPropertyPriority('background-color'),
              }));
              if (result.bg !== rowWorst) {
                return `row ${r} col ${c}: expected "${rowWorst}", got "${result.bg}"`;
              }
              if (result.priority !== 'important') {
                return `row ${r} col ${c}: expected !important, got "${result.priority}" — wrong code path`;
              }
            }
          }
          return 'ok';
        },
        { timeout: 10000, message: 'non-METRIC cells must have worst row color with !important' }
      )
      .toBe('ok');
  });

  await test.step('each METRIC cell (CPU%, Memory%, Disk%) has its own per-cell color without !important', async () => {
    await expect
      .poll(
        async () => {
          const rows = table.locator('tbody tr');
          for (let r = 0; r < ROW_EXPECTATIONS.length; r++) {
            const { metricColors } = ROW_EXPECTATIONS[r];
            const cells = rows.nth(r).locator('td');
            for (let m = 0; m < METRIC.length; m++) {
              const c = METRIC[m];
              const result = await cells.nth(c).evaluate((el: HTMLElement) => ({
                bg: el.style.backgroundColor,
                priority: el.style.getPropertyPriority('background-color'),
              }));
              if (result.bg !== metricColors[m]) {
                return `row ${r} METRIC col ${c}: expected own color "${metricColors[m]}", got "${result.bg}"`;
              }
              if (result.priority === 'important') {
                return `row ${r} METRIC col ${c}: has !important — was incorrectly painted by applyRowColumnColor instead of computeMetricCellColors`;
              }
            }
          }
          return 'ok';
        },
        { timeout: 10000, message: 'METRIC cells must have own per-cell color without !important' }
      )
      .toBe('ok');
  });
});
