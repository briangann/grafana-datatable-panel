import { expect, test } from '@grafana/plugin-e2e';
import type { Page } from '@playwright/test';

// Covers ColumnStyleItem.tsx — the PR change that hoisted COLUMN_STYLE_OPTIONS
// to module scope. The options array must contain Date, String, Metric, Hidden
// with no duplicates regardless of render count.

async function expandSection(page: Page, category: string) {
  const expandBtn = page.getByRole('button', { name: `Expand ${category} category` });
  if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expandBtn.click();
  }
}

// Add a style. ColumnStylesEditor's addItem sets isOpen=true immediately,
// so the new style's Collapse is already open — do NOT click the toggle.
async function addStyle(page: Page) {
  await expandSection(page, 'Column Styles');

  const addButton = page.getByRole('button', { name: 'Add Style' });
  await expect(addButton).toBeVisible({ timeout: 10000 });
  await addButton.click();

  // New style defaults to activeStyle=METRIC and isOpen=true.
  // Scroll into view — the options sidebar can extend past the viewport height.
  const styleSelect = page.getByTestId('column-style-type-select').first();
  await styleSelect.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
}

test.describe('ColumnStyleItem — COLUMN_STYLE_OPTIONS content', () => {
  test('style type dropdown offers Date, String, Metric, Hidden options', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Styles section and add + expand a style', async () => {
      await addStyle(page);
    });

    await test.step('open the Style Item Type dropdown', async () => {
      // The Field label "Style Item Type" associates with the Select inside it.
      const styleTypeSelect = page.getByTestId('column-style-type-select').first();
      await expect(styleTypeSelect).toBeVisible({ timeout: 5000 });
      await styleTypeSelect.click();
    });

    await test.step('all four style options are present', async () => {
      await expect(page.getByRole('option', { name: 'Date', exact: true })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('option', { name: 'String', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Metric', exact: true })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Hidden', exact: true })).toBeVisible();
    });

    await test.step('exactly four style options — no duplicates from re-render', async () => {
      // If COLUMN_STYLE_OPTIONS were rebuilt per render, duplicates could appear.
      await expect(page.getByRole('option')).toHaveCount(4);
    });
  });

  test('selecting Metric style type shows Add Threshold button', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Styles, add + expand a style', async () => {
      await addStyle(page);
    });

    await test.step('select Metric type', async () => {
      const styleTypeSelect = page.getByTestId('column-style-type-select').first();
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

  test('selecting Hidden style type does not show Add Threshold button', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('expand Column Styles, add + expand a style', async () => {
      await addStyle(page);
    });

    await test.step('select Hidden type', async () => {
      const styleTypeSelect = page.getByTestId('column-style-type-select').first();
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
