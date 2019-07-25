import { DatatablePanelCtrl } from './ctrl';

import { loadPluginCss } from 'grafana/app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/briangann-datatable-panel/styles/dark.css',
  light: 'plugins/briangann-datatable-panel/styles/light.css',
});

export { DatatablePanelCtrl as PanelCtrl };
