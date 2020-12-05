import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import _ from 'lodash';
import angular from 'angular';
import kbn from 'grafana/app/core/utils/kbn';
import * as FileExport from './file_export';
import 'datatables.net/js/jquery.dataTables.min';
import { panelDefaults, dateFormats, columnTypes, columnStyleDefaults, colorModes, fontSizes } from './Defaults';
import { transformDataToTable, transformers } from './transformers';
import { DatatableRenderer } from './DatatableRenderer';
import { PanelEvents } from '@grafana/data';

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
  $q: any,
  http: any;
  getColumnNames: () => any[];

  /** @ngInject */
  constructor(
    $scope: any,
    $injector: any,
    $http: any,
    $location: any,
    $q: any,
    uiSegmentSrv: any,
    annotationsSrv: any,
    private $sanitize: any,
    timeSrv: any
  ) {
    super($scope, $injector);
    this.pageIndex = 0;
    this.table = null;
    this.dataRaw = [];
    this.$q = $q;
    this.transformers = transformers;
    this.annotationsSrv = annotationsSrv;
    this.uiSegmentSrv = uiSegmentSrv;
    // editor
    this.addColumnSegment = uiSegmentSrv.newPlusButton();
    this.mappingTypes = [
      { text: 'Value to text', value: 1 },
      { text: 'Range to text', value: 2 },
    ];
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
    this.fontSizes = fontSizes;
    this.colorModes = colorModes;
    this.columnTypes = columnTypes;
    this.unitFormats = kbn.getUnitFormats();
    this.dateFormats = dateFormats;
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
    this.dataLoaded = true;
    this.http = $http;
    // v6 compat
    if (typeof PanelEvents === 'undefined') {
      this.events.on('data-received', this.onDataReceived.bind(this));
      this.events.on('data-error', this.onDataError.bind(this));
      this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
      this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
      this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));
    } else {
      // v7+ compat
      this.events.on(PanelEvents.dataReceived, this.onDataReceived.bind(this));
      this.events.on(PanelEvents.dataError, this.onDataError.bind(this));
      this.events.on(PanelEvents.dataSnapshotLoad, this.onDataReceived.bind(this));
      this.events.on(PanelEvents.editModeInitialized, this.onInitEditMode.bind(this));
      this.events.on(PanelEvents.initPanelActions, this.onInitPanelActions.bind(this));
    }
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
    const thisPanelPath = 'public/plugins/' + this.panel.type + '/';
    // add the relative path to the partial
    const optionsPath = thisPanelPath + 'partials/editor.options.html';
    this.addEditorTab('Options', optionsPath, 2);
    const datatableOptionsPath = thisPanelPath + 'partials/datatables.options.html';
    this.addEditorTab('Datatable Options', datatableOptionsPath, 3);
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

  changeRowNumbersEnabled() {
    this.panel.sortByColumnsData.map((sortData: any) => [
      this.panel.rowNumbersEnabled ? sortData[0]++ : sortData[0]--,
      sortData[1],
    ]);
    this.render();
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

  exportCsv() {
    let isInUTC = false;
    if (this.dashboard && this.dashboard.hasOwnProperty('isTimezoneUtc')) {
      isInUTC = this.dashboard.isTimezoneUtc();
    }
    const renderer = new DatatableRenderer(this.panel, this.table, isInUTC, this.$sanitize, this.timeSrv);
    FileExport.exportTableDataToCsv(renderer.render_values());
  }

  link(scope: any, elem: any, attrs: any, ctrl: any) {
    let data: any[];
    const panel = ctrl.panel;
    const _this = this;

    /**
     * [renderPanel description]
     * @return {[type]} [description]
     */
    function renderPanel() {
      // v7 has removed this
      let isInUTC = false;
      if (ctrl.dashboard && ctrl.dashboard.hasOwnProperty('isTimezoneUtc')) {
        isInUTC = ctrl.dashboard.isTimezoneUtc();
      }
      const renderer = new DatatableRenderer(panel, ctrl.table, isInUTC, ctrl.$sanitize, _this.timeSrv);
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
        columnNumber = parseInt(columnData, 10);
        if (Number.isNaN(columnNumber)) {
          columnNumber = 0;
          // find the matching column index
          for (let j = 0; j < this.table.columns.length; j++) {
            if (this.table.columns[j].text === columnData) {
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
    if (this.panel.rowNumbersEnabled) {
      data.map((sortData: any) => [sortData[0]++, sortData[1]]);
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
