import { MetricsPanelCtrl } from 'app/plugins/sdk';
import $ from 'jquery';
import angular from 'angular';
import kbn from 'app/core/utils/kbn';

import * as FileExport from 'app/core/utils/file_export';
import DataTable from './libs/datatables.net/js/jquery.dataTables.min.js';

// this is needed for basic datatables.net theme
import './libs/datatables.net-dt/css/jquery.dataTables.min.css!';

// See this for styling https://datatables.net/manual/styling/theme-creator

/*
// These three are needed for bootstrap theme
import './libs/datatables.net-bs/js/dataTables.bootstrap.js';
// this distributed css modifies the entire page, use the prefixed version of it instead
//import './libs/bootstrap/dist/css/bootstrap.min.css!';
import './libs/bootstrap/dist/css/prefixed-bootstrap.min.css!';
import './libs/datatables.net-bs/css/dataTables.bootstrap.min.css!';
*/


/*
// this distributed css modifies the entire page, use the prefixed version of it instead
//import './libs/foundation/css/foundation.min.css!';
import './libs/foundation/css/prefixed-foundation.min.css!';
import './libs/datatables.net-zf/js/dataTables.foundation.js';
import './libs/datatables.net-zf/css/dataTables.foundation.min.css!';
*/

/*
  JQuery UI ThemeRoller
import './libs/datatables.net-jqui/js/dataTables.jqueryui.js';
import './libs/datatables.net-jqui/css/dataTables.jqueryui.min.css!';
*/

// These are "preview themes"
//import './css/dataTables.bootstrap4.min.css!';
//import './css/dataTables.material.min.css!';
//import './css/dataTables.semanticui.min.css!';
//import './css/dataTables.uikit.min.css!';

//import './css/datatable.css!';
import './css/panel.css!';
// themes attempt to modify the entire page, this "contains" the styling to the table only
import './css/datatables-wrapper.css!';
import './css/datatable.css!';

import {
  transformDataToTable,
  transformers
} from './transformers';

import { DatatableRenderer } from './renderer';

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
      colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
      colorMode: null,
      pattern: '/.*/',
      thresholds: [],
      }
    ],
  columns: [],
  scroll: false,
  scrollHeight: 'default',
  fontSize: '100%',
  sort: {
    col: 0,
    desc: true
  },
  datatableTheme: 'basic_theme',
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
      value: 'simple'
    },
    {
      text: "'Previous' and 'Next' buttons, plus page numbers",
      value: 'simple_numbers'
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons",
      value: 'full'
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers",
      value: 'full_numbers'
    },
    {
      text: "'First' and 'Last' buttons, plus page numbers",
      value: 'first_last_numbers'
    }
  ],
  themes: [
    {
      value: 'basic_theme',
      text: 'Basic',
      disabled: false,
    },
    {
      value: 'bootstrap3_theme',
      text: 'Bootstrap 3',
      disabled: true,
    },
    {
      value: 'bootstrap4_theme',
      text: 'Bootstrap 4',
      disabled: true,
    },
    {
      value: 'foundation_theme',
      text: 'Foundation',
      disabled: true,
    },
    {
      value: 'semantic_ui_theme',
      text: 'Semantic UI',
      disabled: true,
    },
    {
      value: 'themeroller_theme',
      text: 'ThemeRoller',
      disabled: true,
    },
    {
      value: 'material_design_theme',
      text: 'Material Design',
      disabled: true,
    },
    {
      value: 'uikit_theme',
      text: 'UIKit',
      disabled: true,
    }
  ]

};

export class DatatablePanelCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $http, $location, uiSegmentSrv, annotationsSrv) {
    super($scope, $injector);
    this.pageIndex = 0;
    this.table = null;
    this.dataRaw = [];
    this.transformers = transformers;
    this.annotationsSrv = annotationsSrv;
    this.uiSegmentSrv = uiSegmentSrv;
    // editor

    this.addColumnSegment = uiSegmentSrv.newPlusButton();
    this.fontSizes = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];
    this.colorModes = [
      {
        text: 'Disabled',
        value: null
      },
      {
        text: 'Cell',
        value: 'cell'
      },
      {
        text: 'Value',
        value: 'value'
      },
      {
        text: 'Row',
        value: 'row'
      },
      {
        text: 'Row Column',
        value: 'rowcolumn'
      },
    ];
    this.columnTypes = [
      {
        text: 'Number',
        value: 'number'
      },
      {
        text: 'String',
        value: 'string'
      },
      {
        text: 'Date',
        value: 'date'
      },
      {
        text: 'Hidden',
        value: 'hidden'
      }
    ];
    this.unitFormats = kbn.getUnitFormats();
    this.dateFormats = [
      {
        text: 'YYYY-MM-DD HH:mm:ss',
        value: 'YYYY-MM-DD HH:mm:ss'
      },
      {
        text: 'MM/DD/YY h:mm:ss a',
        value: 'MM/DD/YY h:mm:ss a'
      },
      {
        text: 'MMMM D, YYYY LT',
        value: 'MMMM D, YYYY LT'
      },
    ];
    // this is used from bs-typeahead and needs to be instance bound
    this.getColumnNames = () => {
      if (!this.table) {
        return [];
      }
      return _.map(this.table.columns, function(col) {
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

    //this.datatableTheme = this.panel.themes[0];

    this.dataLoaded = true;
    this.http = $http;

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('init-panel-actions', this.onInitPanelActions.bind(this));

  }

  onInitPanelActions(actions) {
      actions.push({
        text: 'Export CSV',
        click: 'ctrl.exportCsv()'
      });
    }
    // setup the editor
  onInitEditMode() {
    // determine the path to this plugin
    var panels = grafanaBootData.settings.panels;
    var thisPanel = panels[this.pluginId];
    var thisPanelPath = thisPanel.baseUrl + '/';
    // add the relative path to the partial
    var optionsPath = thisPanelPath + 'partials/editor.options.html';
    this.addEditorTab('Options', optionsPath, 2);
    var datatableOptionsPath = thisPanelPath + 'partials/datatables.options.html';
    this.addEditorTab('Datatable Options', datatableOptionsPath, 3);
  }

  issueQueries(datasource) {
    this.pageIndex = 0;
    if (this.panel.transform === 'annotations') {
      this.setTimeQueryStart();
      return this.annotationsSrv.getAnnotations({
          dashboard: this.dashboard,
          panel: this.panel,
          range: this.range
        })
        .then(annotations => {
          return {
            data: annotations
          };
        });
    }
    return super.issueQueries(datasource);
  }

  onDataError(err) {
    this.dataRaw = [];
    this.render();
  }

  onDataReceived(dataList) {
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
    return super.render(this.table);
  }

  getPanelHeight() {
    // panel can have a fixed height via options
    var tmpPanelHeight = this.$scope.ctrl.panel.height;
    // if that is blank, try to get it from our row
    if (typeof tmpPanelHeight === 'undefined') {
      // get from the row instead
      tmpPanelHeight = this.row.height;
      // default to 250px if that was undefined also
      if (typeof tmpPanelHeight === 'undefined') {
        tmpPanelHeight = "250px";
      }
    }
    // convert to numeric value
    tmpPanelHeight = tmpPanelHeight.replace("px","");
    var actualHeight = parseInt(tmpPanelHeight);
    // grafana minimum height for a panel is 250px
    if (actualHeight < 250) {
      actualHeight = 250;
    }
    return actualHeight;
  }


  exportCsv() {
    var renderer = new DatatableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize);
    FileExport.exportTableDataToCsv(renderer.render_values());
  }

  link(scope, elem, attrs, ctrl) {
    var data;
    var panel = ctrl.panel;
    var formatters = [];
    var _this = this;

    /**
     * [renderPanel description]
     * @return {[type]} [description]
     */
    function renderPanel() {
      var renderer = new DatatableRenderer(panel, ctrl.table, ctrl.dashboard.isTimezoneUtc(), ctrl.$sanitize);
      renderer.render();
      _this.dataLoaded = true;
    }

    ctrl.panel.panelHeight = this.getPanelHeight();
    ctrl.events.on('render', function(renderData) {
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
  removeColumn(column) {
    this.panel.columns = _.without(this.panel.columns, column);
    this.render();
  }

  getColumnOptions() {
    if (!this.dataRaw) {
      return this.$q.when([]);
    }
    var columns = this.transformers[this.panel.transform].getColumns(this.dataRaw);
    var segments = _.map(columns, (c) => this.uiSegmentSrv.newSegment({
      value: c.text
    }));
    return this.$q.when(segments);
  }

  addColumn() {
    var columns = transformers[this.panel.transform].getColumns(this.dataRaw);
    var column = _.find(columns, {
      text: this.addColumnSegment.value
    });

    if (column) {
      this.panel.columns.push(column);
      this.render();
    }

    var plusButton = this.uiSegmentSrv.newPlusButton();
    this.addColumnSegment.html = plusButton.html;
    this.addColumnSegment.value = plusButton.value;
  }

  addColumnStyle() {
      var columnStyleDefaults = {
        unit: 'short',
        type: 'number',
        decimals: 2,
        colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
        colorMode: null,
        pattern: '/.*/',
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        thresholds: [],
      };
      this.panel.styles.push(angular.copy(columnStyleDefaults));
  }
  removeColumnStyle(style) {
    this.panel.styles = _.without(this.panel.styles, style);
  }
  setUnitFormat(column, subItem) {
    column.unit = subItem.value;
    this.render();
  }
  invertColorOrder(index) {
    var ref = this.panel.styles[index].colors;
    var copy = ref[0];
    ref[0] = ref[2];
    ref[2] = copy;
    this.render();
  }
}
DatatablePanelCtrl.templateUrl = 'partials/template.html';
