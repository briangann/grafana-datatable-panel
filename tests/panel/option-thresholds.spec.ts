import { expect, test } from '@grafana/plugin-e2e';
import type { Page } from '@playwright/test';

// Covers ThresholdsEditor.tsx and ThresholdItem.tsx — specifically the PR changes:
// - ThresholdItem wrapped in React.memo with displayName
// - findThresholdState hoisted to module scope (lazy useState initialiser)
// - updateThresholdValue stabilised via useRef + useEffect tracker-latch
// - useCallback on updateThresholdColor, updateThresholdState, addItem
//
// Threshold UI is nested inside the Column Styles editor (ColumnStyleItem with
// activeStyle=metric). We navigate there via the provisioned thresholds dashboard
// for view-side tests, and via panel edit for interaction tests.

test.describe('ThresholdsEditor — provisioned threshold rendering', () => {
  test('metric column with thresholds applies inline color styles to cells', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    // Datatable-RandomWalk-CustomThresholds.json has colorMode=value with 4 thresholds.
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Datatable-RandomWalk-CustomThresholds.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    await test.step('wait for table', async () => {
      await expect(
        page.getByTestId('datatable-panel-table').locator('tbody tr').first(),
      ).toBeVisible({ timeout: 15000 });
    });

    await test.step('at least one cell carries threshold color styling', async () => {
      // colorMode=value applies inline color: <hex> to the text. This exercises
      // the full threshold scan → GetColorAndIndexForValue → applyCreatedCell path.
      await expect
        .poll(() => page.locator('table tbody td[style*="color:"]').count(), {
          timeout: 10000,
        })
        .toBeGreaterThan(0);
    });
  });
});

test.describe('ThresholdsEditor — panel edit UI', () => {
  // Navigate to the Column Styles section, create a style with Metric type,
  // then interact with the ThresholdsEditor that appears.

  async function openColumnStylesAndAddMetricStyle(page: Page) {
    // Expand the Column Styles section
    const section = page.getByRole('button', { name: /Column Styles/i });
    await expect(section).toBeVisible({ timeout: 10000 });
    await section.click();

    // Add a new column style
    const addStyleButton = page.getByRole('button', { name: 'Add column style' });
    await expect(addStyleButton).toBeVisible({ timeout: 5000 });
    await addStyleButton.click();

    // Select "Metric" as the style type
    const styleTypeSelect = page.locator('[aria-label="Style Item Type"]').first();
    await expect(styleTypeSelect).toBeVisible({ timeout: 5000 });
    await styleTypeSelect.click();

    const metricOption = page.getByRole('option', { name: 'Metric', exact: true });
    await expect(metricOption).toBeVisible({ timeout: 5000 });
    await metricOption.click();
  }

  test('Add Threshold button is visible in a Metric column style', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('open column styles, add Metric style', async () => {
      await openColumnStylesAndAddMetricStyle(page);
    });

    await test.step('Add Threshold button is visible', async () => {
      await expect(page.getByRole('button', { name: 'Add Threshold' })).toBeVisible({ timeout: 5000 });
    });
  });

  test('clicking Add Threshold renders a ThresholdItem row', async ({
    panelEditPage,
    page,
  }) => {
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('open column styles, add Metric style', async () => {
      await openColumnStylesAndAddMetricStyle(page);
    });

    await test.step('click Add Threshold', async () => {
      const addButton = page.getByRole('button', { name: 'Add Threshold' });
      await expect(addButton).toBeVisible({ timeout: 5000 });
      await addButton.click();
    });

    await test.step('threshold value input appears', async () => {
      // ThresholdItem renders a numeric <Input> for the threshold value.
      await expect(
        page.locator('input[type="number"][step="1.0"]').first(),
      ).toBeVisible({ timeout: 5000 });
    });

    await test.step('delete threshold button appears', async () => {
      await expect(
        page.getByRole('button', { name: /Delete Threshold/i }),
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test('adding two thresholds then deleting one leaves one remaining', async ({
    panelEditPage,
    page,
  }) => {
    // This exercises the useRef tracker latch that stabilises updateThresholdValue.
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('open column styles, add Metric style', async () => {
      await openColumnStylesAndAddMetricStyle(page);
    });

    await test.step('add two thresholds', async () => {
      const addButton = page.getByRole('button', { name: 'Add Threshold' });
      await expect(addButton).toBeVisible({ timeout: 5000 });
      await addButton.click();
      await expect(page.locator('input[type="number"][step="1.0"]').first()).toBeVisible();
      await addButton.click();
      await expect(page.locator('input[type="number"][step="1.0"]')).toHaveCount(2, { timeout: 5000 });
    });

    await test.step('delete the first threshold', async () => {
      await page.getByRole('button', { name: /Delete Threshold/i }).first().click();
    });

    await test.step('one threshold row remains', async () => {
      await expect(
        page.locator('input[type="number"][step="1.0"]'),
      ).toHaveCount(1, { timeout: 5000 });
    });
  });

  test('threshold value input accepts numeric entry', async ({
    panelEditPage,
    page,
  }) => {
    // Exercises updateThresholdValue callback and trackerRef latch.
    await panelEditPage.datasource.set('gdev-testdata');
    await panelEditPage.setVisualization('Datatable Panel');
    await expect(panelEditPage.refreshPanel()).toBeOK();

    await test.step('open column styles, add Metric style, add threshold', async () => {
      await openColumnStylesAndAddMetricStyle(page);
      const addButton = page.getByRole('button', { name: 'Add Threshold' });
      await expect(addButton).toBeVisible({ timeout: 5000 });
      await addButton.click();
    });

    await test.step('enter a threshold value', async () => {
      const valueInput = page.locator('input[type="number"][step="1.0"]').first();
      await expect(valueInput).toBeVisible();
      await valueInput.fill('42');
      await expect(valueInput).toHaveValue('42');
    });
  });
});
