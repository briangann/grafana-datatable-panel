import { expect, test } from '@grafana/plugin-e2e';

// Datatable-TextAlignmentPanelLevel.json configures:
//   - alignNumbersToRightEnabled: true  (Value column should keep dt-right)
//   - alignStringsToRightEnabled: false (Name column should NOT get dt-right)
//   - no per-column overrides
// CSV: Name,Value → Name is a string column, Value is a number column.
// This proves the panel-level toggle gates the class-level alignment;
// without the fix, the Name column would carry dt-right unconditionally.
test('alignStringsToRightEnabled=false leaves string columns without dt-right', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  const dashboard = await test.step('load provisioned dashboard', async () => {
    return readProvisionedDashboard({
      fileName: 'dashboards/Datatable-TextAlignmentPanelLevel.json',
    });
  });

  await test.step('open dashboard', async () => {
    await gotoDashboardPage({ uid: dashboard.uid });
  });

  await test.step('wait for datatable to render', async () => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  await test.step('Name column cells (1st column) do not carry dt-right', async () => {
    // Name is the first column. dt-right is what makes text right-align at the
    // class level; with alignStringsToRightEnabled=false it must be absent.
    await expect(page.locator('table tbody tr').first().locator('td').first()).not.toHaveClass(/\bdt-right\b/);
  });

  await test.step('Value column cells (2nd column) still carry dt-right', async () => {
    // alignNumbersToRightEnabled is still true, so the numeric column should
    // retain the class. Acts as a positive control for the previous step.
    await expect(page.locator('table tbody tr').first().locator('td').nth(1)).toHaveClass(/\bdt-right\b/);
  });
});
