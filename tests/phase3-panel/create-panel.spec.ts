import { expect, test } from '@grafana/plugin-e2e';

test('data query should return datatable', async ({ panelEditPage }) => {
  await panelEditPage.datasource.set('gdev-testdata');
  await panelEditPage.setVisualization('Datatable Panel');
  await expect(panelEditPage.refreshPanel()).toBeOK();
});
