import { PanelPlugin } from '@grafana/data';
import { DatatableOptions } from './types';
import { DataTablePanel } from 'components/DataTablePanel';
import { optionsBuilder } from 'components/options/optionsBuilder';
import { DatatablePanelMigrationHandler } from './migrations';

export const plugin = new PanelPlugin<DatatableOptions>(DataTablePanel)
  .setMigrationHandler(DatatablePanelMigrationHandler)
  .setPanelOptions(optionsBuilder);
