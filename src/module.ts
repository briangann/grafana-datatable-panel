import { FieldConfigProperty, PanelPlugin } from '@grafana/data';
import { DatatableOptions } from './types';
import { DataTablePanel } from 'components/DataTablePanel';
import { optionsBuilder } from 'components/options/optionsBuilder';
import { DatatablePanelMigrationHandler } from './migrations';

export const plugin = new PanelPlugin<DatatableOptions>(DataTablePanel)
  .setMigrationHandler(DatatablePanelMigrationHandler)
  .useFieldConfig({
    disableStandardOptions: [
      FieldConfigProperty.Thresholds,
      FieldConfigProperty.Color,
      FieldConfigProperty.Decimals,
      FieldConfigProperty.DisplayName,
      FieldConfigProperty.Max,
      FieldConfigProperty.Min,
      FieldConfigProperty.Links,
      FieldConfigProperty.NoValue,
      FieldConfigProperty.Unit,
    ],
    standardOptions: {
      [FieldConfigProperty.Mappings]: {},
    },
  })
  .setPanelOptions(optionsBuilder);
