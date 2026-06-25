import { expect, test } from '@grafana/plugin-e2e';

// Covers ColumnStyleItem.tsx — specifically the PR change that hoisted
// COLUMN_STYLE_OPTIONS to module scope (was rebuilt every render). The options
// array must contain the same four entries regardless of render count:
// Date, String, Metric, Hidden.
//
// Tests navigate to the Column Styles section in panel edit, add a style, and
// verify the style type dropdown contains the correct options.

test.describe('ColumnStyleItem — COLUMN_STYLE_OPTIONS content', () => {
  test('style type dropdown offers Date, String, Metric, Hidden options', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Styles section', async () => {
      const section = page.getByRole('button', { name: /Column Styles/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
    });

    await test.step('add a new column style', async () => {
      const addButton = page.getByRole('button', { name: 'Add column style' });
      await expect(addButton).toBeVisible({ timeout: 5000 });
      await addButton.click();
    });

    await test.step('open the Style Item Type dropdown', async () => {
      const styleTypeSelect = page.locator('[aria-label="Style Item Type"]').first();
      await expect(styleTypeSelect).toBeVisible({ timeout: 5000 });
      await styleTypeSelect.click();
    });

    await test.step('all four style options are present', async () => {
      await expect(page.getByRole('option', { name: 'Date', exact: true })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('option', { name: 'String', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Metric', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Hidden', exact: true })).toBeVisible();
    });

    await test.step('exactly four style options (no duplicates from re-render)', async () => {
      // If COLUMN_STYLE_OPTIONS were rebuilt per render and the component
      // re-rendered many times, duplicates could appear. Four and only four.
      const options = page.getByRole('option');
      await expect(options).toHaveCount(4);
    });
  });

  test('selecting Metric style type shows metric-specific fields', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Styles, add style', async () => {
      const section = page.getByRole('button', { name: /Column Styles/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
      await page.getByRole('button', { name: 'Add column style' }).click();
    });

    await test.step('select Metric type', async () => {
      const styleTypeSelect = page.locator('[aria-label="Style Item Type"]').first();
      await expect(styleTypeSelect).toBeVisible({ timeout: 5000 });
      await styleTypeSelect.click();
      const metricOption = page.getByRole('option', { name: 'Metric', exact: true });
      await expect(metricOption).toBeVisible({ timeout: 5000 });
      await metricOption.click();
    });

    await test.step('Add Threshold button appears (metric-specific)', async () => {
      await expect(page.getByRole('button', { name: 'Add Threshold' })).toBeVisible({ timeout: 5000 });
    });
  });

  test('selecting Hidden style type hides metric/string fields', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Styles, add style', async () => {
      const section = page.getByRole('button', { name: /Column Styles/i });
      await expect(section).toBeVisible({ timeout: 10000 });
      await section.click();
      await page.getByRole('button', { name: 'Add column style' }).click();
    });

    await test.step('select Hidden type', async () => {
      const styleTypeSelect = page.locator('[aria-label="Style Item Type"]').first();
      await expect(styleTypeSelect).toBeVisible({ timeout: 5000 });
      await styleTypeSelect.click();
      const hiddenOption = page.getByRole('option', { name: 'Hidden', exact: true });
      await expect(hiddenOption).toBeVisible({ timeout: 5000 });
      await hiddenOption.click();
    });

    await test.step('Add Threshold button is not visible for Hidden type', async () => {
      await expect(page.getByRole('button', { name: 'Add Threshold' })).not.toBeVisible({ timeout: 3000 });
    });
  });
});
