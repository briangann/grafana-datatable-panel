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
   * [generateFormattedData description]
   * @param  {[type]} rowData [description]
   * @return {[type]}         [description]
   */
  generateFormattedData(rowData) {
    let formattedRowData = [];
    for (var y = 0; y < rowData.length; y++) {
      let row = this.table.rows[y];
      let cellData = [];
      //cellData.push('');
      for (var i = 0; i < this.table.columns.length; i++) {
        let value = this.formatColumnValue(i, row[i]);
        if (value === undefined) {
          this.table.columns[i].hidden = true;
        }
        cellData.push(this.formatColumnValue(i, row[i]));
      }
      if (this.panel.rowNumbersEnabled) {
        cellData.unshift('rowCounter');
      }
      formattedRowData.push(cellData);
    }
    return formattedRowData;
  }

  /**
   * Construct table using Datatables.net API
   *  multiple types supported
   * timeseries_to_rows (column 0 = timestamp)
   * timeseries_to_columns
   * timeseries_aggregations - column 0 is the metric name (series name, not a timestamp)
   * annotations - specific headers for this
   * table
   * json (raw)
   * columns[x].type === "date" then set columndefs to parse the date, otherwise leave it as default
   * convert table.columns[N].text to columns formatted to datatables.net format
   * @return {[Boolean]} True if loaded without errors
   */
  render() {
    if (this.table.columns.length === 0) return;
    var columns = [];
    var columnDefs = [];
    var _this = this;
    var rowNumberOffset = 0;
    if (this.panel.rowNumbersEnabled) {
      rowNumberOffset = 1;
      columns.push({
        title: '',
        type: 'number'
      });
      columnDefs.push(
        {
            "searchable": false,
            "orderable": false,
            "targets": 0,
            "width": "1%",
        });
    }
    for (let i = 0; i < this.table.columns.length; i++) {
      /* jshint loopfunc: true */
      columns.push({
        title: this.table.columns[i].text,
        type: this.table.columns[i].type
      });
        columnDefs.push(
          {
            "targets": i + rowNumberOffset,
            "createdCell": function (td, cellData, rowData, row, col) {
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
          }
        );
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
    var formattedData = this.generateFormattedData(this.table.rows);

    if (this.panel.rowNumbersEnabled) {
      // shift the data to the right
    }
    var panelHeight = this.panel.panelHeight;
    // console.log("panel height = " + panelHeight);
    var tableOptions = {
      "lengthMenu": [ [5, 10, 25, 50, 75, 100, -1], [5, 10, 25, 50, 75, 100, "All"] ],
      searching: this.panel.searchEnabled,
      info: this.panel.infoEnabled,
      lengthChange: this.panel.lengthChangeEnabled,
      scrollCollapse: false,
      data: formattedData,
      columns: columns,
      columnDefs: columnDefs,
      "search": {
        "regex": true
      },
      "order": [[ 1, 'asc' ]]
    };
    if (this.panel.scroll) {
      tableOptions.paging = false;
      tableOptions.scrollY = panelHeight;
    } else {
      tableOptions.paging = true;
      tableOptions.pagingType = this.panel.datatablePagingType;
    }
    var newDT = $('#datatable-panel-table').DataTable(tableOptions);

    // hide columns that are marked hidden
    for (let i = 0; i < this.table.columns.length; i++) {
      if (this.table.columns[i].hidden) {
        newDT.column( i + rowNumberOffset ).visible( false );
      }
    }

    // enable compact mode
    if (this.panel.compactRowsEnabled) {
      $('#datatable-panel-table').addClass( 'compact' );
    }
    // enable striped mode
    if (this.panel.stripedRowsEnabled) {
      $('#datatable-panel-table').addClass( 'stripe' );
    }
    if (this.panel.hoverEnabled) {
      $('#datatable-panel-table').addClass( 'hover' );
    }
    if (this.panel.orderColumnEnabled) {
      $('#datatable-panel-table').addClass( 'order-column' );
    }
    // these two are mutually exclusive
    if (this.panel.showCellBorders) {
      $('#datatable-panel-table').addClass( 'cell-border' );
    } else {
      if (this.panel.showRowBorders) {
        $('#datatable-panel-table').addClass( 'row-border' );
      }
    }
    if (!this.panel.scroll) {
      // set the page size
      if (this.panel.rowsPerPage !== null) {
        newDT.page.len( this.panel.rowsPerPage ).draw();
      }
    }
    // function to display row numbers
    if (this.panel.rowNumbersEnabled) {
      newDT.on( 'order.dt search.dt', function () {
        newDT.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
            cell.innerHTML = i+1;
        } );
      } ).draw();
    }
    // to use scrolling vs paging, use these settings
    // reference: http://www.jqueryscript.net/demo/DataTables-Jquery-Table-Plugin/examples/basic_init/scroll_y.html
    //  "scrollY":        "200px",
    //  "scrollCollapse": true,
    //  "paging":         false
    //console.log("Datatable Loaded!");
  }

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
