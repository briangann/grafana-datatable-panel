import { test } from '@grafana/plugin-e2e';

// Grafana 13 shows a portal overlay on the first page visit after login.
// The overlay intercepts pointer events and blocks all panel interactions.
// Navigating to the empty test dashboard here absorbs the overlay for the
// entire auth session — the dismissal is stored in the browser's localStorage
// and persists into every subsequent test that loads from admin.json.
test('dismiss initial Grafana 13 portal overlay', async ({ readProvisionedDashboard, gotoDashboardPage, page }) => {
  const dashboard = await readProvisionedDashboard({
    fileName: 'dashboards/Empty-Test-Dashboard.json',
  });
  await gotoDashboardPage({ uid: dashboard.uid });

  // Wait briefly for the portal to appear, then dismiss it.
  // The catch is intentional — if the portal never appears (older Grafana or
  // already dismissed), this is a no-op and the test still passes.
  try {
    await page
      .locator('#grafana-portal-container')
      .waitFor({ state: 'visible', timeout: 3000 });
    await page.keyboard.press('Escape');
    await page
      .locator('#grafana-portal-container')
      .waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Portal did not appear — nothing to dismiss.
  }

  // Save the updated storage state (includes any localStorage dismissal flags)
  // so all subsequent tests start with the portal already gone.
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
