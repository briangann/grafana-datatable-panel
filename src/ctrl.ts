import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import _ from 'lodash';
import angular from 'angular';
import kbn from 'grafana/app/core/utils/kbn';

import * as FileExport from 'grafana/app/core/utils/file_export';

// this is needed for basic datatables.net theme
//import './libs/datatables.net-dt/css/jquery.dataTables.min.css!';

// See this for styling https://datatables.net/manual/styling/theme-creator

/*
Dark Theme Basic uses these values

table section border: #242222 rgb(36,34,34)
row/cell border: #141414 rgb(20,20,20)
row background: #1F1D1D  rgb(31,29,29)
row selected color:  #242222 rgb(36,34,34)
control text: #1FB2E5 rgb(31,178,229)
control text: white  (dataTables_paginate)
paging active button: #242222 rgb(36,34,34)
paging button hover: #111111 rgb(17,17,17)

with these modifications:
.dataTables_wrapper .dataTables_paginate .paginate_button {
  color: white
}
table.dataTable tfoot th {
  color: #1FB2E5;
  font-weight: bold; }


Light Theme Basic uses these values

table section border: #ECECEC rgb(236,236,236)
row/cell border: #FFFFFF rgb(255,255,255)
row background: #FBFBFB  rgb(251,251,251)
row selected color:  #ECECEC rgb(236,236,236)
control text: black
paging active button: #BEBEBE
paging button hover: #C0C0C0

with these modifications:
.dataTables_wrapper .dataTables_paginate .paginate_button.current, .dataTables_wrapper .dataTables_paginate .paginate_button.current:hover {
  color: #1fb2e5 !important;
table.dataTable tfoot th {
  color: #1FB2E5;
  font-weight: bold; }
*/

// TODO: FIX CSS import
//import './css/panel.css!';
// themes attempt to modify the entire page, this "contains" the styling to the table only
// TODO: FIX CSS import
//import './css/datatables-wrapper.css!';

import { transformDataToTable, transformers } from './transformers';

import { DatatableRenderer } from './renderer';
//mport { config } from 'rxjs';

const panelDefaults = {
  targets: [{}],
  transform: 'timeseries_to_columns',
  rowsPerPage: 5,
  showHeader: true,
  styles: [
    {
      type: 'date',
      pattern: 'Time',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      unit: 'short',
      type: 'number',
      decimals: 2,
      colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
      colorMode: null,
      pattern: '/.*/',
      thresholds: [],
    },
  ],
  columns: [],
  scroll: false,
  scrollHeight: 'default',
  fontSize: '100%',
  sort: {
    col: 0,
    desc: true,
  },
  columnAliases: [],
  columnWidthHints: [],
  sortByColumnsData: [[0, 'desc']],
  sortByColumns: [
    {
      columnData: 0,
      sortMethod: 'desc',
    },
  ],
  datatableTheme: 'basic_theme',
  themeOptions: {
    light: './styles/light.css',
    dark: './styles/dark.css',
  },
  rowNumbersEnabled: false,
  infoEnabled: true,
  searchEnabled: true,
  showCellBorders: false,
  showRowBorders: true,
  hoverEnabled: true,
  orderColumnEnabled: true,
  compactRowsEnabled: false,
  stripedRowsEnabled: true,
  lengthChangeEnabled: true,
  datatablePagingType: 'simple_numbers',
  pagingTypes: [
    {
      text: 'Page number buttons only',
      value: 'numbers',
    },
    {
      text: "'Previous' and 'Next' buttons only",
      value: 'simple',
    },
    {
      text: "'Previous' and 'Next' buttons, plus page numbers",
      value: 'simple_numbers',
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons",
      value: 'full',
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers",
      value: 'full_numbers',
    },
    {
      text: "'First' and 'Last' buttons, plus page numbers",
      value: 'first_last_numbers',
    },
  ],
  themes: [
    {
      value: 'basic_theme',
      text: 'Basic',
      disabled: false,
    },
    {
      value: 'bootstrap_theme',
      text: 'Bootstrap',
      disabled: true,
    },
    {
      value: 'foundation_theme',
      text: 'Foundation',
      disabled: true,
    },
    {
      value: 'themeroller_theme',
      text: 'ThemeRoller',
      disabled: true,
    },
  ],
};

export class DatatablePanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'partials/template.html';
  dataLoaded: boolean;
  pageIndex: number;
  table: any;
  dataRaw: any[];
  transformers: any;
  annotationsSrv: any;
  uiSegmentSrv: any;
  addColumnSegment: any;
  mappingTypes: any;
  columnSortMethods: any;
  fontSizes: any;
  colorModes: any;
  columnTypes: any;
  unitFormats: any;
  dateFormats: any;
  http: any;
  getColumnNames: () => any[];

  /** @ngInject */
  constructor($scope: any, $injector: any, $http: any, $location: any, uiSegmentSrv: any, annotationsSrv: any, private $sanitize: any) {
    super($scope, $injector);

    this.pageIndex = 0;
    this.table = null;
    this.dataRaw = [];
    this.transformers = transformers;
    this.annotationsSrv = annotationsSrv;
    this.uiSegmentSrv = uiSegmentSrv;
    // editor

    this.addColumnSegment = uiSegmentSrv.newPlusButton();
    this.mappingTypes = [{ text: 'Value to text', value: 1 }, { text: 'Range to text', value: 2 }];
    this.columnSortMethods = [
      {
        text: 'Ascending',
        value: 'asc',
      },
      {
        text: 'Descending',
        value: 'desc',
      },
    ];

    this.fontSizes = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];
    this.colorModes = [
      {
        text: 'Disabled',
        value: null,
      },
      {
        text: 'Cell',
        value: 'cell',
      },
      {
        text: 'Value',
        value: 'value',
      },
      {
        text: 'Row',
        value: 'row',
      },
      {
        text: 'Row Column',
        value: 'rowcolumn',
      },
    ];
    this.columnTypes = [
      {
        text: 'Number',
        value: 'number',
      },
      {
        text: 'String',
        value: 'string',
      },
      {
        text: 'Date',
        value: 'date',
      },
      {
        text: 'Hidden',
        value: 'hidden',
      },
    ];
    this.unitFormats = kbn.getUnitFormats();
    this.dateFormats = [
      {
        text: 'YYYY-MM-DD HH:mm:ss',
        value: 'YYYY-MM-DD HH:mm:ss',
      },
      {
        text: 'MM/DD/YY h:mm:ss a',
        value: 'MM/DD/YY h:mm:ss a',
      },
      {
        text: 'MMMM D, YYYY LT',
        value: 'MMMM D, YYYY LT',
      },
    ];
    // this is used from bs-typeahead and needs to be instance bound
    this.getColumnNames = () => {
      if (!this.table) {
        return [];
      }
      return _.map(this.table.columns, col => {
        return col.text;
      });
    };

    if (this.panel.styles === void 0) {
      this.panel.styles = this.panel.columns;
      this.panel.columns = this.panel.fields;
      delete this.panel.columns;
      delete this.panel.fields;
    }
    _.defaults(this.panel, panelDefaults);

    SystemJS.config({
      paths: {
        'datatables.net': this.getPanelPath() + 'libs/datatables.net/js/jquery.dataTables.min',
        'datatables.net-bs': this.getPanelPath() + 'libs/datatables.net-bs/js/dataTables.bootstrap.min',
        'datatables.net-jqui': this.getPanelPath() + 'libs/datatables.net-jqui/js/dataTables.jqueryui.min',
        'datatables.net-zf': this.getPanelPath() + 'libs/datatables.net-zf/js/dataTables.foundation.min',
      },
    });

    // basic datatables theme
    // alternative themes are disabled since they affect all datatable panels on same page currently
    // light/dark
    /*
      TODO: support different themes, this method is not usable currently

    let isLight = false;
    const grafanaBootData = (window as any).grafanaBootData;
    if (typeof grafanaBootData !== 'undefined') {
      if (grafanaBootData.user.lightTheme) {
        isLight = true;
      }
    }
    switch (this.panel.datatableTheme) {
      case 'basic_theme':
        //SystemJS.import(this.getPanelPath() + 'libs/datatables.net-dt/css/jquery.dataTables.min.css!');
        SystemJS.import(this.getPanelPath() + 'styles/jquery.dataTables.min.css!');
        if (isLight) {
          SystemJS.import(this.getPanelPath() + this.panel.themeOptions.light + '!css');
        } else {
          SystemJS.import(this.getPanelPath() + this.panel.themeOptions.dark + '!css');
        }
        break;
      case 'bootstrap_theme':
        SystemJS.import(this.getPanelPath() + 'libs/datatables.net-bs/js/dataTables.bootstrap.min.js');
        SystemJS.import(this.getPanelPath() + 'libs/bootstrap/dist/css/prefixed-bootstrap.min.css!');
        SystemJS.import(this.getPanelPath() + 'libs/datatables.net-bs/css/dataTables.bootstrap.min.css!');
        if (!isLight) {
          SystemJS.import(this.getPanelPath() + 'css/prefixed-bootstrap-slate.min.css!');
        }
        break;
      case 'foundation_theme':
        SystemJS.import(this.getPanelPath() + 'libs/datatables.net-zf/js/dataTables.foundation.min.js');
        SystemJS.import(this.getPanelPath() + 'libs/foundation/css/prefixed-foundation.min.css!');
        SystemJS.import(this.getPanelPath() + 'libs/datatables.net-zf/css/dataTables.foundation.min.css!');
        break;
      case 'themeroller_theme':
        SystemJS.import(this.getPanelPath() + 'libs/datatables.net-jqui/js/dataTables.jqueryui.min.js');
        SystemJS.import(this.getPanelPath() + 'libs/datatables.net-jqui/css/dataTables.jqueryui.min.css!');
        SystemJS.import(this.getPanelPath() + 'css/jquery-ui-smoothness.css!');
        break;
      default:
        //SystemJS.import(this.getPanelPath() + 'libs/datatables.net-dt/css/jquery.dataTables.min.css!');
        SystemJS.import(this.getPanelPath() + 'styles/jquery.dataTables.min.css!');
        if (isLight) {
          SystemJS.import(this.getPanelPath() + this.panel.themeOptions.light + '!css');
        } else {
          SystemJS.import(this.getPanelPath() + this.panel.themeOptions.dark + '!css');
        }
        break;
    }
    */
    this.dataLoaded = true;
    this.http = $http;
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));
  }

  onInitPanelActions(actions: any) {
    actions.push({
      text: 'Export CSV',
      click: 'ctrl.exportCsv()',
    });
  }

  // setup the editor
  onInitEditMode() {
    // determine the path to this plugin
    const grafanaBootData = (window as any).grafanaBootData;
    const panels = grafanaBootData.settings.panels;
    const thisPanel = panels[this.pluginId];
    const thisPanelPath = thisPanel.baseUrl + '/';
    // add the relative path to the partial
    const optionsPath = thisPanelPath + 'partials/editor.options.html';
    this.addEditorTab('Options', optionsPath, 2);
    const datatableOptionsPath = thisPanelPath + 'partials/datatables.options.html';
    this.addEditorTab('Datatable Options', datatableOptionsPath, 3);
  }

  getPanelPath() {
    const grafanaBootData = (window as any).grafanaBootData;
    const panels = grafanaBootData.settings.panels;
    const thisPanel = panels[this.pluginId];
    //
    // For Grafana < 4.6, the system loader preprends publib to the url, add a .. to go back one level
    if (thisPanel.baseUrl.startsWith('publib')) {
      return '../' + thisPanel.baseUrl + '/';
    } else {
      // Grafana >= 4.6, webpack is used, need to fix the path for imports
      if (thisPanel.baseUrl.startsWith('public')) {
        return thisPanel.baseUrl.substring(7) + '/';
      } else {
        // this should never happen, but just in case, append a slash to the url
        return thisPanel.baseUrl + '/';
      }
    }
  }

  issueQueries(datasource: any) {
    this.pageIndex = 0;
    if (this.panel.transform === 'annotations') {
      this.setTimeQueryStart();
      return this.annotationsSrv
        .getAnnotations({
          dashboard: this.dashboard,
          panel: this.panel,
          range: this.range,
        })
        .then((annotations: any) => {
          return {
            data: annotations,
          };
        });
    }
    return super.issueQueries(datasource);
  }

  onDataError(err: any) {
    this.dataRaw = [];
    this.render();
  }

  onDataReceived(dataList: any) {
    this.dataRaw = dataList;
    this.pageIndex = 0;

    // automatically correct transform mode based on data
    if (this.dataRaw && this.dataRaw.length) {
      if (this.dataRaw[0].type === 'table') {
        this.panel.transform = 'table';
      } else {
        if (this.dataRaw[0].type === 'docs') {
          this.panel.transform = 'json';
        } else {
          if (this.panel.transform === 'table' || this.panel.transform === 'json') {
            this.panel.transform = 'timeseries_to_rows';
          }
        }
      }
    }
    this.render();
  }

  render() {
    this.table = transformDataToTable(this.dataRaw, this.panel);
    this.table.sort(this.panel.sort);
    this.panel.emptyData = this.table.rows.length === 0 || this.table.columns.length === 0;
    return super.render(this.table);
  }

  getPanelHeight() {
    // panel can have a fixed height set via "General" tab in panel editor
    let tmpPanelHeight = this.panel.height;
    if (typeof tmpPanelHeight === 'undefined' || tmpPanelHeight === '') {
      // grafana also supplies the height, try to use that if the panel does not have a height
      tmpPanelHeight = String(this.height);
      // v4 and earlier define this height, detect span for pre-v5
      if (typeof this.panel.span !== 'undefined') {
        // if there is no header, adjust height to use all space available
        let panelTitleOffset = 20;
        if (this.panel.title !== '') {
          panelTitleOffset = 42;
        }
        tmpPanelHeight = String(this.containerHeight - panelTitleOffset); // offset for header
      }
      if (typeof tmpPanelHeight === 'undefined') {
        // height still cannot be determined, get it from the row instead
        tmpPanelHeight = this.row.height;
        if (typeof tmpPanelHeight === 'undefined') {
          // last resort - default to 250px (this should never happen)
          tmpPanelHeight = '250';
        }
      }
    }
    // replace px
    tmpPanelHeight = tmpPanelHeight.replace('px', '');
    // convert to numeric value
    const actualHeight = parseInt(tmpPanelHeight, 10);
    return actualHeight;
  }

  getPanelHeightX() {
    // panel can have a fixed height set via "General" tab in panel editor
    let tmpPanelHeight = this.panel.height;
    if (typeof tmpPanelHeight === 'undefined' || tmpPanelHeight === '') {
      // grafana also supplies the height, try to use that if the panel does not have a height
      tmpPanelHeight = String(this.height);
      if (typeof tmpPanelHeight === 'undefined') {
        // height still cannot be determined, get it from the row instead
        tmpPanelHeight = this.row.height;
        if (typeof tmpPanelHeight === 'undefined') {
          // last resort - default to 250px (this should never happen)
          tmpPanelHeight = '250';
        }
      }
    }
    // replace px
    tmpPanelHeight = tmpPanelHeight.replace('px', '');
    // convert to numeric value
    const actualHeight = parseInt(tmpPanelHeight, 10);
    return actualHeight;
  }

  exportCsv() {
    const renderer = new DatatableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize);
    FileExport.exportTableDataToCsv(renderer.render_values());
  }

  link(scope: any, elem: any, attrs: any, ctrl: any) {
    let data: any[];
    const panel = ctrl.panel;
    //const formatters = [];
    const _this = this;

    /**
     * [renderPanel description]
     * @return {[type]} [description]
     */
    function renderPanel() {
      const renderer = new DatatableRenderer(panel, ctrl.table, ctrl.dashboard.isTimezoneUtc(), ctrl.$sanitize);
      renderer.render();
      _this.dataLoaded = true;
    }

    ctrl.panel.panelHeight = this.getPanelHeight();
    ctrl.events.on('render', (renderData: any) => {
      data = renderData || data;
      if (data) {
        renderPanel();
      }
      ctrl.renderingCompleted();
    });
  }

  // editor methods
  //
  // cell and row borders cannot both be set at the same time
  showCellBordersChanged() {
    if (this.panel.showCellBorders) {
      this.panel.showRowBorders = false;
    }
    this.render();
  }

  themeChanged() {
    //console.log(this.panel.datatableTheme);
    this.render();
  }

  transformChanged() {
    this.panel.columns = [];
    this.render();
  }
  removeColumn(column: any) {
    this.panel.columns = _.without(this.panel.columns, column);
    this.render();
  }

  getColumnOptions() {
    if (!this.dataRaw) {
      return this.$q.when([]);
    }
    const columns = this.transformers[this.panel.transform].getColumns(this.dataRaw);
    const segments = _.map(columns, c =>
      this.uiSegmentSrv.newSegment({
        value: c.text,
      })
    );
    return this.$q.when(segments);
  }

  addColumn() {
    const columns = transformers[this.panel.transform].getColumns(this.dataRaw);
    const column = _.find(columns, {
      text: this.addColumnSegment.value,
    });

    if (column) {
      this.panel.columns.push(column);
      this.render();
    }

    const plusButton = this.uiSegmentSrv.newPlusButton();
    this.addColumnSegment.html = plusButton.html;
    this.addColumnSegment.value = plusButton.value;
  }

  addColumnStyle() {
    const columnStyleDefaults = {
      unit: 'short',
      type: 'number',
      decimals: 2,
      colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
      colorMode: null,
      pattern: '/.*/',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      thresholds: [],
      mappingType: 1,
    };
    this.panel.styles.push(angular.copy(columnStyleDefaults));
  }
  removeColumnStyle(style: any) {
    this.panel.styles = _.without(this.panel.styles, style);
  }
  setUnitFormat(column: any, subItem: any) {
    column.unit = subItem.value;
    this.render();
  }
  invertColorOrder(index: any) {
    const ref = this.panel.styles[index].colors;
    const copy = ref[0];
    ref[0] = ref[2];
    ref[2] = copy;
    this.render();
  }

  addColumnSortingRule() {
    const defaultRule = {
      columnData: 0,
      sortMethod: 'desc',
    };
    // check if this column already exists
    this.panel.sortByColumns.push(angular.copy(defaultRule));
    this.columnSortChanged();
  }

  removeSortByColumn(column: any) {
    this.panel.sortByColumns = _.without(this.panel.sortByColumns, column);
    this.columnSortChanged();
  }

  columnSortChanged() {
    // take the values in sortByColumns and convert them into datatables format
    const data = [];
    if (this.panel.sortByColumns.length > 0) {
      for (let i = 0; i < this.panel.sortByColumns.length; i++) {
        // allow numbers and column names
        const columnData = this.panel.sortByColumns[i].columnData;
        let columnNumber = 0;
        try {
          columnNumber = parseInt(columnData, 10);
        } catch (e) {
          // check if empty
          if (columnData === '') {
            columnNumber = 0;
          }
          // find the matching column index
          for (let j = 0; j < this.panel.columns.length; j++) {
            if (this.panel.columns[j].text === columnData) {
              columnNumber = j;
              break;
            }
          }
        }
        const sortDirection = this.panel.sortByColumns[i].sortMethod;
        data.push([columnNumber, sortDirection]);
      }
    } else {
      // default to column 0, descending
      data.push([0, 'desc']);
    }
    this.panel.sortByColumnsData = data;
    this.render();
  }

  addColumnAlias() {
    const defaultAlias = {
      name: '',
      alias: '',
    };
    // check if this column already exists
    this.panel.columnAliases.push(angular.copy(defaultAlias));
    this.columnAliasChanged();
  }

  removeColumnAlias(column: any) {
    this.panel.columnAliases = _.without(this.panel.columnAliases, column);
    this.columnAliasChanged();
  }

  columnAliasChanged() {
    this.render();
  }

  addColumnWidthHint() {
    const defaultHint = {
      name: '',
      width: '80px',
    };
    // check if this column already exists
    this.panel.columnWidthHints.push(angular.copy(defaultHint));
    this.columnWidthHintsChanged();
  }
  removeColumnWidthHint(column: any) {
    this.panel.columnWidthHints = _.without(this.panel.columnWidthHints, column);
    this.columnWidthHintsChanged();
  }

  columnWidthHintsChanged() {
    this.render();
  }

  addValueMap(style: any) {
    if (!style.valueMaps) {
      style.valueMaps = [];
    }
    style.valueMaps.push({ value: '', text: '' });
    this.render();
  }

  removeValueMap(style: any, index: any) {
    style.valueMaps.splice(index, 1);
    this.render();
  }

  addRangeMap(style: any) {
    if (!style.rangeMaps) {
      style.rangeMaps = [];
    }
    style.rangeMaps.push({ from: '', to: '', text: '' });
    this.render();
  }

  removeRangeMap(style: any, index: any) {
    style.rangeMaps.splice(index, 1);
    this.render();
  }
}
