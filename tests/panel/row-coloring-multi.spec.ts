import { expect, test } from '@grafana/plugin-e2e';

// Datatable-RowColoring-Multi.json: 4 panels, 5 columns each
// (Time, Host, CPU%, Memory%, Disk%) — all three metric columns use colorMode=row.
//
// colorMode=row: ALL cells in a row (including METRIC cells) get the worst
// threshold color across all Row-mode columns, all via setProperty(!important).
//
// The four panels prove:
//   Panel 0 — all green:  CPU/Mem/Disk all < 10   → every cell green
//   Panel 1 — all orange: CPU/Mem/Disk all 10-19  → every cell orange
//   Panel 2 — all red:    CPU/Mem/Disk all ≥ 20   → every cell red
//   Panel 3 — worst wins: rows with different per-column thresholds;
//             the highest threshold index drives the whole row

const GREEN  = 'rgb(41, 156, 70)';
const ORANGE = 'rgb(237, 129, 40)';
const RED    = 'rgb(245, 54, 54)';

const TOTAL_COLUMNS = 5; // Time, Host, CPU%, Memory%, Disk%

// Expected worst row color per row of the mixed panel (panel 3):
// Row 0: CPU=5(G),  Mem=5(G),  Disk=5(G)   → GREEN
// Row 1: CPU=5(G),  Mem=15(O), Disk=5(G)   → ORANGE  (Memory pushes)
// Row 2: CPU=5(G),  Mem=5(G),  Disk=25(R)  → RED     (Disk pushes)
// Row 3: CPU=15(O), Mem=25(R), Disk=5(G)   → RED     (Memory pushes)
// Row 4: CPU=5(G),  Mem=15(O), Disk=15(O)  → ORANGE  (two columns at orange)
const MIXED_ROW_WORST = [GREEN, ORANGE, RED, RED, ORANGE];

async function assertAllCellsSameColor(
  page: import('@playwright/test').Page,
  panelIndex: number,
  expectedColor: string,
  label: string,
) {
  const table = page.locator('[data-testid="datatable-panel-table"]:has(tbody tr)').nth(panelIndex);

  await test.step(`wait for rows — ${label}`, async () => {
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step(`all cells have ${label} color with !important`, async () => {
    await expect
      .poll(
        async () => {
          const rows = table.locator('tbody tr');
          const rowCount = await rows.count();
          if (rowCount === 0) { return 'no rows'; }
          for (let r = 0; r < rowCount; r++) {
            const cells = rows.nth(r).locator('td');
            const cellCount = await cells.count();
            if (cellCount !== TOTAL_COLUMNS) {
              return `row ${r}: expected ${TOTAL_COLUMNS} cells, got ${cellCount}`;
            }
            for (let c = 0; c < TOTAL_COLUMNS; c++) {
              const result = await cells.nth(c).evaluate((el: HTMLElement) => ({
                bg: el.style.backgroundColor,
                priority: el.style.getPropertyPriority('background-color'),
              }));
              if (result.bg !== expectedColor) {
                return `row ${r} col ${c}: expected "${expectedColor}", got "${result.bg}"`;
              }
              if (result.priority !== 'important') {
                return `row ${r} col ${c}: expected !important, got "${result.priority}"`;
              }
            }
          }
          return 'ok';
        },
        { timeout: 10000, message: `panel ${panelIndex}: all cells must be ${label} with !important` }
      )
      .toBe('ok');
  });
}

test('row coloring (multi-metric) — all green when all metrics below threshold 10', async ({
  readProvisionedDashboard, gotoDashboardPage, page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring-Multi.json' });
  await gotoDashboardPage({ uid: dashboard.uid });
  await assertAllCellsSameColor(page, 0, GREEN, 'green');
});

test('row coloring (multi-metric) — all orange when all metrics 10–19', async ({
  readProvisionedDashboard, gotoDashboardPage, page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring-Multi.json' });
  await gotoDashboardPage({ uid: dashboard.uid });
  await assertAllCellsSameColor(page, 1, ORANGE, 'orange');
});

test('row coloring (multi-metric) — all red when all metrics ≥ 20', async ({
  readProvisionedDashboard, gotoDashboardPage, page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring-Multi.json' });
  await gotoDashboardPage({ uid: dashboard.uid });
  await assertAllCellsSameColor(page, 2, RED, 'red');
});

test('row coloring (multi-metric) — worst threshold across columns colors entire row', async ({
  readProvisionedDashboard, gotoDashboardPage, page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring-Multi.json' });
  await gotoDashboardPage({ uid: dashboard.uid });

  const table = page.locator('[data-testid="datatable-panel-table"]:has(tbody tr)').nth(3);

  await test.step('wait for mixed panel rows', async () => {
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('each row shows worst threshold color across all metric columns', async () => {
    await expect
      .poll(
        async () => {
          const rows = table.locator('tbody tr');
          if (await rows.count() !== MIXED_ROW_WORST.length) {
            return `expected ${MIXED_ROW_WORST.length} rows, got ${await rows.count()}`;
          }
          for (let r = 0; r < MIXED_ROW_WORST.length; r++) {
            const expected = MIXED_ROW_WORST[r];
            const cells = rows.nth(r).locator('td');
            for (let c = 0; c < TOTAL_COLUMNS; c++) {
              const result = await cells.nth(c).evaluate((el: HTMLElement) => ({
                bg: el.style.backgroundColor,
                priority: el.style.getPropertyPriority('background-color'),
              }));
              if (result.bg !== expected) {
                return `row ${r} col ${c}: expected worst "${expected}", got "${result.bg}"`;
              }
              if (result.priority !== 'important') {
                return `row ${r} col ${c}: expected !important, got "${result.priority}"`;
              }
            }
          }
          return 'ok';
        },
        { timeout: 10000, message: 'worst-color panel: each row must show the worst threshold across all metric columns' }
      )
      .toBe('ok');
  });
});
