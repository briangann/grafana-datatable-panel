import { expect, test } from '@grafana/plugin-e2e';

// Regression test for issue #278. When "Filter by column" is enabled,
// DataTables runs in scrollX mode, which splits the table into a visible
// header clone (.dataTables_scrollHead) and the body (.dataTables_scrollBody).
// Each filter-row <th> in the header clone must match the body <td> width
// at the same column index — otherwise content visibly spills.

const HEAD_TABLE = '.dataTables_scrollHead table';
const BODY_TABLE = '.dataTables_scrollBody table';
const BODY_ROWS = `${BODY_TABLE} tbody tr`;

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

    await test.step('wait for datatable body to render', async () => {
      await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });
    });

    await test.step('filter row is present in the visible header', async () => {
      await expect(
        page.locator(`${HEAD_TABLE} thead tr:has(th.column-filter)`),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step('every filter-row cell matches its body cell width', async () => {
      const mismatches = await page.evaluate(() => {
        const headerTable = document.querySelector<HTMLTableElement>(
          '.dataTables_scrollHead table',
        );
        const bodyTable = document.querySelector<HTMLTableElement>(
          '.dataTables_scrollBody table',
        );
        if (!headerTable || !bodyTable) {
          return [`scrollX wrappers missing: head=${!!headerTable}, body=${!!bodyTable}`];
        }
        const filterThs = Array.from(
          headerTable.querySelectorAll<HTMLTableCellElement>(
            'thead tr:has(th.column-filter) th',
          ),
        );
        if (filterThs.length === 0) {
          return ['no filter-row <th> cells found'];
        }
        const firstBodyRow = bodyTable.querySelector<HTMLTableRowElement>(
          'tbody tr:not(:has(td.dataTables_empty))',
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

    await test.step('wait for datatable body to render', async () => {
      await expect(page.locator(BODY_ROWS).first()).toBeVisible({ timeout: 15000 });
    });

    const firstFilterInput = page
      .locator(`${HEAD_TABLE} thead tr:has(th.column-filter) th input.column-filter`)
      .first();
    await expect(firstFilterInput).toBeVisible({ timeout: 10000 });

    const baseline = await page.locator(BODY_ROWS).count();

    await test.step('fixture sanity: baseline has more than one body row', () => {
      expect(baseline).toBeGreaterThanOrEqual(2);
    });

    await test.step('fill a non-matching value and see empty-state appear', async () => {
      await firstFilterInput.fill('zzzzzzzzz-unlikely-match');
      // debounce is 250ms; poll up to 3s
      await expect(
        page.locator(`${BODY_TABLE} tbody td.dataTables_empty`),
      ).toBeVisible({ timeout: 3000 });
      await expect(page.locator(BODY_ROWS)).toHaveCount(1);
    });

    await test.step('clear and see rows restored', async () => {
      await firstFilterInput.fill('');
      await expect
        .poll(() => page.locator(BODY_ROWS).count(), { timeout: 3000 })
        .toBe(baseline);
      await expect(
        page.locator(`${BODY_TABLE} tbody td.dataTables_empty`),
      ).toHaveCount(0);
    });
  });
});
