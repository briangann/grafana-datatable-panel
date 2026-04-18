import { expect, test } from '@grafana/plugin-e2e';

// Multi-column regression coverage for issue #278. The original issue
// screenshot showed ten-plus series with the filter row visibly misaligned;
// this spec loads a provisioned dashboard with eight random-walk series
// (A-series through H-series, plus the time column = 9 columns) and asserts
// alignment + live-typing filter behavior across every column.

const HEAD_TABLE = '.dt-scroll-head table';
const BODY_TABLE = '.dt-scroll-body table';
const BODY_ROWS = `${BODY_TABLE} tbody tr`;

test.describe('column filter with many columns (issue #278, multi-column)', () => {
  test('every filter-row cell stays aligned with its body cell across 9 columns', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await test.step('load provisioned dashboard', async () => {
      return readProvisionedDashboard({
        fileName: 'dashboards/Datatable-ColumnFilter-ManyColumns.json',
      });
    });

    await test.step('open dashboard', async () => {
      await gotoDashboardPage({ uid: dashboard.uid });
    });

    await test.step('wait for datatable body to render', async () => {
      await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });
    });

    await test.step('filter row is present in the visible header', async () => {
      await expect(
        page.locator(`${HEAD_TABLE} thead tr:has(th.column-filter)`),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step('table has 9 columns (time + A-H series)', async () => {
      const headerCount = await page
        .locator(`${HEAD_TABLE} thead tr:not(:has(th.column-filter)) th`)
        .count();
      expect(headerCount).toBe(9);
      const filterInputs = await page
        .locator(`${HEAD_TABLE} input.column-filter`)
        .count();
      expect(filterInputs).toBe(9);
    });

    await test.step('every filter-row cell matches its body cell width', async () => {
      const mismatches = await page.evaluate(() => {
        const headerTable = document.querySelector<HTMLTableElement>(
          '.dt-scroll-head table',
        );
        const bodyTable = document.querySelector<HTMLTableElement>(
          '.dt-scroll-body table',
        );
        if (!headerTable || !bodyTable) {
          return [`scrollX wrappers missing: head=${!!headerTable}, body=${!!bodyTable}`];
        }
        const filterThs = Array.from(
          headerTable.querySelectorAll<HTMLTableCellElement>(
            'thead tr:has(th.column-filter) th',
          ),
        );
        const firstBodyRow = bodyTable.querySelector<HTMLTableRowElement>(
          'tbody tr:not(:has(td.dt-empty))',
        );
        if (!firstBodyRow) {
          return ['no non-empty body row'];
        }
        const bodyTds = Array.from(
          firstBodyRow.querySelectorAll<HTMLTableCellElement>('td'),
        );
        if (filterThs.length !== bodyTds.length) {
          return [
            `column count mismatch: ${filterThs.length} filter vs ${bodyTds.length} body`,
          ];
        }
        const out: string[] = [];
        filterThs.forEach((th, i) => {
          const thW = th.getBoundingClientRect().width;
          const tdW = bodyTds[i].getBoundingClientRect().width;
          if (Math.abs(thW - tdW) > 1) {
            out.push(
              `col ${i}: filter th=${thW.toFixed(2)}px, body td=${tdW.toFixed(2)}px`,
            );
          }
        });
        return out;
      });
      expect(mismatches).toEqual([]);
    });
  });

  test('typing a WYSIWYG value into a filter narrows rows to matches', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-ColumnFilter-ManyColumns.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });
    await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });

    // Use DataTables' own API to read row counts — page.locator counts every
    // rendered row including the off-screen ones DataTables keeps in the DOM
    // for virtual scrolling.
    const rowsInfo = async () =>
      page.evaluate(() => {
        const $ = (window as unknown as { jQuery: JQueryStatic }).jQuery;
        const api = $('.dt-scroll-body table.dataTable').DataTable();
        return {
          totalRecords: api.page.info().recordsTotal,
          displayRecords: api.page.info().recordsDisplay,
        };
      });

    const baseline = await rowsInfo();

    await test.step('fixture sanity: baseline >= 2 records and all shown', () => {
      expect(baseline.totalRecords).toBeGreaterThanOrEqual(2);
      expect(baseline.displayRecords).toBe(baseline.totalRecords);
    });

    // A-series is configured with decimals=2 in the fixture, so values render
    // as e.g. "5.00". Filtering against the displayed value proves WYSIWYG
    // filter-orthogonal data is wired up correctly.
    const aSeriesInput = page
      .locator(`${HEAD_TABLE} input.column-filter`)
      .nth(1);

    await test.step('type "5.00" into A-series filter — matches the formatted display', async () => {
      await aSeriesInput.click();
      await aSeriesInput.pressSequentially('5.00', { delay: 30 });
      await expect
        .poll(async () => (await rowsInfo()).displayRecords, { timeout: 3000 })
        .toBeLessThan(baseline.totalRecords);
      const searchApplied = await page.evaluate(() => {
        const $ = (window as unknown as { jQuery: JQueryStatic }).jQuery;
        return $('.dt-scroll-body table.dataTable').DataTable().column(1).search();
      });
      expect(searchApplied).toBe('5.00');
    });

    await test.step('clear the filter — all rows return', async () => {
      // Triple-click selects the entire input value, then type backspace to clear
      // and fire keyup so the delegated handler reruns the column search.
      await aSeriesInput.click({ clickCount: 3 });
      await aSeriesInput.press('Backspace');
      await expect
        .poll(async () => (await rowsInfo()).displayRecords, { timeout: 3000 })
        .toBe(baseline.totalRecords);
    });

    // Second column filter works independently of the first — delegated
    // handlers on the container must fire per input, per column.
    const bSeriesInput = page
      .locator(`${HEAD_TABLE} input.column-filter`)
      .nth(2);

    await test.step('type into B-series filter and verify independent narrowing', async () => {
      await bSeriesInput.click();
      await bSeriesInput.pressSequentially('99', { delay: 30 });
      await expect
        .poll(async () => (await rowsInfo()).displayRecords, { timeout: 3000 })
        .toBeLessThan(baseline.totalRecords);
      const searchApplied = await page.evaluate(() => {
        const $ = (window as unknown as { jQuery: JQueryStatic }).jQuery;
        const api = $('.dt-scroll-body table.dataTable').DataTable();
        return { col1: api.column(1).search(), col2: api.column(2).search() };
      });
      expect(searchApplied.col2).toBe('99');
      expect(searchApplied.col1).toBe('');
    });
  });
});
