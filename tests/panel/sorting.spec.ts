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

    // In scrollX mode DataTables hides the source thead — interact with the visible clone.
    const firstHeader = page.locator('.dt-scroll-head thead th').nth(0);
    await firstHeader.waitFor({ state: 'visible', timeout: 15000 });
    await page.getByTestId('datatable-panel-table').locator('tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });

    await test.step('click once — column becomes actively sorted', async () => {
      await firstHeader.click();
      // DataTables marks the active sort column with dt-ordering-asc or dt-ordering-desc
      await expect(firstHeader).toHaveClass(/dt-ordering-asc|dt-ordering-desc/);
    });

    await test.step('click twice — sort state changes from first click', async () => {
      // DataTables 2.x sort cycle can be 3-state (none→asc→desc→none) or
      // 2-state depending on Grafana version and orderDescFirst config.
      // Capture the class after click 1 and verify click 2 changes it.
      const afterFirst = await firstHeader.getAttribute('class') ?? '';
      await firstHeader.click();
      // Just verify the state CHANGED from afterFirst — either direction or none.
      await expect.poll(async () => await firstHeader.getAttribute('class'), { timeout: 5000 })
        .not.toBe(afterFirst);
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
    // Host is column index 1 in the CSV: Time, Host, Value.
    // In scrollX mode DataTables hides the source thead — click the visible clone.
    const hostHeader = page.locator('.dt-scroll-head thead th').nth(1);
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
