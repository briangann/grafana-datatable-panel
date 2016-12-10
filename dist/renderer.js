'use strict';

System.register(['jquery', 'app/core/utils/kbn', 'moment', './libs/datatables.net/js/jquery.dataTables.min.js'], function (_export, _context) {
  "use strict";

  var $, kbn, moment, DataTable, _typeof, _createClass, DatatableRenderer;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_jquery) {
      $ = _jquery.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_libsDatatablesNetJsJqueryDataTablesMinJs) {
      DataTable = _libsDatatablesNetJsJqueryDataTablesMinJs.default;
    }],
    execute: function () {
      _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

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

      _export('DatatableRenderer', DatatableRenderer = function () {
        function DatatableRenderer(panel, table, isUtc, sanitize) {
          _classCallCheck(this, DatatableRenderer);

          this.formatters = [];
          this.colorState = {};
          this.panel = panel;
          this.table = table;
          this.isUtc = isUtc;
          this.sanitize = sanitize;
        }

        /**
         * Given a value, return the color corresponding to the threshold set
         * @param  {[Float]} value [Value to be evaluated]
         * @param  {[Array]} style [Settings containing colors and thresholds]
         * @return {[String]}       [color]
         */


        _createClass(DatatableRenderer, [{
          key: 'getColorForValue',
          value: function getColorForValue(value, style) {
            if (!style.thresholds) {
              return null;
            }
            for (var i = style.thresholds.length; i > 0; i--) {
              if (value >= style.thresholds[i - 1]) {
                return style.colors[i];
              }
            }
            return _.first(style.colors);
          }
        }, {
          key: 'defaultCellFormatter',
          value: function defaultCellFormatter(v, style) {
            if (v === null || v === void 0 || v === undefined) {
              return '';
            }
            if (_.isArray(v)) {
              v = v.join(', ');
            }
            if (style && style.sanitize) {
              return this.sanitize(v);
            } else {
              return _.escape(v);
            }
          }
        }, {
          key: 'createColumnFormatter',
          value: function createColumnFormatter(style, column) {
            var _this2 = this;

            if (!style) {
              return this.defaultCellFormatter;
            }
            if (style.type === 'hidden') {
              return function (v) {
                return undefined;
              };
            }
            if (style.type === 'date') {
              return function (v) {
                if (v === undefined || v === null) {
                  return '-';
                }
                if (_.isArray(v)) {
                  v = v[0];
                }
                var date = moment(v);
                if (_this2.isUtc) {
                  date = date.utc();
                }
                return date.format(style.dateFormat);
              };
            }
            if (style.type === 'number') {
              var _ret = function () {
                var valueFormatter = kbn.valueFormats[column.unit || style.unit];
                return {
                  v: function v(_v) {
                    if (_v === null || _v === void 0) {
                      return '-';
                    }
                    if (_.isString(_v)) {
                      return _this2.defaultCellFormatter(_v, style);
                    }
                    if (style.colorMode) {
                      _this2.colorState[style.colorMode] = _this2.getColorForValue(_v, style);
                    }
                    return valueFormatter(_v, style.decimals, null);
                  }
                };
              }();

              if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }
            return function (value) {
              return _this2.defaultCellFormatter(value, style);
            };
          }
        }, {
          key: 'formatColumnValue',
          value: function formatColumnValue(colIndex, value) {
            if (this.formatters[colIndex]) {
              return this.formatters[colIndex](value);
            }

            for (var i = 0; i < this.panel.styles.length; i++) {
              var style = this.panel.styles[i];
              var column = this.table.columns[colIndex];
              var regex = kbn.stringToJsRegex(style.pattern);
              if (column.text.match(regex)) {
                this.formatters[colIndex] = this.createColumnFormatter(style, column);
                return this.formatters[colIndex](value);
              }
            }

            this.formatters[colIndex] = this.defaultCellFormatter;
            return this.formatters[colIndex](value);
          }
        }, {
          key: 'generateFormattedData',
          value: function generateFormattedData(rowData) {
            var formattedRowData = [];
            for (var y = 0; y < rowData.length; y++) {
              var row = this.table.rows[y];
              var cellData = [];
              for (var i = 0; i < this.table.columns.length; i++) {
                var value = this.formatColumnValue(i, row[i]);
                if (value === undefined) {
                  this.table.columns[i].hidden = true;
                }
                cellData.push(this.formatColumnValue(i, row[i]));
              }
              formattedRowData.push(cellData);
            }
            return formattedRowData;
          }
        }, {
          key: 'render',
          value: function render() {
            var _this3 = this;

            if (this.table.columns.length === 0) return;
            var columns = [];
            var columnDefs = [];
            var _this = this;

            var _loop = function _loop(i) {
              /* jshint loopfunc: true */
              columns.push({
                title: _this3.table.columns[i].text,
                type: _this3.table.columns[i].type
              });
              columnDefs.push({
                "targets": i,
                "createdCell": function createdCell(td, cellData, rowData, row, col) {
                  // hidden columns have null data
                  if (cellData === null) return;
                  // set the fontsize for the cell
                  $(td).css('font-size', _this.panel.fontSize);
                  // undefined types should have numerical data, any others are already formatted
                  if (_this.table.columns[i].type !== undefined) return;
                  // pass the celldata to threshold checker
                  var items = cellData.split(/(\s+)/);
                  // only color cell if the content is a number?
                  var bgColor = null;
                  var color = null;
                  // check if the content has a numeric value after the split
                  // color the cell as needed
                  if (!isNaN(items[0])) {
                    if (_this.colorState.cell) {
                      bgColor = _this.colorState.cell;
                      color = 'white';
                      $(td).css('color', color);
                      $(td).css('background-color', bgColor);
                    } else if (_this.colorState.value) {
                      color = _this.colorState.value;
                      $(td).css('color', color);
                    }
                  }
                  if (_this.colorState.row) {
                    bgColor = _this.colorState.row;
                    color = 'white';
                    // set the row using the parentNode
                    $(td.parentNode).children().css('color', color);
                    $(td.parentNode).children().css('background-color', bgColor);
                  }
                }
              });
            };

            for (var i = 0; i < this.table.columns.length; i++) {
              _loop(i);
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
            if (this.table.rows[0].length === 4) {
              if (this.table.rows[0][0] === undefined) {
                // detected empty annotations
                this.table.rows = [];
              }
            }
            // pass the formatted rows into the datatable
            var formattedData = this.generateFormattedData(this.table.rows);
            var newDT = $('#datatable-panel-table').DataTable({
              "lengthMenu": [[10, 25, 50, 75, 100, -1], [10, 25, 50, 75, 100, "All"]],
              paging: true,
              pagingType: this.panel.datatablePagingType,
              searching: this.panel.searchEnabled,
              info: this.panel.infoEnabled,
              lengthChange: this.panel.lengthChangeEnabled,
              data: formattedData,
              columns: columns,
              columnDefs: columnDefs,
              "search": {
                "regex": true
              }
            });

            // hide columns that are marked hidden
            for (var _i = 0; _i < this.table.columns.length; _i++) {
              if (this.table.columns[_i].hidden) {
                newDT.column(_i).visible(false);
              }
            }

            // set the page size
            if (this.panel.pageSize !== null) {
              //console.log("page size = " + this.panel.pageSize);
              newDT.page.len(this.panel.pageSize).draw();
            }
            // to use scrolling vs paging, use these settings
            // reference: http://www.jqueryscript.net/demo/DataTables-Jquery-Table-Plugin/examples/basic_init/scroll_y.html
            //  "scrollY":        "200px",
            //  "scrollCollapse": true,
            //  "paging":         false
            //console.log("Datatable Loaded!");
          }
        }]);

        return DatatableRenderer;
      }());

      _export('DatatableRenderer', DatatableRenderer);
    }
  };
});
//# sourceMappingURL=renderer.js.map
