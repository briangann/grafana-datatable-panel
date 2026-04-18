import { expect, test } from '@grafana/plugin-e2e';

// Regression test for issue #278. When "Filter by column" is enabled,
// the injected filter row must stay aligned with body columns: every
// filter-row <th> must match the corresponding body <td> width within
// 1px. Before the fix the filter-row cells stretched wider than the
// body's cached column widths and content visibly spilled.
test.describe('column filter alignment (issue #278)', () => {
  test('filter-row columns align with body columns', async ({
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

    await test.step('every filter-row cell matches its body cell width', async () => {
      const mismatches = await page.evaluate(() => {
        const table = document.querySelector<HTMLTableElement>('table.dataTable');
        if (!table) {
          return ['no dataTable found'];
        }
        const filterThs = Array.from(
          table.querySelectorAll<HTMLTableCellElement>('thead tr.column-filter th'),
        );
        const firstBodyRow = table.querySelector<HTMLTableRowElement>('tbody tr');
        if (!firstBodyRow) {
          return ['no body row'];
        }
        const bodyTds = Array.from(
          firstBodyRow.querySelectorAll<HTMLTableCellElement>('td'),
        );
        if (filterThs.length !== bodyTds.length) {
          return [`column count mismatch: ${filterThs.length} filter vs ${bodyTds.length} body`];
        }
        const out: string[] = [];
        filterThs.forEach((th, i) => {
          const thW = th.getBoundingClientRect().width;
          const tdW = bodyTds[i].getBoundingClientRect().width;
          if (Math.abs(thW - tdW) > 1) {
            out.push(`col ${i}: filter th=${thW.toFixed(2)}px, body td=${tdW.toFixed(2)}px`);
          }
        });
        return out;
      });
      expect(mismatches).toEqual([]);
    });
  });

  test('typing filters rows to the empty state; clearing restores them', async ({
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

    const firstFilterInput = page
      .locator('table thead tr.column-filter th input.column-filter')
      .first();
    await expect(firstFilterInput).toBeVisible({ timeout: 10000 });

    const baseline = await page.locator('table tbody tr').count();

    await test.step('fixture sanity: baseline has more than one row', () => {
      expect(baseline).toBeGreaterThanOrEqual(2);
    });

    await test.step('fill a non-matching value and see empty-state appear', async () => {
      await firstFilterInput.fill('zzzzzzzzz-unlikely-match');
      // debounce is 250ms; poll up to 3s
      await expect(page.locator('table tbody td.dataTables_empty')).toBeVisible({
        timeout: 3000,
      });
      await expect(page.locator('table tbody tr')).toHaveCount(1);
    });

    await test.step('clear and see rows restored', async () => {
      await firstFilterInput.fill('');
      await expect
        .poll(() => page.locator('table tbody tr').count(), { timeout: 3000 })
        .toBe(baseline);
      await expect(page.locator('table tbody td.dataTables_empty')).toHaveCount(0);
    });
  });
});
