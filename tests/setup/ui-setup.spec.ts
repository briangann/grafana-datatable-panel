import { test } from '@grafana/plugin-e2e';

// Grafana 13 shows a portal overlay on the first page visit after login.
// The overlay intercepts pointer events and blocks all panel interactions.
// Navigating to the empty test dashboard here absorbs the overlay for the
// entire auth session — the dismissal is stored in the browser's localStorage
// and persists into every subsequent test that loads from admin.json.
test('dismiss initial Grafana 13 portal overlay', async ({ readProvisionedDashboard, gotoDashboardPage, page }) => {
  // Wrap everything so storageState is always written — even if navigation
  // fails (e.g. provisioned dashboard missing in a cold CI container).
  // If we skip the write, ALL chromium tests are skipped rather than failing
  // individually, because chromium depends on this project succeeding.
  try {
    const dashboard = await readProvisionedDashboard({
      fileName: 'dashboards/Empty-Test-Dashboard.json',
    });
    await gotoDashboardPage({ uid: dashboard.uid });

    // Wait briefly for the portal to appear, then dismiss it.
    // Inner catch is intentional — if the portal never appears (older Grafana
    // or already dismissed), this is a no-op.
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
  } catch (err) {
    // Navigation failed — log so CI output explains the failure, but still
    // fall through to write storageState so chromium tests run and fail on
    // the actual assertion rather than being silently skipped.
    console.warn('ui-setup: navigation failed, writing unmodified auth state:', err);
  }

  // Always write — ensures chromium tests receive a valid storageState file
  // regardless of whether portal dismissal succeeded.
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
