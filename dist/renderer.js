'use strict';

System.register(['jquery', 'app/core/utils/kbn', './libs/datatables.net/js/jquery.dataTables.min.js'], function (_export, _context) {
  "use strict";

  var $, kbn, DataTable, _typeof, _createClass, DatatableRenderer;

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
            var _this = this;

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
                if (_this.isUtc) {
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
                      return _this.defaultCellFormatter(_v, style);
                    }

                    if (style.colorMode) {
                      _this.colorState[style.colorMode] = _this.getColorForValue(_v, style);
                    }

                    return valueFormatter(_v, style.decimals, null);
                  }
                };
              }();

              if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }

            return function (value) {
              return _this.defaultCellFormatter(value, style);
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
          key: 'renderCell',
          value: function renderCell(columnIndex, value) {
            var addWidthHack = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            value = this.formatColumnValue(columnIndex, value);
            var style = '';
            if (this.colorState.cell) {
              style = ' style="background-color:' + this.colorState.cell + ';color: white"';
              this.colorState.cell = null;
            } else if (this.colorState.value) {
              style = ' style="color:' + this.colorState.value + '"';
              this.colorState.value = null;
            }

            // because of the fixed table headers css only solution
            // there is an issue if header cell is wider the cell
            // this hack adds header content to cell (not visible)
            var widthHack = '';
            if (addWidthHack) {
              widthHack = '<div class="table-panel-width-hack">' + this.table.columns[columnIndex].text + '</div>';
            }

            if (value === undefined) {
              style = ' style="display:none;"';
              this.table.columns[columnIndex].hidden = true;
            } else {
              this.table.columns[columnIndex].hidden = false;
            }

            return '<td' + style + '>' + value + widthHack + '</td>';
          }
        }, {
          key: 'render',
          value: function render(page) {
            var pageSize = this.panel.pageSize || 100;
            var startPos = page * pageSize;
            var endPos = Math.min(startPos + pageSize, this.table.rows.length);
            var html = "";

            for (var y = startPos; y < endPos; y++) {
              var row = this.table.rows[y];
              var cellHtml = '';
              var rowStyle = '';
              for (var i = 0; i < this.table.columns.length; i++) {
                cellHtml += this.renderCell(i, row[i], y === startPos);
              }
              if (this.colorState.row) {
                rowStyle = ' style="background-color:' + this.colorState.row + ';color: white"';
                this.colorState.row = null;
              }
              html += '<tr ' + rowStyle + '>' + cellHtml + '</tr>';
            }
            return html;
          }
        }, {
          key: 'render_values',
          value: function render_values() {
            var rows = [];

            for (var y = 0; y < this.table.rows.length; y++) {
              var row = this.table.rows[y];
              var new_row = [];
              for (var i = 0; i < this.table.columns.length; i++) {
                new_row.push(this.formatColumnValue(i, row[i]));
              }
              rows.push(new_row);
            }
            return {
              columns: this.table.columns,
              rows: rows
            };
          }
        }]);

        return DatatableRenderer;
      }());

      _export('DatatableRenderer', DatatableRenderer);
    }
  };
});
//# sourceMappingURL=renderer.js.map
