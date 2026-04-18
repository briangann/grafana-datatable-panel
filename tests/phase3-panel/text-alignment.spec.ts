import { expect, test } from '@grafana/plugin-e2e';

// Datatable-TextAlignment.json configures the A-series column with a column
// style whose align='left'. getColumnClassName would otherwise give numeric
// columns `dt-right` (the panel-level alignNumbersToRightEnabled is still
// true), so an inline `text-align: left` on those cells proves the per-column
// override took effect.
test('per-column align override paints inline text-align on matching cells', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await test.step('load provisioned dashboard', async () => {
    return readProvisionedDashboard({
      fileName: 'dashboards/Datatable-TextAlignment.json',
    });
  });

  await test.step('open dashboard', async () => {
    await gotoDashboardPage({ uid: dashboard.uid });
  });

  await test.step('wait for datatable to render', async () => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('at least one cell carries inline text-align:left', async () => {
    await expect
      .poll(() => page.locator('table tbody td[style*="text-align: left"]').count(), {
        timeout: 10000,
        message: 'expected at least one A-series cell to carry text-align:left inline',
      })
      .toBeGreaterThan(0);
  });
});
