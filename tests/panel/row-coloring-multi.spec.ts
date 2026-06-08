import { expect, test } from '@grafana/plugin-e2e';

// Datatable-RowColoring-Multi.json: 5 columns (Time, Host, CPU%, Memory%, Disk%)
// ALL three metric columns use colorMode=row.
//
// colorMode=row behavior:
//   - ALL cells in a row — including the METRIC cells — receive the WORST
//     threshold color across all Row-mode columns, all via setProperty(!important).
//   - The "worst" = highest bgColorIndex across CPU%, Memory%, Disk%.
//
// This verifies the multi-column worst-color logic in applyRowColor, which
// iterates all entries in rowColorColumnIndices (3 columns here) and picks
// the highest threshold index.

const GREEN  = 'rgb(41, 156, 70)';   // #299c46
const ORANGE = 'rgb(237, 129, 40)';  // #ed8128
const RED    = 'rgb(245, 54, 54)';   // #f53636

// Static CSV rows and expected worst row color:
// Row 0: CPU=5(G),  Mem=5(G),  Disk=5(G)   → GREEN
// Row 1: CPU=5(G),  Mem=15(O), Disk=5(G)   → ORANGE  (Memory worst)
// Row 2: CPU=5(G),  Mem=5(G),  Disk=25(R)  → RED     (Disk worst)
// Row 3: CPU=15(O), Mem=25(R), Disk=5(G)   → RED     (Memory worst)
// Row 4: CPU=5(G),  Mem=15(O), Disk=15(O)  → ORANGE  (Memory/Disk tied)
const ROW_WORST = [GREEN, ORANGE, RED, RED, ORANGE];

const TOTAL_COLUMNS = 5; // Time, Host, CPU%, Memory%, Disk%

test('row coloring (multi-metric) — worst threshold across CPU%/Memory%/Disk% colors ALL cells in every row', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring-Multi.json' });
  await gotoDashboardPage({ uid: dashboard.uid });

  const table = page.locator('[data-testid="datatable-panel-table"]:has(tbody tr)').first();

  await test.step('wait for rows to render', async () => {
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('every cell in every row has the worst row color with !important', async () => {
    await expect
      .poll(
        async () => {
          const rows = table.locator('tbody tr');
          if (await rows.count() !== ROW_WORST.length) {
            return `expected ${ROW_WORST.length} rows, got ${await rows.count()}`;
          }
          for (let r = 0; r < ROW_WORST.length; r++) {
            const expected = ROW_WORST[r];
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
              if (result.bg !== expected) {
                return `row ${r} col ${c}: expected worst color "${expected}", got "${result.bg}"`;
              }
              if (result.priority !== 'important') {
                return `row ${r} col ${c}: expected !important, got "${result.priority}"`;
              }
            }
          }
          return 'ok';
        },
        { timeout: 10000, message: 'all cells must have the worst row threshold color with !important' }
      )
      .toBe('ok');
  });
});
