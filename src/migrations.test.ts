import { PanelModel } from '@grafana/data';

import {
  DatatablePanelMigrationHandler,
} from './migrations';

describe('Datatable -> DatatableV2 migrations', () => {
  it('only migrates old datatable', () => {
    const panel = {} as PanelModel;
    const options = DatatablePanelMigrationHandler(panel);
    expect(options).toEqual({});
  });

  it('migrates old datatable config', () => {
    const panel = {} as PanelModel;
    panel.options = {};
    const options = DatatablePanelMigrationHandler(panel);
    expect(options).toMatchSnapshot();
  });

});
