import { expect, test } from '@grafana/plugin-e2e';

// Regression test for issue #278. When "Filter by column" is enabled,
// DataTables runs in scrollX mode, which splits the table into a visible
// header clone (.dt-scroll-head) and the body (.dt-scroll-body).
// Each filter-row <th> in the header clone must match the body <td> width
// at the same column index — otherwise content visibly spills.

const HEAD_TABLE = '.dt-scroll-head table';
const BODY_TABLE = '.dt-scroll-body table';
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
        if (filterThs.length === 0) {
          return ['no filter-row <th> cells found'];
        }
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

  test('filter inputs are interactive and placeholder-labelled per column', async ({
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

    const filterInputs = page.locator(
      `${HEAD_TABLE} thead tr:has(th.column-filter) th input.column-filter`,
    );

    await test.step('one filter input per column, each carrying a Search placeholder', async () => {
      const count = await filterInputs.count();
      expect(count).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < count; i++) {
        const placeholder = await filterInputs.nth(i).getAttribute('placeholder');
        expect(placeholder).toMatch(/^Search /);
      }
    });

    await test.step('clicking a filter input focuses it and does not trigger sort', async () => {
      const firstInput = filterInputs.first();
      // Snapshot the header-sort classes before interacting with the filter.
      const sortBefore = await page
        .locator(`${HEAD_TABLE} thead tr:not(:has(th.column-filter)) th`)
        .first()
        .getAttribute('class');

      await firstInput.click();
      await expect(firstInput).toBeFocused();

      const sortAfter = await page
        .locator(`${HEAD_TABLE} thead tr:not(:has(th.column-filter)) th`)
        .first()
        .getAttribute('class');
      expect(sortAfter).toBe(sortBefore);
    });

    await test.step('typing into the input updates its value', async () => {
      const firstInput = filterInputs.first();
      await firstInput.fill('filter-probe');
      await expect(firstInput).toHaveValue('filter-probe');
      await firstInput.fill('');
      await expect(firstInput).toHaveValue('');
    });
  });
});
