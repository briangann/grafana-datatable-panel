import { expect, test } from '@grafana/plugin-e2e';

// Basic rendering smoke tests.
// Covers the happy path every user hits first: the panel accepts a query,
// mounts as a DataTables table, and shows column headers and data rows in
// the default scroll mode.

test.describe('panel creation and basic rendering', () => {
  test('panel accepts a query and returns a datatable visualization', async ({
    panelEditPage,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();
  });

  test('table renders with column headers and data rows in scroll mode', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await test.step('DataTables container is visible', async () => {
      await expect(page.getByTestId('datatable-panel-container')).toBeVisible({ timeout: 15000 });
    });

    await test.step('at least one column header rendered', async () => {
      // In scrollX mode DataTables hides the source thead — use the visible clone in .dt-scroll-head.
      await expect(page.locator('.dt-scroll-head thead th').first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('at least one data row rendered', async () => {
      await expect(page.getByTestId('datatable-panel-table').locator('tbody tr').first()).toBeVisible();
    });
  });

  test('multiple data rows are present', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await page.getByTestId('datatable-panel-table').locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 });
    const rows = page.getByTestId('datatable-panel-table').locator('tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(5);
  });
});
