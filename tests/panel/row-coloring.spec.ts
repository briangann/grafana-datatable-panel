import { expect, test } from '@grafana/plugin-e2e';

// Datatable-RowColoring.json has three panels with static CSV data and
// colorMode=row on the "Value" column. Thresholds:
//   green  (#299c46) : value  < 10   — panel index 0
//   orange (#ed8128) : 10 ≤ value < 20 — panel index 1
//   red    (#f53636) : value ≥ 20   — panel index 2
//
// Every cell in a row — Time, Host, and Value — must carry the same color,
// including unstyled columns (regression guard for the "last-column gap" fix).

const GREEN  = 'rgb(41, 156, 70)';   // #299c46
const ORANGE = 'rgb(237, 129, 40)';  // #ed8128
const RED    = 'rgb(245, 54, 54)';   // #f53636

const COLUMNS_PER_ROW = 3; // Time, Host, Value

async function assertPanelRowsColored(
  page: import('@playwright/test').Page,
  panelIndex: number,
  expectedColor: string,
  label: string
) {
  // DataTables creates multiple <table> elements per panel (header/footer clones).
  // Only the body table has <tbody tr> children — filter to those, then pick by index.
  const table = page.locator('[data-testid="datatable-panel-table"]:has(tbody tr)').nth(panelIndex);

  await test.step(`wait for rows in panel ${panelIndex} (${label})`, async () => {
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step(`all cells in every row are ${label} (${expectedColor})`, async () => {
    await expect
      .poll(
        async () => {
          const rows = table.locator('tbody tr');
          const rowCount = await rows.count();
          if (rowCount === 0) { return 'no rows'; }

          for (let r = 0; r < rowCount; r++) {
            const cells = rows.nth(r).locator('td');
            const cellCount = await cells.count();
            if (cellCount !== COLUMNS_PER_ROW) {
              return `row ${r}: expected ${COLUMNS_PER_ROW} cells, got ${cellCount}`;
            }
            for (let c = 0; c < cellCount; c++) {
              const bg = await cells.nth(c).evaluate(
                (el: HTMLElement) => el.style.backgroundColor
              );
              if (bg !== expectedColor) {
                return `row ${r} cell ${c}: expected "${expectedColor}", got "${bg}"`;
              }
            }
          }
          return 'ok';
        },
        {
          timeout: 10000,
          message: `panel ${panelIndex}: expected all cells to have background-color ${expectedColor}`,
        }
      )
      .toBe('ok');
  });
}

test('row coloring — colorMode=row colors all cells green for values below threshold 10', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring.json' });
  await gotoDashboardPage({ uid: dashboard.uid });
  await assertPanelRowsColored(page, 0, GREEN, 'green');
});

test('row coloring — colorMode=row colors all cells orange for values 10–19', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring.json' });
  await gotoDashboardPage({ uid: dashboard.uid });
  await assertPanelRowsColored(page, 1, ORANGE, 'orange');
});

test('row coloring — colorMode=row colors all cells red for values 20 and above', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring.json' });
  await gotoDashboardPage({ uid: dashboard.uid });
  await assertPanelRowsColored(page, 2, RED, 'red');
});

// Panel 3 (index 3): mixed data — each row falls in a different threshold band.
// Verifies that row coloring is applied PER ROW, not per table, and that the
// "last-column gap" fix propagates the right color to every cell in each row.
const MIXED_ROW_COLORS = [GREEN, ORANGE, RED, GREEN, ORANGE, RED, GREEN, ORANGE, RED, GREEN, ORANGE, RED, GREEN, ORANGE, RED];

test('row coloring — colorMode=row applies per-row color for mixed-band data', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-RowColoring.json' });
  await gotoDashboardPage({ uid: dashboard.uid });

  const table = page.locator('[data-testid="datatable-panel-table"]:has(tbody tr)').nth(3);

  await test.step('wait for mixed panel rows', async () => {
    await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('each row has the correct per-row background-color across all cells', async () => {
    await expect
      .poll(
        async () => {
          const rows = table.locator('tbody tr');
          const rowCount = await rows.count();
          if (rowCount === 0) { return 'no rows'; }
          // Only the first page (rowsPerPage=5) is visible — check those rows.
          for (let r = 0; r < rowCount; r++) {
            const expected = MIXED_ROW_COLORS[r];
            const cells = rows.nth(r).locator('td');
            const cellCount = await cells.count();
            if (cellCount !== COLUMNS_PER_ROW) {
              return `row ${r}: expected ${COLUMNS_PER_ROW} cells, got ${cellCount}`;
            }
            for (let c = 0; c < cellCount; c++) {
              const bg = await cells.nth(c).evaluate((el: HTMLElement) => el.style.backgroundColor);
              if (bg !== expected) {
                return `row ${r} cell ${c}: expected "${expected}", got "${bg}"`;
              }
            }
          }
          return 'ok';
        },
        {
          timeout: 10000,
          message: 'expected each row in the mixed panel to carry its correct per-row threshold color',
        }
      )
      .toBe('ok');
  });
});
