import { expect, test } from '@grafana/plugin-e2e';

// Covers ColumnAliasesEditor.tsx — the useMemo(getDataFrameFields, [data])
// refactor and the add/remove alias workflow.
//
// The provisioned Datatable-RandomWalk-CustomThresholds.json dashboard has
// one column alias configured: "A-series" → "B-Series". We verify it renders
// in the table header, proving the memo-stabilised availableFields feeds the
// alias pipeline correctly.

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
      await expect(
        page.getByTestId('datatable-panel-table').locator('tbody tr').first(),
      ).toBeVisible({ timeout: 15000 });
    });

    await test.step('aliased column header "B-Series" is visible', async () => {
      // "A-series" is aliased to "B-Series" in the provisioned options.
      // ApplyColumnAliases runs in the data pipeline; if the memo is broken
      // the alias never reaches the column def builder.
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

    await test.step('expand Column Aliases section', async () => {
      const section = page.getByRole('button', { name: /Column Aliases/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
    });

    await test.step('Add Alias button is visible', async () => {
      await expect(page.getByRole('button', { name: 'Add Alias' })).toBeVisible();
    });
  });

  test('clicking Add Alias renders a new alias row', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Aliases section', async () => {
      const section = page.getByRole('button', { name: /Column Aliases/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
    });

    await test.step('click Add Alias', async () => {
      const addButton = page.getByRole('button', { name: 'Add Alias' });
      await expect(addButton).toBeVisible();
      await addButton.click();
    });

    await test.step('new alias row appears with remove button', async () => {
      await expect(
        page.getByRole('button', { name: 'Remove column' }).first(),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test('removing an alias row hides it', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Aliases section and add an alias', async () => {
      const section = page.getByRole('button', { name: /Column Aliases/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
      await page.getByRole('button', { name: 'Add Alias' }).click();
      await expect(page.getByRole('button', { name: 'Remove column' }).first()).toBeVisible();
    });

    await test.step('click Remove column', async () => {
      await page.getByRole('button', { name: 'Remove column' }).first().click();
    });

    await test.step('alias row is gone', async () => {
      await expect(page.getByRole('button', { name: 'Remove column' })).not.toBeVisible({ timeout: 5000 });
    });
  });
});
