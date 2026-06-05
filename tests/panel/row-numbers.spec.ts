import { expect, test } from '@grafana/plugin-e2e';

// Verifies the rowNumbersEnabled option. When enabled, the table prepends
// a sequential "Row" column starting at 1. This exercises the options
// pipeline through DataTablePanel → DataTables configuration.

test.describe('row numbers', () => {
  test('row number column renders with sequential values starting at 1', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-Row-Numbers-Test.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await page.getByTestId('datatable-panel-table').locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 });

    await test.step('first row has number 1', async () => {
      await expect(
        page.getByTestId('datatable-panel-table').locator('tbody tr').first().locator('td').first(),
      ).toHaveText('1');
    });

    await test.step('second row has number 2', async () => {
      await expect(
        page.getByTestId('datatable-panel-table').locator('tbody tr').nth(1).locator('td').first(),
      ).toHaveText('2');
    });

    await test.step('fifth row has number 5', async () => {
      await expect(
        page.getByTestId('datatable-panel-table').locator('tbody tr').nth(4).locator('td').first(),
      ).toHaveText('5');
    });
  });
});
