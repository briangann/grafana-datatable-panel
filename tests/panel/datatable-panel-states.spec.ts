import { expect, test } from '@grafana/plugin-e2e';

// Covers DataTablePanel.tsx — specifically the PR changes:
// - dataTableReady state gate (loading overlay lifecycle)
// - dataTableClassesEnabled useMemo (CSS classes derived from options)

const TABLE = 'datatable-panel-table';
const LOADING = 'datatable-panel-loading';

test.describe('DataTablePanel — ready state gate', () => {
  test('loading overlay disappears once DataTables fires initComplete', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await test.step('loading overlay eventually hidden', async () => {
      // dataTableReady starts false; overlay unmounts after initComplete fires.
      await expect(page.getByTestId(LOADING)).not.toBeVisible({ timeout: 15000 });
    });

    await test.step('table is visible after ready', async () => {
      await expect(page.getByTestId(TABLE)).toBeVisible();
    });
  });
});

test.describe('DataTablePanel — dataTableClassesEnabled useMemo', () => {
  // This tests the useMemo that replaced the useState+useEffect+JSON.stringify
  // class-list computation. The memo outputs the correct class set for the
  // options stored in each provisioned dashboard.

  test('table has "display" class in all configurations', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(page.getByTestId(TABLE)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId(TABLE)).toHaveClass(/display/);
  });

  test('table has "stripe" class when stripedRowsEnabled=true', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    // Datatable-ColumnFilter.json provisions stripedRowsEnabled: true
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(page.getByTestId(TABLE)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId(TABLE)).toHaveClass(/stripe/);
  });

  test('table has "hover" class when hoverEnabled=true', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    // Datatable-ColumnFilter.json provisions hoverEnabled: true
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(page.getByTestId(TABLE)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId(TABLE)).toHaveClass(/hover/);
  });

  test('table does not have "compact" class when compactRowsEnabled=false', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    // Datatable-ColumnFilter.json provisions compactRowsEnabled: false
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(page.getByTestId(TABLE)).toBeVisible({ timeout: 15000 });
    const classAttr = await page.getByTestId(TABLE).getAttribute('class');
    expect(classAttr).not.toMatch(/\bcompact\b/);
  });

  test('table does not have "nowrap" class when wrapToFitEnabled=true', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    // nowrap is added when wrapToFitEnabled=false; ColumnFilter dashboard has true
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(page.getByTestId(TABLE)).toBeVisible({ timeout: 15000 });
    const classAttr = await page.getByTestId(TABLE).getAttribute('class');
    expect(classAttr).not.toMatch(/\bnowrap\b/);
  });
});
