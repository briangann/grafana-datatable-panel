import { expect, test } from '@grafana/plugin-e2e';

// Text alignment — two orthogonal scenarios in one file:
//
//   per-column override  — a column style with align='left' overrides the
//                          panel-level alignNumbersToRightEnabled=true for the
//                          matching column, verified via inline text-align style.
//
//   panel-level toggle   — alignStringsToRightEnabled=false leaves string columns
//                          without the dt-right class, while numeric columns
//                          that still have alignNumbersToRightEnabled=true keep it.

test.describe('text alignment — per-column style override', () => {
  test('column style align=left paints inline text-align on matching cells', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-TextAlignment.json' });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.getByTestId('datatable-panel-table').locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    await expect
      .poll(() => page.locator('table tbody td[style*="text-align: left"]').count(), {
        timeout: 10000,
        message: 'expected at least one A-series cell to carry text-align:left',
      })
      .toBeGreaterThan(0);
  });
});

test.describe('text alignment — panel-level toggle', () => {
  test('alignStringsToRightEnabled=false leaves string columns without dt-right', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    // Datatable-TextAlignmentPanelLevel.json:
    //   alignStringsToRightEnabled: false  → Name column must NOT have dt-right
    //   alignNumbersToRightEnabled: true   → Value column MUST have dt-right
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-TextAlignmentPanelLevel.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.getByTestId('datatable-panel-table').locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    const firstRow = page.getByTestId('datatable-panel-table').locator('tbody tr').first();

    await test.step('string column (Name) does not carry dt-right', async () => {
      await expect(firstRow.locator('td').first()).not.toHaveClass(/\bdt-right\b/);
    });

    await test.step('numeric column (Value) still carries dt-right', async () => {
      await expect(firstRow.locator('td').nth(1)).toHaveClass(/\bdt-right\b/);
    });
  });
});
