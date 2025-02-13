import { test, expect } from '@playwright/test';

import packageJSON from '../../package.json';

test('Check Plugin Installed', async ({ page }) => {
  // construct url to the plugin
  const urlToPlugin = `http://localhost:3000/plugins/${packageJSON.name}`;
  await page.goto(urlToPlugin, {waitUntil: 'networkidle'});
  // get version from package.json
  const pluginVersion = packageJSON.version;
  await expect(page.getByText(`Version${pluginVersion}`)).toContainText(pluginVersion);
});
