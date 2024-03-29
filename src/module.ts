import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { DataTablePanel } from 'components/DataTablePanel';
import { optionsBuilder } from 'components/options/optionsBuilder';

export const plugin = new PanelPlugin<SimpleOptions>(DataTablePanel).setPanelOptions(optionsBuilder);
