'use strict';

System.register(['app/plugins/sdk', 'jquery', 'moment', 'app/core/utils/kbn', './libs/datatables.net/js/jquery.dataTables.min.js', './libs/datatables.net-dt/css/jquery.dataTables.min.css!', './css/datatable.css!', './css/panel.css!', 'app/core/utils/file_export', './transformers'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, $, moment, kbn, DataTable, FileExport, transformDataToTable, transformers, _createClass, _get, panelDefaults, DatatablePanelCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_libsDatatablesNetJsJqueryDataTablesMinJs) {
      DataTable = _libsDatatablesNetJsJqueryDataTablesMinJs.default;
    }, function (_libsDatatablesNetDtCssJqueryDataTablesMinCss) {}, function (_cssDatatableCss) {}, function (_cssPanelCss) {}, function (_appCoreUtilsFile_export) {
      FileExport = _appCoreUtilsFile_export;
    }, function (_transformers) {
      transformDataToTable = _transformers.transformDataToTable;
      transformers = _transformers.transformers;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _get = function get(object, property, receiver) {
        if (object === null) object = Function.prototype;
        var desc = Object.getOwnPropertyDescriptor(object, property);

        if (desc === undefined) {
          var parent = Object.getPrototypeOf(object);

          if (parent === null) {
            return undefined;
          } else {
            return get(parent, property, receiver);
          }
        } else if ("value" in desc) {
          return desc.value;
        } else {
          var getter = desc.get;

          if (getter === undefined) {
            return undefined;
          }

          return getter.call(receiver);
        }
      };

      panelDefaults = {
        targets: [{}],
        transform: 'timeseries_to_columns',
        pageSize: null,
        showHeader: true,
        styles: [{
          type: 'date',
          pattern: 'Time',
          dateFormat: 'YYYY-MM-DD HH:mm:ss'
        }, {
          unit: 'short',
          type: 'number',
          decimals: 2,
          colors: ["rgba(245, 54, 54, 0.9)", "rgba(237, 129, 40, 0.89)", "rgba(50, 172, 45, 0.97)"],
          colorMode: null,
          pattern: '/.*/',
          thresholds: []
        }],
        columns: [],
        scroll: true,
        fontSize: '100%',
        sort: {
          col: 0,
          desc: true
        }
      };

      _export('DatatablePanelCtrl', DatatablePanelCtrl = function (_MetricsPanelCtrl) {
        _inherits(DatatablePanelCtrl, _MetricsPanelCtrl);

        function DatatablePanelCtrl($scope, $injector, $http, $location, uiSegmentSrv, annotationsSrv) {
          _classCallCheck(this, DatatablePanelCtrl);

          var _this2 = _possibleConstructorReturn(this, (DatatablePanelCtrl.__proto__ || Object.getPrototypeOf(DatatablePanelCtrl)).call(this, $scope, $injector));

          _this2.pageIndex = 0;
          _this2.table = null;
          _this2.dataRaw = [];
          _this2.transformers = transformers;
          _this2.annotationsSrv = annotationsSrv;
          _this2.uiSegmentSrv = uiSegmentSrv;
          // editor

          _this2.addColumnSegment = uiSegmentSrv.newPlusButton();
          _this2.fontSizes = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];
          _this2.colorModes = [{
            text: 'Disabled',
            value: null
          }, {
            text: 'Cell',
            value: 'cell'
          }, {
            text: 'Value',
            value: 'value'
          }, {
            text: 'Row',
            value: 'row'
          }];
          _this2.columnTypes = [{
            text: 'Number',
            value: 'number'
          }, {
            text: 'String',
            value: 'string'
          }, {
            text: 'Date',
            value: 'date'
          }, {
            text: 'Hidden',
            value: 'hidden'
          }];
          _this2.unitFormats = kbn.getUnitFormats();
          _this2.dateFormats = [{
            text: 'YYYY-MM-DD HH:mm:ss',
            value: 'YYYY-MM-DD HH:mm:ss'
          }, {
            text: 'MM/DD/YY h:mm:ss a',
            value: 'MM/DD/YY h:mm:ss a'
          }, {
            text: 'MMMM D, YYYY LT',
            value: 'MMMM D, YYYY LT'
          }];
          // this is used from bs-typeahead and needs to be instance bound
          _this2.getColumnNames = function () {
            if (!_this2.panelCtrl.table) {
              return [];
            }
            return _.map(_this2.panelCtrl.table.columns, function (col) {
              return col.text;
            });
          };

          if (_this2.panel.styles === void 0) {
            _this2.panel.styles = _this2.panel.columns;
            _this2.panel.columns = _this2.panel.fields;
            delete _this2.panel.columns;
            delete _this2.panel.fields;
          }
          _.defaults(_this2.panel, panelDefaults);

          _this2.dataLoaded = true;
          _this2.http = $http;

          _this2.events.on('data-received', _this2.onDataReceived.bind(_this2));
          _this2.events.on('data-error', _this2.onDataError.bind(_this2));
          _this2.events.on('data-snapshot-load', _this2.onDataReceived.bind(_this2));
          _this2.events.on('init-edit-mode', _this2.onInitEditMode.bind(_this2));
          _this2.events.on('init-panel-actions', _this2.onInitPanelActions.bind(_this2));

          return _this2;
        }

        _createClass(DatatablePanelCtrl, [{
          key: 'onInitPanelActions',
          value: function onInitPanelActions(actions) {
            actions.push({
              text: 'Export CSV',
              click: 'ctrl.exportCsv()'
            });
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            // determine the path to this plugin
            var panels = grafanaBootData.settings.panels;
            var thisPanel = panels[this.pluginId];
            var thisPanelPath = thisPanel.baseUrl + '/';
            // add the relative path to the partial
            var optionsPath = thisPanelPath + 'partials/editor.options.html';
            this.addEditorTab('Options', optionsPath, 2);
          }
        }, {
          key: 'issueQueries',
          value: function issueQueries(datasource) {
            this.pageIndex = 0;
            if (this.panel.transform === 'annotations') {
              this.setTimeQueryStart();
              return this.annotationsSrv.getAnnotations({
                dashboard: this.dashboard,
                panel: this.panel,
                range: this.range
              }).then(function (annotations) {
                return {
                  data: annotations
                };
              });
            }
            return _get(DatatablePanelCtrl.prototype.__proto__ || Object.getPrototypeOf(DatatablePanelCtrl.prototype), 'issueQueries', this).call(this, datasource);
          }
        }, {
          key: 'onDataError',
          value: function onDataError(err) {
            this.dataRaw = [];
            this.render();
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
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
        }, {
          key: 'render',
          value: function render() {
            this.table = transformDataToTable(this.dataRaw, this.panel);
            this.table.sort(this.panel.sort);
            return _get(DatatablePanelCtrl.prototype.__proto__ || Object.getPrototypeOf(DatatablePanelCtrl.prototype), 'render', this).call(this, this.table);
          }
        }, {
          key: 'exportCsv',
          value: function exportCsv() {
            var renderer = new TableRenderer(this.panel, this.table, this.dashboard.isTimezoneUtc(), this.$sanitize);
            FileExport.exportTableDataToCsv(renderer.render_values());
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
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
              for (var i = 0; i < _this.table.columns.length; i++) {
                /* jshint loopfunc: true */
                columns.push({
                  title: _this.table.columns[i].text,
                  type: _this.table.columns[i].type
                });
                if (_this.table.columns[i].type !== null) {
                  switch (_this.table.columns[i].type) {
                    case "date":
                      columnDefs.push({
                        "type": "date",
                        "targets": i,
                        "render": function render(data, type, full, meta) {
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
                      });
                      break;
                    default:
                      columnDefs.push({ null: null });
                      break;
                  }
                } else {
                  columnDefs.push({ null: null });
                }
              }

              try {
                var should_destroy = false;
                if ($.fn.dataTable.isDataTable('#datatable-panel-table')) {
                  should_destroy = true;
                }
                if (should_destroy) {
                  var aDT = $('#datatable-panel-table').DataTable();
                  aDT.destroy();
                  $('#datatable-panel-table').empty();
                }
              } catch (err) {
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

            ctrl.events.on('render', function (renderData) {
              data = renderData || data;
              if (data) {
                renderPanel();
              }
              ctrl.renderingCompleted();
            });
          }
        }, {
          key: 'transformChanged',
          value: function transformChanged() {
            this.panel.columns = [];
            this.render();
          }
        }, {
          key: 'removeColumn',
          value: function removeColumn(column) {
            this.panel.columns = _.without(this.panel.columns, column);
            this.panelCtrl.render();
          }
        }, {
          key: 'getColumnOptions',
          value: function getColumnOptions() {
            var _this3 = this;

            if (!this.panelCtrl.dataRaw) {
              return this.$q.when([]);
            }
            var columns = this.transformers[this.panel.transform].getColumns(this.panelCtrl.dataRaw);
            var segments = _.map(columns, function (c) {
              return _this3.uiSegmentSrv.newSegment({
                value: c.text
              });
            });
            return this.$q.when(segments);
          }
        }, {
          key: 'addColumn',
          value: function addColumn() {
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
        }, {
          key: 'removeColumnStyle',
          value: function removeColumnStyle(style) {
            this.panel.styles = _.without(this.panel.styles, style);
          }
        }, {
          key: 'setUnitFormat',
          value: function setUnitFormat(column, subItem) {
            column.unit = subItem.value;
            this.panelCtrl.render();
          }
        }, {
          key: 'invertColorOrder',
          value: function invertColorOrder(index) {
            var ref = this.panel.styles[index].colors;
            var copy = ref[0];
            ref[0] = ref[2];
            ref[2] = copy;
            this.panelCtrl.render();
          }
        }]);

        return DatatablePanelCtrl;
      }(MetricsPanelCtrl));

      _export('DatatablePanelCtrl', DatatablePanelCtrl);

      DatatablePanelCtrl.templateUrl = 'partials/template.html';
    }
  };
});
//# sourceMappingURL=ctrl.js.map
