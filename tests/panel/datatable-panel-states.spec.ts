import { expect, test } from '@grafana/plugin-e2e';

// Covers DataTablePanel.tsx — specifically the PR changes:
// - dataTableReady state gate (loading overlay lifecycle)
// - dataTableClassesEnabled useMemo (CSS classes derived from options)

// DataTables clones the source table (including data-testid) into scroll head,
// body, and foot. The body clone is the visible data table; the head and foot
// clones are hidden by DataTables for layout. Target the body clone explicitly.
const table = (page: import('@playwright/test').Page) =>
  page.locator('.dt-scroll-body [data-testid="datatable-panel-table"]');

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
      await expect(table(page)).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('DataTablePanel — dataTableClassesEnabled useMemo', () => {
  // Tests the useMemo that replaced the useState+useEffect+JSON.stringify
  // class-list computation. Verifies the correct class set for options stored
  // in the provisioned dashboard (stripedRowsEnabled=true, hoverEnabled=true,
  // compactRowsEnabled=false, wrapToFitEnabled=true).

  test.beforeEach(async ({ readProvisionedDashboard, gotoDashboardPage, page }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(table(page)).toBeVisible({ timeout: 15000 });
  });

  for (const { name, cls, present } of [
    { name: '"display" in all configurations', cls: /display/, present: true },
    { name: '"stripe" when stripedRowsEnabled=true', cls: /stripe/, present: true },
    { name: '"hover" when hoverEnabled=true', cls: /hover/, present: true },
    { name: 'no "compact" when compactRowsEnabled=false', cls: /\bcompact\b/, present: false },
    { name: 'no "nowrap" when wrapToFitEnabled=true', cls: /\bnowrap\b/, present: false },
  ]) {
    test(`table has ${name}`, async ({ page }) => {
      if (present) {
        await expect(table(page)).toHaveClass(cls);
      } else {
        const classAttr = await table(page).getAttribute('class');
        expect(classAttr).not.toMatch(cls);
      }
    });
  }
});
