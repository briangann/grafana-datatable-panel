import { expect, test } from '@grafana/plugin-e2e';

// Regression coverage for issue #278 — column-filter alignment.
// When "Filter by column" is enabled, DataTables uses scrollX mode, splitting
// the table into a visible header clone (.dt-scroll-head) and the body
// (.dt-scroll-body). Each filter-row <th> must match its body <td> width.

const HEAD_TABLE = '.dt-scroll-head table';
const BODY_TABLE = '.dt-scroll-body table';
const BODY_ROWS = `${BODY_TABLE} tbody tr`;

// Shared helper — checks that every filter-row <th> matches its body <td> width.
async function assertFilterBodyAlignment(page: Parameters<typeof test>[1]['page']) {
  const mismatches = await page.evaluate(() => {
    const headerTable = document.querySelector<HTMLTableElement>('.dt-scroll-head table');
    const bodyTable = document.querySelector<HTMLTableElement>('.dt-scroll-body table');
    if (!headerTable || !bodyTable) {
      return [`scrollX wrappers missing: head=${!!headerTable}, body=${!!bodyTable}`];
    }
    const filterThs = Array.from(
      headerTable.querySelectorAll<HTMLTableCellElement>('thead tr:has(th.column-filter) th'),
    );
    if (filterThs.length === 0) return ['no filter-row <th> cells found'];
    const firstBodyRow = bodyTable.querySelector<HTMLTableRowElement>(
      'tbody tr:not(:has(td.dt-empty))',
    );
    if (!firstBodyRow) return ['no non-empty body row'];
    const bodyTds = Array.from(firstBodyRow.querySelectorAll<HTMLTableCellElement>('td'));
    if (filterThs.length !== bodyTds.length) {
      return [`column count mismatch: ${filterThs.length} filter vs ${bodyTds.length} body`];
    }
    return filterThs.reduce<string[]>((acc, th, i) => {
      const thW = th.getBoundingClientRect().width;
      const tdW = bodyTds[i].getBoundingClientRect().width;
      if (Math.abs(thW - tdW) > 1) acc.push(`col ${i}: filter ${thW.toFixed(2)}px ≠ body ${tdW.toFixed(2)}px`);
      return acc;
    }, []);
  });
  expect(mismatches).toEqual([]);
}

test.describe('column filter — single datasource (issue #278)', () => {
  test('filter-row columns align with body columns', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-ColumnFilter.json' });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`${HEAD_TABLE} thead tr:has(th.column-filter)`)).toBeVisible({ timeout: 10000 });
    await assertFilterBodyAlignment(page);
  });

  test('filter inputs are interactive and placeholder-labelled per column', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-ColumnFilter.json' });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });

    const filterInputs = page.locator(
      `${HEAD_TABLE} thead tr:has(th.column-filter) th input.column-filter`,
    );

    await test.step('one filter input per column with Search placeholder', async () => {
      const count = await filterInputs.count();
      expect(count).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < count; i++) {
        expect(await filterInputs.nth(i).getAttribute('placeholder')).toMatch(/^Search /);
      }
    });

    await test.step('clicking a filter input focuses it without triggering sort', async () => {
      const sortBefore = await page
        .locator(`${HEAD_TABLE} thead tr:not(:has(th.column-filter)) th`)
        .first()
        .getAttribute('class');
      await filterInputs.first().click();
      await expect(filterInputs.first()).toBeFocused();
      const sortAfter = await page
        .locator(`${HEAD_TABLE} thead tr:not(:has(th.column-filter)) th`)
        .first()
        .getAttribute('class');
      expect(sortAfter).toBe(sortBefore);
    });

    await test.step('typing into the input updates its value', async () => {
      await filterInputs.first().fill('filter-probe');
      await expect(filterInputs.first()).toHaveValue('filter-probe');
      await filterInputs.first().fill('');
    });
  });
});

test.describe('column filter — many columns (issue #278, multi-column)', () => {
  test('every filter-row cell stays aligned with its body cell across 9 columns', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-ColumnFilter-ManyColumns.json' });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`${HEAD_TABLE} thead tr:has(th.column-filter)`)).toBeVisible({ timeout: 10000 });

    await test.step('table has 9 columns', async () => {
      const headers = await page.locator(`${HEAD_TABLE} thead tr:not(:has(th.column-filter)) th`).count();
      expect(headers).toBe(9);
      expect(await page.locator(`${HEAD_TABLE} input.column-filter`).count()).toBe(9);
    });

    await assertFilterBodyAlignment(page);
  });

  test('typing a value into a filter narrows rows to matches', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Datatable-ColumnFilter-ManyColumns.json' });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });

    const rowsInfo = async () =>
      page.evaluate(() => {
        const $ = (window as unknown as { jQuery: JQueryStatic }).jQuery;
        const api = $('.dt-scroll-body table.dataTable').DataTable();
        return { total: api.page.info().recordsTotal, display: api.page.info().recordsDisplay };
      });

    const baseline = await rowsInfo();
    expect(baseline.total).toBeGreaterThanOrEqual(2);
    expect(baseline.display).toBe(baseline.total);

    const aInput = page.locator(`${HEAD_TABLE} input.column-filter`).nth(1);
    await aInput.click();
    await aInput.pressSequentially('5.00', { delay: 30 });
    await expect.poll(async () => (await rowsInfo()).display, { timeout: 3000 }).toBeLessThan(baseline.total);

    await aInput.click({ clickCount: 3 });
    await aInput.press('Backspace');
    await expect.poll(async () => (await rowsInfo()).display, { timeout: 3000 }).toBe(baseline.total);

    const bInput = page.locator(`${HEAD_TABLE} input.column-filter`).nth(2);
    await bInput.click();
    await bInput.pressSequentially('99', { delay: 30 });
    await expect.poll(async () => (await rowsInfo()).display, { timeout: 3000 }).toBeLessThan(baseline.total);
    const searches = await page.evaluate(() => {
      const $ = (window as unknown as { jQuery: JQueryStatic }).jQuery;
      const api = $('.dt-scroll-body table.dataTable').DataTable();
      return { col1: api.column(1).search(), col2: api.column(2).search() };
    });
    expect(searches.col2).toBe('99');
    expect(searches.col1).toBe('');
  });
});
