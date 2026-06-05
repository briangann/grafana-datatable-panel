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

    await test.step('click twice — sort direction changes', async () => {
      // DataTables 2.x 3-state cycle per column: none → asc → desc → none.
      // Column 0 starts with an initial ascending sort, so:
      //   click 1: asc → desc   (or none → asc if not initially sorted)
      //   click 2: desc → none  (or asc → desc)
      // Capture which state we're in after the first click and expect the
      // correct next state, rather than hard-coding asc or desc.
      const afterFirst = await firstHeader.getAttribute('class') ?? '';
      await firstHeader.click();
      if (afterFirst.includes('dt-ordering-asc')) {
        await expect(firstHeader).toHaveClass(/dt-ordering-desc/, { timeout: 5000 });
      } else {
        // Was descending → next state is none (ordering class removed)
        await expect(firstHeader).not.toHaveClass(/dt-ordering-asc|dt-ordering-desc/, { timeout: 5000 });
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
