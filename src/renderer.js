import $ from 'jquery';
import kbn from 'app/core/utils/kbn';
import DataTable from './libs/datatables.net/js/jquery.dataTables.min.js';

export class DatatableRenderer {
  constructor(panel, table, isUtc, sanitize) {
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
  getColorForValue(value, style) {
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

  /**
   * [defaultCellFormatter description]
   * @param  {[type]} v     [description]
   * @param  {[type]} style [description]
   * @return {[type]}       [description]
   */
  defaultCellFormatter(v, style) {
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

  /**
   * [createColumnFormatter description]
   * @param  {[type]} style  [description]
   * @param  {[type]} column [description]
   * @return {[type]}        [description]
   */
  createColumnFormatter(style, column) {
    if (!style) {
      return this.defaultCellFormatter;
    }

    if (style.type === 'hidden') {
      return v => {
        return undefined;
      };
    }

    if (style.type === 'date') {
      return v => {
        if (v === undefined || v === null) {
          return '-';
        }

        if (_.isArray(v)) {
          v = v[0];
        }
        var date = moment(v);
        if (this.isUtc) {
          date = date.utc();
        }
        return date.format(style.dateFormat);
      };
    }

    if (style.type === 'number') {
      let valueFormatter = kbn.valueFormats[column.unit || style.unit];

      return v => {
        if (v === null || v === void 0) {
          return '-';
        }

        if (_.isString(v)) {
          return this.defaultCellFormatter(v, style);
        }

        if (style.colorMode) {
          this.colorState[style.colorMode] = this.getColorForValue(v, style);
        }

        return valueFormatter(v, style.decimals, null);
      };
    }

    return (value) => {
      return this.defaultCellFormatter(value, style);
    };
  }

  /**
   * [formatColumnValue description]
   * @param  {[type]} colIndex [description]
   * @param  {[type]} value    [description]
   * @return {[type]}          [description]
   */
  formatColumnValue(colIndex, value) {
    if (this.formatters[colIndex]) {
      return this.formatters[colIndex](value);
    }

    for (let i = 0; i < this.panel.styles.length; i++) {
      let style = this.panel.styles[i];
      let column = this.table.columns[colIndex];
      var regex = kbn.stringToJsRegex(style.pattern);
      if (column.text.match(regex)) {
        this.formatters[colIndex] = this.createColumnFormatter(style, column);
        return this.formatters[colIndex](value);
      }
    }

    this.formatters[colIndex] = this.defaultCellFormatter;
    return this.formatters[colIndex](value);
  }

  /**
   * [renderCell description]
   * @param  {[type]}  columnIndex          [description]
   * @param  {[type]}  value                [description]
   * @param  {Boolean} [addWidthHack=false] [description]
   * @return {[type]}                       [description]
   */
  renderCell(columnIndex, value, addWidthHack = false) {
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

  /**
   * [render description]
   * @param  {[type]} page [description]
   * @return {[type]}      [description]
   */
  render(page) {
    let pageSize = this.panel.pageSize || 100;
    let startPos = page * pageSize;
    let endPos = Math.min(startPos + pageSize, this.table.rows.length);
    var html = "";

    for (var y = startPos; y < endPos; y++) {
      let row = this.table.rows[y];
      let cellHtml = '';
      let rowStyle = '';
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

  /**
   * [render_values description]
   * @return {[type]} [description]
   */
  render_values() {
    let rows = [];

    for (var y = 0; y < this.table.rows.length; y++) {
      let row = this.table.rows[y];
      let new_row = [];
      for (var i = 0; i < this.table.columns.length; i++) {
        new_row.push(this.formatColumnValue(i, row[i]));
      }
      rows.push(new_row);
    }
    return {
      columns: this.table.columns,
      rows: rows,
    };
  }
}
