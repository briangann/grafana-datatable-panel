import { expect, test } from '@grafana/plugin-e2e';

// Regression test for issue #278. When "Filter by column" is enabled,
// the injected filter row must line up with the body cells: each filter
// input must fit inside its column's header cell. Before the fix the
// inputs were unsized and pushed the column wider than the body's
// cached column width, causing visible spill.
test.describe('column filter alignment (issue #278)', () => {
  test('filter row renders inside thead and inputs fit their cells', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await test.step('load provisioned dashboard', async () => {
      return readProvisionedDashboard({
        fileName: 'dashboards/Datatable-ColumnFilter.json',
      });
    });

    await test.step('open dashboard', async () => {
      await gotoDashboardPage({ uid: dashboard.uid });
    });

    await test.step('wait for datatable to render', async () => {
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
    });

    const filterRow = page.locator('table thead tr.column-filter');

    await test.step('filter row is present', async () => {
      await expect(filterRow).toBeVisible({ timeout: 10000 });
    });

    await test.step('every filter input fits inside its header cell', async () => {
      const overflows = await filterRow.evaluate((row) => {
        const ths = Array.from(row.querySelectorAll<HTMLTableCellElement>('th'));
        return ths
          .map((th) => {
            const input = th.querySelector<HTMLInputElement>('input.column-filter');
            if (!input) {
              return null;
            }
            const inputWidth = input.getBoundingClientRect().width;
            const cellWidth = th.getBoundingClientRect().width;
            // allow 1px rounding tolerance
            return inputWidth > cellWidth + 1
              ? { inputWidth, cellWidth }
              : null;
          })
          .filter(Boolean);
      });
      expect(overflows).toEqual([]);
    });
  });

  test('typing into a filter narrows the visible rows; clearing restores them', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });

    const firstFilterInput = page.locator('table thead tr.column-filter th input.column-filter').first();
    await expect(firstFilterInput).toBeVisible({ timeout: 10000 });

    const baseline = await page.locator('table tbody tr').count();
    expect(baseline).toBeGreaterThan(0);

    await firstFilterInput.fill('zzzzzzzzz-unlikely-match');
    // debounce is 250ms; poll up to 3s
    await expect
      .poll(() => page.locator('table tbody tr').count(), { timeout: 3000 })
      .toBeLessThan(baseline);

    await firstFilterInput.fill('');
    await expect
      .poll(() => page.locator('table tbody tr').count(), { timeout: 3000 })
      .toBe(baseline);
  });
});
