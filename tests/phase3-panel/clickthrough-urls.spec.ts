import { expect, test } from '@grafana/plugin-e2e';

// Regression test for issue #276. Clickthrough URLs with host:port and
// path-relative clickthrough URLs both regressed in the React port:
// - `http://host:8080/...` rendered as `http://host/...` (port stripped)
// - `/d/uid/...` threw `TypeError: Invalid URL` and blanked the panel
// This spec loads a provisioned dashboard with two string columns —
// one carrying a port-preserving clickthrough, the other a path-
// relative clickthrough — and asserts the rendered `<a href>` exactly
// matches what the user configured (with `$__cell` macro expanded).

test.describe('clickthrough URL rendering (issue #276)', () => {
  test('host:port and relative URLs render their anchors correctly', async ({
    readProvisionedDashboard,
    gotoDashboardPage,
    page,
  }) => {
    const dashboard = await test.step('load provisioned dashboard', async () => {
      return readProvisionedDashboard({
        fileName: 'dashboards/Datatable-Clickthrough.json',
      });
    });

    await test.step('open dashboard', async () => {
      await gotoDashboardPage({ uid: dashboard.uid });
    });

    const firstRow = page.locator('.dt-scroll-body tbody tr').first();

    await test.step('wait for first row to render with anchors', async () => {
      await expect(firstRow.locator('td a').first()).toBeVisible({ timeout: 15000 });
    });

    await test.step('Host column anchor preserves host:port', async () => {
      const hostLink = firstRow.locator('td a').nth(0);
      await expect(hostLink).toHaveText('web-01');
      await expect(hostLink).toHaveAttribute(
        'href',
        'http://monitor.example:8080/hosts/web-01',
      );
    });

    await test.step('Dashboard column anchor is emitted as a relative path', async () => {
      const dashboardLink = firstRow.locator('td a').nth(1);
      await expect(dashboardLink).toHaveText('overview');
      await expect(dashboardLink).toHaveAttribute('href', '/d/uid/overview');
    });

    await test.step('subsequent rows expand $__cell per row', async () => {
      const secondRow = page.locator('.dt-scroll-body tbody tr').nth(1);
      await expect(secondRow.locator('td a').nth(0)).toHaveAttribute(
        'href',
        'http://monitor.example:8080/hosts/web-02',
      );
      await expect(secondRow.locator('td a').nth(1)).toHaveAttribute(
        'href',
        '/d/uid/hosts',
      );
    });
  });
});
