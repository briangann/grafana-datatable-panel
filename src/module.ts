import { DatatablePanelCtrl } from './ctrl';

import { loadPluginCss } from 'grafana/app/plugins/sdk';

import './styles/panel.scss';
import './styles/datatables-wrapper.scss';
import './styles/jquery.dataTables.min.css';

loadPluginCss({
  dark: 'plugins/briangann-datatable-panel/styles/dark.css',
  light: 'plugins/briangann-datatable-panel/styles/light.css',
});

export { DatatablePanelCtrl as PanelCtrl };
