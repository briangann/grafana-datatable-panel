import { expect, test } from '@grafana/plugin-e2e';

// Covers ColumnWidthHintsEditor.tsx — specifically:
// - useMemo(getDataFrameFields, [data]) memoisation (expensive call stable)
// - spread fix: [...getDataFrameFields(...), 'row'] avoids mutation of the
//   memoised array, preventing duplicate 'row' entries across renders
// - Add / Remove width hint lifecycle

test.describe('ColumnWidthHintsEditor — panel edit UI', () => {
  test('Add Width Hint button is reachable in panel edit options', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Width Hints section', async () => {
      const section = page.getByRole('button', { name: /Column Width Hints/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
    });

    await test.step('Add Width Hint button is visible', async () => {
      await expect(page.getByRole('button', { name: 'Add Width Hint' })).toBeVisible();
    });
  });

  test('clicking Add Width Hint renders a new row with Column and Width fields', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Width Hints section', async () => {
      const section = page.getByRole('button', { name: /Column Width Hints/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
    });

    await test.step('click Add Width Hint', async () => {
      const addButton = page.getByRole('button', { name: 'Add Width Hint' });
      await expect(addButton).toBeVisible();
      await addButton.click();
    });

    await test.step('new row shows Column field label', async () => {
      await expect(page.getByText('Column').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('new row shows Width field label', async () => {
      await expect(page.getByText('Width').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('remove button is present', async () => {
      await expect(
        page.getByRole('button', { name: 'Remove column' }).first(),
      ).toBeVisible();
    });
  });

  test('adding multiple width hints does not produce duplicate "row" entries in column dropdown', async ({
    panelEditPage,
    page,
  }) => {
    // Regression for the mutation bug: ColumnWidthHintsEditor used to push('row')
    // onto the memoised array, causing 'row' to appear twice on re-render.
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Width Hints section', async () => {
      const section = page.getByRole('button', { name: /Column Width Hints/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
    });

    await test.step('add two width hints to trigger multiple renders', async () => {
      const addButton = page.getByRole('button', { name: 'Add Width Hint' });
      await expect(addButton).toBeVisible();
      await addButton.click();
      await expect(page.getByRole('button', { name: 'Remove column' }).first()).toBeVisible();
      await addButton.click();
      await expect(page.getByRole('button', { name: 'Remove column' })).toHaveCount(2, { timeout: 5000 });
    });

    await test.step('open column dropdown on the second row', async () => {
      // aria-label contains the current column name (empty = "")
      const selects = page.locator('[aria-label^="Current selected column"]');
      await selects.last().click();
    });

    await test.step('"row" option appears exactly once in the dropdown', async () => {
      const rowOptions = page.getByRole('option', { name: 'row', exact: true });
      await expect(rowOptions).toHaveCount(1, { timeout: 5000 });
    });
  });

  test('removing a width hint hides its row', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand section and add a hint', async () => {
      const section = page.getByRole('button', { name: /Column Width Hints/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
      await page.getByRole('button', { name: 'Add Width Hint' }).click();
      await expect(page.getByRole('button', { name: 'Remove column' }).first()).toBeVisible();
    });

    await test.step('click Remove column', async () => {
      await page.getByRole('button', { name: 'Remove column' }).first().click();
    });

    await test.step('row is gone', async () => {
      await expect(page.getByRole('button', { name: 'Remove column' })).not.toBeVisible({ timeout: 5000 });
    });
  });
});
