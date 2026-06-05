import { expect, test } from '@grafana/plugin-e2e';

import packageJSON from '../../package.json';

test('Check Plugin Installed', async ({ page }) => {
  // Navigate to the plugin catalog page. @grafana/plugin-e2e has no specific
  // fixture for this URL so page.goto is used directly.
  await page.goto(`http://localhost:3000/plugins/${packageJSON.name}`);

  // Dismiss any portal/modal overlay that Grafana 13 may show on first visit.
  await page.keyboard.press('Escape');

  const pluginVersion = packageJSON.version;
  const pattern = new RegExp(`Installed Version:?.*${pluginVersion}`);
  // Wait directly for the version text — the Help button is not needed as a
  // load sentinel here, and it can fail in Grafana 13 due to portal overlays.
  await expect(page.getByText(pattern)).toContainText(pluginVersion, { timeout: 15000 });
});
