import {
  MetricsPanelCtrl
} from 'app/plugins/sdk';
import $ from 'jquery';
import moment from 'moment';
import kbn from 'app/core/utils/kbn';

import DataTable from './libs/datatables.net/js/jquery.dataTables.min.js';
import './libs/datatables.net-dt/css/jquery.dataTables.min.css!';
// See this for styling https://datatables.net/manual/styling/theme-creator
import './css/datatable.css!';
import './css/panel.css!';
import * as FileExport from 'app/core/utils/file_export';

import {
  transformDataToTable,
  transformers
} from './transformers';

const panelDefaults = {
  targets: [{}],
  transform: 'timeseries_to_columns',
  pageSize: null,
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
  scroll: true,
  fontSize: '100%',
  sort: {
    col: 0,
    desc: true
  },
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
      if (!this.panelCtrl.table) {
        return [];
      }
      return _.map(this.panelCtrl.table.columns, function(col) {
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

  exportCsv() {
    var renderer = new TableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize);
    FileExport.exportTableDataToCsv(renderer.render_values());
  }

  link(scope, elem, attrs, ctrl) {
    var data;
    var panel = ctrl.panel;
    var formatters = [];
    var _this = this;

    function renderPanel() {

      if (_this.table.columns.length === 0) return;
      // multiple types here
      // timeseries_to_rows (column 0 = timestamp)
      // timeseries_to_columns
      // timeseries_aggregations - column 0 is the metric name (series name, not a timestamp)
      // annotations - specific headers for this
      // table
      // json (raw)
      // columns[x].type === "date" then set columndefs to parse the date, otherwise leave it as default
      // convert table.columns[N].text to columns formatted to datatables.net format
      var columns = [];
      var columnDefs = [];
      for (let i = 0; i < _this.table.columns.length; i++) {
        /* jshint loopfunc: true */
        columns.push({
          title: _this.table.columns[i].text,
          type: _this.table.columns[i].type
        });
        if (_this.table.columns[i].type !== null) {
          switch (_this.table.columns[i].type) {
            case "date":
              columnDefs.push(
                {
                  "type": "date",
                  "targets": i,
                  "render": function(data, type, full, meta) {
                    var response = data;
                    try {
                      //console.log("Data is : " + data);
                      if (data === undefined) {
                        return null;
                      }
                      response = moment.utc(data, "x").toISOString().replace(/T/, ' ').replace(/Z/, '');
                    } catch (err) {
                      return response;
                    }
                    return response;
                  }
                }
              );
              break;
            default:
              columnDefs.push({null});
              break;
          }
        } else {
          columnDefs.push({null});
        }
      }

      try {
        var should_destroy = false;
        if ( $.fn.dataTable.isDataTable( '#datatable-panel-table')) {
          should_destroy = true;
        }
        if (should_destroy) {
          var aDT = $('#datatable-panel-table').DataTable();
          aDT.destroy();
          $('#datatable-panel-table').empty();
        }
      }
      catch(err) {
        console.log("Exception: " + err.message);
      }
      // sanity check
      // annotations come back as 4 items in an array per row. If the first row content is undefined, then modify to empty
      // since datatables.net throws errors
      if (_this.table.rows[0].length === 4) {
        if (_this.table.rows[0][0] === undefined) {
          // detected empty annotations
          _this.table.rows = [];
        }
      }
      $('#datatable-panel-table').DataTable({
        data: _this.table.rows,
        columnDefs: columnDefs,
        columns: columns
      });

      _this.dataLoaded = true;
      console.log("Datatable Loaded!");
    }

    ctrl.events.on('render', function(renderData) {
      data = renderData || data;
      if (data) {
        renderPanel();
      }
      ctrl.renderingCompleted();
    });
  }

  // editor methods
  transformChanged() {
    this.panel.columns = [];
    this.render();
  }
  removeColumn(column) {
    this.panel.columns = _.without(this.panel.columns, column);
    this.panelCtrl.render();
  }
  getColumnOptions() {
    if (!this.panelCtrl.dataRaw) {
      return this.$q.when([]);
    }
    var columns = this.transformers[this.panel.transform].getColumns(this.panelCtrl.dataRaw);
    var segments = _.map(columns, (c) => this.uiSegmentSrv.newSegment({
      value: c.text
    }));
    return this.$q.when(segments);
  }

  addColumn() {
    var columns = transformers[this.panel.transform].getColumns(this.panelCtrl.dataRaw);
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

  removeColumnStyle(style) {
    this.panel.styles = _.without(this.panel.styles, style);
  }
  setUnitFormat(column, subItem) {
    column.unit = subItem.value;
    this.panelCtrl.render();
  }
  invertColorOrder(index) {
    var ref = this.panel.styles[index].colors;
    var copy = ref[0];
    ref[0] = ref[2];
    ref[2] = copy;
    this.panelCtrl.render();
  }
}
DatatablePanelCtrl.templateUrl = 'partials/template.html';
