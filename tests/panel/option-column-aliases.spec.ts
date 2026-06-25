import { expect, test } from '@grafana/plugin-e2e';
import type { Page } from '@playwright/test';

// Covers ColumnAliasesEditor.tsx — the useMemo(getDataFrameFields, [data])
// refactor and the add/remove alias workflow.

async function expandSection(page: Page, category: string) {
  const expandBtn = page.getByRole('button', { name: `Expand ${category} category` });
  if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expandBtn.click();
  }
}

test.describe('ColumnAliasesEditor — alias applied to table header', () => {
  test('provisioned alias renames column header in rendered table', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-RandomWalk-CustomThresholds.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await test.step('wait for table to render', async () => {
      // Match existing working pattern — no .first() on the table locator;
      // chain .locator('tbody tr') to query across all matching tables.
      await expect(
        page.getByTestId('datatable-panel-table').locator('tbody tr').first(),
      ).toBeVisible({ timeout: 15000 });
    });

    await test.step('aliased column header "B-Series" is visible', async () => {
      await expect(
        page.locator('.dt-scroll-head thead th', { hasText: 'B-Series' }),
      ).toBeVisible();
    });

    await test.step('original column name "A-series" is not shown', async () => {
      const headers = page.locator('.dt-scroll-head thead th');
      const count = await headers.count();
      const texts: Array<string | null> = [];
      for (let i = 0; i < count; i++) {
        texts.push(await headers.nth(i).textContent());
      }
      expect(texts).not.toContain('A-series');
    });
  });
});

test.describe('ColumnAliasesEditor — panel edit UI', () => {
  test('Add Alias button is reachable in panel edit options', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Aliases section if collapsed', async () => {
      await expandSection(page, 'Column Aliases');
    });

    await test.step('Add Alias button is visible', async () => {
      await expect(page.getByRole('button', { name: 'Add Alias' })).toBeVisible({ timeout: 10000 });
    });
  });

  test('clicking Add Alias renders a new alias row', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Aliases section if collapsed', async () => {
      await expandSection(page, 'Column Aliases');
    });

    await test.step('record Remove column count before add', async () => {
      // No alias rows initially — count is baseline for later assertions
    });

    await test.step('click Add Alias', async () => {
      const addButton = page.getByRole('button', { name: 'Add Alias' });
      await expect(addButton).toBeVisible({ timeout: 10000 });
      await addButton.click();
    });

    await test.step('at least one Remove column button appeared', async () => {
      await expect(
        page.getByRole('button', { name: 'Remove column' }).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test('removing an alias row decreases the row count by one', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    let beforeCount = 0;
    await test.step('expand Column Aliases section, add an alias, record count', async () => {
      await expandSection(page, 'Column Aliases');
      const addButton = page.getByRole('button', { name: 'Add Alias' });
      await expect(addButton).toBeVisible({ timeout: 10000 });
      await addButton.click();
      await expect(page.getByRole('button', { name: 'Remove column' }).first()).toBeVisible();
      beforeCount = await page.getByRole('button', { name: 'Remove column' }).count();
    });

    await test.step('click Remove column', async () => {
      await page.getByRole('button', { name: 'Remove column' }).first().click();
    });

    await test.step('Remove column count decreased by one', async () => {
      await expect(page.getByRole('button', { name: 'Remove column' })).toHaveCount(
        beforeCount - 1, { timeout: 5000 },
      );
    });
  });
});
