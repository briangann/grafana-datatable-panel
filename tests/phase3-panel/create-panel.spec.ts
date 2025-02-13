import { expect, test } from '@grafana/plugin-e2e';

test('data query should return datatable', async ({ panelEditPage }) => {
  await panelEditPage.datasource.set('gdev-testdata');
  await panelEditPage.setVisualization('Datatable for Grafana');
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
