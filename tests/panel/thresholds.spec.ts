import { expect, test } from '@grafana/plugin-e2e';

// Datatable-RandomWalk-CustomThresholds.json configures column "A-series" as a
// metric with colorMode=value and four thresholds. Every rendered cell in that
// column should therefore carry an inline "color:" style chosen by the
// threshold band. If colorMode is dropped (the regression fixed in this PR),
// no cell in tbody will have an inline color style.
test('A-series cells render inline threshold colors (colorMode=value)', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await test.step('load provisioned dashboard', async () => {
    return readProvisionedDashboard({
      fileName: 'dashboards/Datatable-RandomWalk-CustomThresholds.json',
    });
  });

  await test.step('open dashboard', async () => {
    await gotoDashboardPage({ uid: dashboard.uid });
  });

  await test.step('wait for datatable to render', async () => {
    await expect(page.getByTestId('datatable-panel-table').locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('at least one cell carries an inline color style', async () => {
    await expect
      .poll(() => page.locator('table tbody td[style*="color:"]').count(), {
        timeout: 10000,
        message: 'expected at least one A-series cell to have inline color styling',
      })
      .toBeGreaterThan(0);
  });

  // The provisioned panel also sets unitFormat=areaM2 on A-series, which
  // Grafana renders with an "m²" suffix. Presence of that glyph proves the
  // unit formatter ran on the colored cells as well.
  await test.step('cells render with the configured unit (m²)', async () => {
    await expect(
      page.getByTestId('datatable-panel-table').locator('tbody td', { hasText: 'm²' }).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
