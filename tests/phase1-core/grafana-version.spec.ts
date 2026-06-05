import { expect, test } from '@grafana/plugin-e2e';

test('Check Grafana Version from Help Button', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  page,
}) => {
  // Navigate via the plugin-e2e helpers so auth and routing are handled
  // consistently with the rest of the test suite. We land on the empty test
  // dashboard rather than the Grafana home page to avoid the Grafana 13
  // portal overlay that intercepts pointer events on the home page and
  // cannot be suppressed via config.
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboards/Empty-Test-Dashboard.json' });
  await gotoDashboardPage({ uid: dashboard.uid });

  // Dismiss any portal/modal overlay that Grafana 13 shows on first visit
  // (e.g. feature announcements). Escape is a safe no-op on older versions.
  await page.keyboard.press('Escape');

  const helpButton = page.getByRole('button', { name: 'Help' });
  await helpButton.waitFor();
  await helpButton.click();

  const versionPattern = /Grafana v\d+/;
  await expect(page.getByText(versionPattern)).toContainText('Grafana v');
});
