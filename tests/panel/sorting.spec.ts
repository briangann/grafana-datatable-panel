import { expect, test } from '@grafana/plugin-e2e';

// Verifies that clicking a column header sorts the table and that a second
// click reverses the direction. Uses class-based assertions (dt-ordering-asc /
// dt-ordering-desc) which are more stable than aria-sort in DataTables 2.x,
// where the attribute is removed on the third click (3-state cycle: asc →
// desc → none).

test.describe('column sorting', () => {
  test('clicking a column header applies a sort class', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-Sorting-Test.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    const firstHeader = page.getByTestId('datatable-panel-table').locator('thead th').nth(0);
    await firstHeader.waitFor({ state: 'visible', timeout: 15000 });
    await page.getByTestId('datatable-panel-table').locator('tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

    await test.step('click once — column becomes actively sorted', async () => {
      await firstHeader.click();
      // DataTables marks the active sort column with dt-ordering-asc or dt-ordering-desc
      await expect(firstHeader).toHaveClass(/dt-ordering-asc|dt-ordering-desc/);
    });

    await test.step('click twice — sort direction reverses', async () => {
      const firstClass = await firstHeader.getAttribute('class');
      const wasAsc = firstClass?.includes('dt-ordering-asc');
      await firstHeader.click();
      if (wasAsc) {
        await expect(firstHeader).toHaveClass(/dt-ordering-desc/);
      } else {
        await expect(firstHeader).toHaveClass(/dt-ordering-asc/);
      }
    });
  });

  test('sort produces a different row order (Host column, static CSV data)', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-Sorting-Test.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    const table = page.getByTestId('datatable-panel-table');
    // Host is column index 1 in the CSV: Time, Host, Value
    const hostHeader = table.locator('thead th').nth(1);
    await hostHeader.waitFor({ state: 'visible', timeout: 15000 });

    const getHostCells = async () => {
      const cells = table.locator('tbody tr td:nth-child(2)');
      const count = await cells.count();
      const texts: string[] = [];
      for (let i = 0; i < count; i++) texts.push((await cells.nth(i).textContent()) ?? '');
      return texts;
    };

    // First click: ascending — "alpha" should be first (alphabetically smallest)
    await hostHeader.click();
    await expect(hostHeader).toHaveClass(/dt-ordering-asc/, { timeout: 5000 });
    // Wait for DOM to reflect the new order before reading
    const firstCell = table.locator('tbody tr td:nth-child(2)').first();
    await expect.poll(() => firstCell.textContent(), { timeout: 5000 }).toBe('alpha');
    const asc = await getHostCells();

    // Second click: descending — "zeta" should be first
    await hostHeader.click();
    await expect(hostHeader).toHaveClass(/dt-ordering-desc/, { timeout: 5000 });
    await expect.poll(() => firstCell.textContent(), { timeout: 5000 }).toBe('zeta');
    const desc = await getHostCells();

    // Ascending and descending must be exact reverses of each other
    expect(asc).not.toEqual(desc);
    expect(asc).toEqual([...desc].reverse());
  });
});
