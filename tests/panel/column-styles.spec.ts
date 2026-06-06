import { expect, test } from '@grafana/plugin-e2e';

// Verifies column style application. The provisioned dashboard has:
//   - A "hidden" style matching the "Value" column  → column disappears from the DOM
//   - A "date" style matching the "Time" column     → raw epoch/ISO string becomes
//                                                     a formatted date (YYYY-MM-DD)
//
// These cover the styles → DataTables column-def pipeline and confirm
// the cell renderer and column-def builder honour the configured styles.

test.describe('column styles — hidden', () => {
  test('a column with activeStyle=hidden is not rendered in the table', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-Column-Styles-Test.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    // In scroll mode DataTables puts two <thead> rows in the original table
    // (one for sizing, one for display) — use the visible clone in .dt-scroll-head.
    await page.locator('.dt-scroll-head thead th').first().waitFor({ state: 'visible', timeout: 15000 });

    await test.step('Value column header is not visible', async () => {
      const headers = page.locator('.dt-scroll-head thead th');
      const count = await headers.count();
      const headerTexts: Array<string | null> = [];
      for (let i = 0; i < count; i++) headerTexts.push(await headers.nth(i).textContent());
      expect(headerTexts).not.toContain('Value');
    });

    await test.step('other columns are still visible', async () => {
      const count = await page.locator('.dt-scroll-head thead th').count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});

test.describe('column styles — date formatting', () => {
  test('Time column renders as YYYY-MM-DD formatted date not as raw epoch', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-Column-Styles-Test.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await page.getByTestId('datatable-panel-table').locator('tbody tr').first().waitFor({ state: 'visible', timeout: 15000 });

    await test.step('Time cells show YYYY-MM-DD format', async () => {
      const timeCell = page.getByTestId('datatable-panel-table').locator('tbody tr').first().locator('td').first();
      await expect(timeCell).toHaveText(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
