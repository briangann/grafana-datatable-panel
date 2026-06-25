import { expect, test } from '@grafana/plugin-e2e';

// Covers DataTablePanel.tsx — specifically the PR changes:
// - dataTableReady state gate (loading overlay lifecycle)
// - dataTableClassesEnabled useMemo (CSS classes derived from options)

// DataTables clones the table element for scroll headers — use .first() to
// avoid strict-mode violations when multiple elements share the testid.
const table = (page: import('@playwright/test').Page) =>
  page.getByTestId('datatable-panel-table').first();

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
      await expect(page.getByTestId('datatable-panel-loading')).not.toBeVisible({ timeout: 15000 });
    });

    await test.step('table is visible after ready', async () => {
      await expect(table(page)).toBeVisible();
    });
  });
});

test.describe('DataTablePanel — dataTableClassesEnabled useMemo', () => {
  // Tests the useMemo that replaced the useState+useEffect+JSON.stringify
  // class-list computation. Verifies the correct class set for options stored
  // in the provisioned dashboard (stripedRowsEnabled=true, hoverEnabled=true,
  // compactRowsEnabled=false, wrapToFitEnabled=true).

  test('table has "display" class in all configurations', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(table(page)).toBeVisible({ timeout: 15000 });
    await expect(table(page)).toHaveClass(/display/);
  });

  test('table has "stripe" class when stripedRowsEnabled=true', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(table(page)).toBeVisible({ timeout: 15000 });
    await expect(table(page)).toHaveClass(/stripe/);
  });

  test('table has "hover" class when hoverEnabled=true', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(table(page)).toBeVisible({ timeout: 15000 });
    await expect(table(page)).toHaveClass(/hover/);
  });

  test('table does not have "compact" class when compactRowsEnabled=false', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(table(page)).toBeVisible({ timeout: 15000 });
    const classAttr = await table(page).getAttribute('class');
    expect(classAttr).not.toMatch(/\bcompact\b/);
  });

  test('table does not have "nowrap" class when wrapToFitEnabled=true', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await expect(table(page)).toBeVisible({ timeout: 15000 });
    const classAttr = await table(page).getAttribute('class');
    expect(classAttr).not.toMatch(/\bnowrap\b/);
  });
});
