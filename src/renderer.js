import $ from 'jquery';
import kbn from 'app/core/utils/kbn';
import moment from 'moment';
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
  NOTrender(page) {
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
   * [renderCell description]
   * @param  {[type]}  columnIndex          [description]
   * @param  {[type]}  value                [description]
   * @param  {Boolean} [addWidthHack=false] [description]
   * @return {[type]}                       [description]
   */
  getCell(columnIndex, value) {
    //debugger;
    value = this.formatColumnValue(columnIndex, value);
    var style = '';
    var bgColor = null;
    var color = null;
    var hidden = false;
    if (this.colorState.cell) {
      bgColor = this.colorState.cell;
      color = 'white';
      this.colorState.cell = null;
    } else if (this.colorState.value) {
      color = this.colorState.value;
      this.colorState.value = null;
    }

    if (value === undefined) {
      hidden = true;
      this.table.columns[columnIndex].hidden = true;
    } else {
      this.table.columns[columnIndex].hidden = false;
    }
    return {
      backgroundColor : bgColor,
      color: color,
      hidden: hidden,
      value : value
    };
    //return '<td' + style + '>' + value + '</td>';
  }

  generateFormattedData(rowData) {
    let formattedRowData = [];
    for (var y = 0; y < rowData.length; y++) {
      let row = this.table.rows[y];

      let cellData = [];
      for (var i = 0; i < this.table.columns.length; i++) {
        cellData.push(this.formatColumnValue(i, row[i]));
      }

      //let rowContent = [];
      //for (let x = 0; x < cellData.length; x++) {
      //  rowContent.push(cellData[x]);
      //}
      formattedRowData.push(cellData);
    }
    return formattedRowData;
  }
  populateTable(dt) {
    for (var y = 0; y < this.table.rows.length; y++) {
      let row = this.table.rows[y];
      let cellHtml = '';
      let rowStyle = '';

      let cellStyle = '';
      let cellText = '';
      let cellData = [];
      for (var i = 0; i < this.table.columns.length; i++) {
        cellData.push(this.getCell(i, row[i]));
      }
      let rowData = {
        backGroundColor: null,
        color: null
      };
      if (this.colorState.row) {
        rowData.backGroundColor = this.colorState.row;
        rowData.color = 'white';
        this.colorState.row = null;
        //console.log('<tr ' + rowStyle + '>' + cellHtml + '</tr>');
      }
      // now append to the datatable
      //console.log(cellData, rowData);
      // collapse cellData values into a row
      let rowContent = [];
      for (let x = 0; x < cellData.length; x++) {
        rowContent.push(cellData[x].value);
      }
      //console.log(rowContent);
      var rowNode = dt
        .row.add( rowContent )
        .draw()
        .node();

      if (rowData.backGroundColor) {
        // have to add style to children to color the whole row
        $( rowNode )
          .children()
          .css( 'background-color', rowData.backGroundColor )
          .css( 'color', rowData.color );
      }
      //$( rowNode )
      //  .css( 'color', 'red' )
      //  .animate( { color: 'black' } );
      //console.log('<tr ' + rowStyle + '>' + cellHtml + '</tr>');
    }
  }
  /**
   * Construct table using Datatables.net API
   * @return {[Boolean]} True if loaded without errors
   */
  render() {
    if (this.table.columns.length === 0) return;
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
    for (let i = 0; i < this.table.columns.length; i++) {
      /* jshint loopfunc: true */
      columns.push({
        title: this.table.columns[i].text,
        type: this.table.columns[i].type
      });
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
    if (this.table.rows[0].length === 4) {
      if (this.table.rows[0][0] === undefined) {
        // detected empty annotations
        this.table.rows = [];
      }
    }
    // pass the formatted rows into the datatable
    //var formattedData = [];
    var formattedData = this.generateFormattedData(this.table.rows);
    var newDT = $('#datatable-panel-table').DataTable({
      data: formattedData,
      columns: columns,
      "createdRow": function( row, data, dataIndex ) {
        //console.log("row data = " + data[1]);
        // color row/cell according to threshold settings
        if ( data[1] >= 1000 ) {
          $(row).addClass( 'threshold-ok' );
        }
      }
    });

    //this.populateTable(newDT);
    console.log("Datatable Loaded!");
  }

}
