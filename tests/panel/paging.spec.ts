import { expect, test } from '@grafana/plugin-e2e';

// Verifies paging mode (scroll: false). The provisioned dashboard has
// rowsPerPage: 5 and the CSV source provides 10 rows, so there are
// exactly 2 pages. Tests that the pagination controls render and that
// navigating to page 2 changes the visible rows.

test.describe('paging mode', () => {
  test('pagination controls are visible when paging is enabled', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-Paging-Test.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await page.getByTestId('datatable-panel-table').locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 });

    await test.step('pagination wrapper is visible', async () => {
      // DataTables 2.x uses .dt-paging (legacy: .dataTables_paginate)
      await expect(page.locator('.dt-paging')).toBeVisible();
    });

    await test.step('info bar shows row count', async () => {
      // DataTables 2.x info bar: "Showing 1 to 5 of 10 entries"
      await expect(page.locator('.dt-info')).toContainText('Showing');
    });

    await test.step('rows-per-page selector is visible', async () => {
      await expect(page.locator('.dt-length')).toBeVisible();
    });
  });

  test('navigating to page 2 shows different rows', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-Paging-Test.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await page.getByTestId('datatable-panel-table').locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 });

    // Capture first-page first cell using testid-scoped locator
    const table = page.getByTestId('datatable-panel-table');
    const firstCellPage1 = await table.locator('tbody tr').first().locator('td').first().textContent();

    await test.step('click next page', async () => {
      // DataTables 2.x next button carries class 'next' on the <button> element
      await page.locator('.dt-paging button.next').click();
    });

    await test.step('first cell changes after pagination', async () => {
      const firstCellPage2 = table.locator('tbody tr').first().locator('td').first();
      await expect(firstCellPage2).not.toHaveText(firstCellPage1 ?? '', { timeout: 5000 });
    });

    await test.step('info bar reflects page 2', async () => {
      await expect(page.locator('.dt-info')).toContainText('6 to 10');
    });
  });
});
