import { dateTime } from '@grafana/data';
import $ from 'jquery';
import kbn from 'grafana/app/core/utils/kbn';

import _, { isNumber } from 'lodash';
import { GetColorForValue, GetColorIndexForValue, StringToJsRegex } from './Utils';
import 'datatables.net';

export class DatatableRenderer {
  formatters: any;
  colorState: any;
  panel: any;
  table: any;
  isUtc: boolean;
  sanitize: any;
  timeSrv: any;

  // from app/core/constants
  GRID_CELL_HEIGHT = 30;
  // from inspect
  TITLE_LINE_HEIGHT = 28;
  constructor(panel: any, table: any, isUtc: boolean, sanitize: any, timeSrv: any) {
    this.formatters = [];
    this.colorState = {};
    this.panel = panel;
    this.table = table;
    this.isUtc = isUtc;
    this.sanitize = sanitize;
    this.timeSrv = timeSrv;
  }

  /**
   * Formats a cell
   * @param v value
   * @param style style obj
   * @param column column
   * @param rowIndex The row index
   * @return any formatted data
   */
  defaultCellFormatter(v: any, style: any, column: any, rowIndex: number) {
    if (v === null || v === void 0 || v === undefined || column === null) {
      return '';
    }
    if (_.isArray(v)) {
      v = v.join(', ');
    }
    v = String(v);

    if (typeof style === 'undefined') {
      style = {};
    }
    let cellTemplate = style.url;

    if (typeof style.splitPattern === 'undefined' || style.splitPattern === '') {
      style.splitPattern = '/ /';
    }

    const regex = StringToJsRegex(String(style.splitPattern));
    const values = v.split(regex);
    if (typeof cellTemplate !== 'undefined') {
      // replace $__from/$__to/$__
      cellTemplate = this.replaceTimeMacros(cellTemplate);
      // Replace $__cell with this cell's content.
      cellTemplate = cellTemplate.replace(/\$__cell\b/, v);
      values.map((val: any, i: any) => (cellTemplate = cellTemplate.replace(`$__pattern_${i}`, val)));
    }

    if (style && style.sanitize) {
      return this.sanitize(v);
    } else if (style && style.link && cellTemplate && column.text === style.column) {
      const matches = /\$__cell_(\d+)/g.exec(cellTemplate);
      // start with the template
      let linkValue = cellTemplate;
      if (matches) {
        // index zero is the whole string
        for (let matchIndex = 1; matchIndex < matches.length; matchIndex++) {
          //console.log(`rowIndex: ${rowIndex} matchIndex: ${matchIndex}`);
          const matchedCellNumber = parseInt(matches[matchIndex], 10);
          if (!isNaN(matchedCellNumber)) {
            const matchedCellContent = this.table.rows[rowIndex][matchedCellNumber];
            //console.log(`matchedCellNumber: ${matchedCellNumber} matchedCellContent: ${matchedCellContent}`);
            linkValue = linkValue.replace(`$__cell_${matchedCellNumber}`, matchedCellContent);
          }
        }
        const valueFormatter = kbn.valueFormats[column.unit || style.unit];
        if (style && style.decimals) {
          v = valueFormatter(v, style.decimals, null);
        } else {
          v = valueFormatter(v);
        }
        return '<a href="' + linkValue + '" target="_blank">' + v + '</a>';
      } else {
        const linkValue = cellTemplate.replace(/\{\}|\$__cell_\d*/g, v);
        return '<a href="' + linkValue + '" target="_blank">' + v + '</a>';
      }
      return _.escape(v);
    } else if (style && style.link) {
      return '<a href="' + v + '" target="_blank">' + v + '</a>';
    } else {
      return _.escape(v);
    }
  }

  // Similar to DataLinks, this replaces the value of the panel time ranges for use in url params
  replaceTimeMacros(content: string) {
    let newContent = content;
    if (content.match(/\$__from/g)) {
      // replace all occurences
      newContent = newContent.replace('$__from', this.timeSrv.time.from);
    }
    if (content.match(/\$__to/g)) {
      // replace all occurences
      newContent = newContent.replace('$__to', this.timeSrv.time.to);
    }
    if (content.match(/\$__keepTime/g)) {
      // replace all occurences
      const keepTime = `from=${this.timeSrv.time.from}&to=${this.timeSrv.time.to}`;
      newContent = newContent.replace('$__keepTime', keepTime);
    }
    return newContent;
  }
  /**
   * [createColumnFormatter description]
   * @param  {[type]} style  [description]
   * @param  {[type]} column [description]
   * @return {[type]}        [description]
   */
  createColumnFormatter(style: any, column: any) {
    if (!style) {
      return this.defaultCellFormatter;
    }
    if (style.type === 'hidden') {
      return (v: any, rIndex: number) => {
        return null;
      };
    }
    if (style.type === 'date') {
      return (v: any, rIndex: number) => {
        if (v === undefined || v === null) {
          return '-';
        }

        if (_.isArray(v)) {
          v = v[0];
        }

        // if is an epoch (numeric string and len > 12)
        if (_.isString(v) && !isNaN(v as any) && v.length > 12) {
          v = parseInt(v, 10);
        }

        let date = dateTime(v);

        if (this.isUtc) {
          date = date.utc();
        }
        const fmt = date.format(style.dateFormat);
        return fmt;
      };
    }
    if (style.type === 'number') {
      const valueFormatter = kbn.valueFormats[column.unit || style.unit];
      return (v: any, rIndex: number) => {
        if (v === null || v === void 0) {
          return '-';
        }
        if (_.isString(v)) {
          return this.defaultCellFormatter(v, style, column, rIndex);
        }
        if (style.colorMode) {
          this.colorState[style.colorMode] = GetColorForValue(v, style);
        }
        return valueFormatter(v, style.decimals, null);
      };
    }
    if (style.type === 'string') {
      return (v: any, rIndex: number) => {
        if (_.isArray(v)) {
          v = v.join(', ');
        }

        const mappingType = style.mappingType || 0;

        if (mappingType === 1 && style.valueMaps) {
          for (let i = 0; i < style.valueMaps.length; i++) {
            const map = style.valueMaps[i];
            if (v === null) {
              if (map.value === 'null') {
                return map.text;
              }
              continue;
            }

            // Allow both numeric and string values to be mapped
            if ((!_.isString(v) && Number(map.value) === Number(v)) || map.value === v) {
              return this.defaultCellFormatter(map.text, style, column, rIndex);
            }
          }
        }

        if (mappingType === 2 && style.rangeMaps) {
          for (let i = 0; i < style.rangeMaps.length; i++) {
            const map = style.rangeMaps[i];
            if (v === null) {
              if (map.from === 'null' && map.to === 'null') {
                return map.text;
              }
              continue;
            }

            if (Number(map.from) <= Number(v) && Number(map.to) >= Number(v)) {
              return this.defaultCellFormatter(map.text, style, column, rIndex);
            }
          }
        }

        if (v === null || v === void 0) {
          return '-';
        }
        return this.defaultCellFormatter(v, style, column, rIndex);
      };
    }
    return (v: any, rIndex: number) => {
      return this.defaultCellFormatter(v, style, column, rIndex);
    };
  }

  /**
   * [formatColumnValue description]
   * @param  {[type]} colIndex [description]
   * @param  {[type]} rowIndex [description]
   * @param  {[type]} value    [description]
   * @return {[type]}          [description]
   */
  formatColumnValue(colIndex: any, rowIndex: any, value: any) {
    if (!this.formatters[colIndex]) {
      for (let i = 0; i < this.panel.styles.length; i++) {
        const style = this.panel.styles[i];
        const column = this.table.columns[colIndex];
        const regex = StringToJsRegex(style.pattern);
        if (column.text.match(regex)) {
          this.formatters[colIndex] = this.createColumnFormatter(style, column);
        }
      }
    }
    if (!this.formatters[colIndex]) {
      this.formatters[colIndex] = this.defaultCellFormatter;
    }
    let v = this.formatters[colIndex](value, rowIndex);
    if (/\$__cell_\d+/.exec(v)) {
      for (let i = this.table.columns.length - 1; i >= 0; i--) {
        v = v.replace(`$__cell_${i}`, this.table.rows[rowIndex][i]);
      }
    }
    return v;
  }

  /**
   * [generateFormattedData description]
   * @param  {[type]} rowData [description]
   * @return {[type]}         [description]
   */
  generateFormattedData(rowData: any) {
    const formattedRowData = [];
    for (let y = 0; y < rowData.length; y++) {
      const row = this.table.rows[y];
      const cellData = [];
      for (let i = 0; i < this.table.columns.length; i++) {
        let value = this.formatColumnValue(i, y, row[i]);
        if (value === undefined || value === null) {
          this.table.columns[i].hidden = true;
        }
        if (value === null) {
          value = row[i];
        }
        const record = {
          display: value,
          raw: row[i],
          _: row[i],
        };
        cellData.push(record);
      }
      if (this.panel.rowNumbersEnabled) {
        cellData.unshift('rowCounter');
      }
      formattedRowData.push(cellData);
    }
    return formattedRowData;
  }

  getStyleForColumn(columnNumber: any) {
    let colStyle = null;
    for (let i = 0; i < this.panel.styles.length; i++) {
      const style = this.panel.styles[i];
      const column = this.table.columns[columnNumber];
      if (column === undefined) {
        break;
      }
      const regex = StringToJsRegex(style.pattern);
      if (column.text.match(regex)) {
        colStyle = style;
        break;
      }
    }
    return colStyle;
  }

  getCellColors(colorState: any, columnNumber: any, cellData: any) {
    if (cellData === null || cellData === undefined) {
      return null;
    }
    const items = cellData.split(/([^0-9.,]+)/);
    // only color cell if the content is a number?
    let bgColor = null;
    let bgColorIndex = null;
    let color = null;
    let colorIndex = null;
    let colStyle = null;
    let value = null;
    // check if the content has a numeric value after the split
    if (!isNaN(items[0])) {
      // run value through threshold function
      value = parseFloat(items[0].replace(',', '.'));
      colStyle = this.getStyleForColumn(columnNumber);
    }
    if (colStyle !== null && colStyle.colorMode != null) {
      // check color for either cell or row
      if (colorState.cell || colorState.row || colorState.rowcolumn) {
        // bgColor = _this.colorState.cell;
        bgColor = GetColorForValue(value, colStyle);
        bgColorIndex = GetColorIndexForValue(value, colStyle);
        color = 'white';
      }
      // just the value color is set
      if (colorState.value) {
        //color = _this.colorState.value;
        color = GetColorForValue(value, colStyle);
        colorIndex = GetColorIndexForValue(value, colStyle);
      }
    }
    return {
      bgColor: bgColor,
      bgColorIndex: bgColorIndex,
      color: color,
      colorIndex: colorIndex,
    };
  }

  getColumnAlias(columnName: any) {
    // default to the columnName
    let columnAlias = columnName;
    if (this.panel.columnAliases !== undefined) {
      for (let i = 0; i < this.panel.columnAliases.length; i++) {
        if (this.panel.columnAliases[i].name === columnName) {
          columnAlias = this.panel.columnAliases[i].alias;
          break;
        }
      }
    }
    return columnAlias;
  }

  getColumnWidthHint(columnName: any) {
    // default to the columnName
    let columnWidth = '';
    if (this.panel.columnWidthHints !== undefined) {
      for (let i = 0; i < this.panel.columnWidthHints.length; i++) {
        if (this.panel.columnWidthHints[i].name === columnName) {
          columnWidth = this.panel.columnWidthHints[i].width;
          break;
        }
      }
    }
    return columnWidth;
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
    const tableHolderId = '#datatable-panel-table-' + this.panel.id;
    try {
      if ($.fn.dataTable.isDataTable(tableHolderId)) {
        const aDT = $(tableHolderId).DataTable();
        aDT.destroy();
        $(tableHolderId).empty();
      }
    } catch (err) {
      console.log('Exception: ' + err.message);
    }

    if (this.panel.emptyData) {
      return;
    }
    const columns = [];
    const columnDefs = [];
    const _this = this;
    let rowNumberOffset = 0;
    if (this.panel.rowNumbersEnabled) {
      rowNumberOffset = 1;
      columns.push({
        title: '',
        type: 'number',
      });
      columnDefs.push({
        searchable: false,
        orderable: false,
        targets: 0,
        width: '1%',
      });
    }
    for (let i = 0; i < this.table.columns.length; i++) {
      const columnAlias = this.getColumnAlias(this.table.columns[i].text);
      const columnWidthHint = this.getColumnWidthHint(this.table.columns[i].text);
      // column type "date" is very limited, and overrides our formatting
      // best to use our format, then the "raw" epoch time as the sort ordering field
      // https://datatables.net/reference/option/columns.type
      let columnType = this.table.columns[i].type;
      if (columnType === 'date') {
        columnType = 'num';
      }
      // NOTE: the width below is a "hint" and will be overridden as needed, this lets most tables show timestamps
      // with full width
      /* jshint loopfunc: true */
      columns.push({
        title: columnAlias,
        type: columnType,
        width: columnWidthHint,
      });
      columnDefs.push({
        targets: i + rowNumberOffset,
        data: function(row: any, type: any, val: any, meta: any) {
          if (type === undefined) {
            return null;
          }
          const idx = meta.col;
          // sort/filter/type use raw
          let returnValue = row[idx].raw;
          if (type === 'display') {
            returnValue = row[idx].display;
          }
          return returnValue;
        },
        render: function(data: any, type: any, val: any, meta: any) {
          if (type === undefined) {
            return null;
          }
          const idx = meta.col;
          if (type === 'type') {
            return val[idx];
          }
          // sort/filter use raw
          let returnValue = val[idx].raw;
          if (type === 'display') {
            returnValue = val[idx].display;
          }
          return returnValue;
        },
        createdCell: (td: any, cellData: any, rowData: any, row: any, col: any) => {
          // orthogonal sort requires getting cell data differently
          const formattedData = $(td).html();
          // can only evaluate thresholds on a numerical value
          // also - hidden columns have null data
          if (!isNumber(_this.table.rows[row][col])) {
            return;
          }
          if (formattedData === null) {
            return;
          }
          cellData = formattedData;
          // set the fontsize for the cell
          $(td).css('font-size', _this.panel.fontSize);
          // undefined types should have numerical data, any others are already formatted
          let actualColumn = col;
          if (_this.panel.rowNumbersEnabled) {
            actualColumn -= 1;
          }
          // for coloring rows, get the "worst" threshold
          let rowColor = null;
          let color = null;
          let rowColorIndex = null;
          let rowColorData = null;
          if (_this.colorState.row) {
            // run all of the rowData through threshold check, get the "highest" index
            // and use that for the entire row
            if (rowData === null) {
              return;
            }
            rowColorIndex = -1;
            rowColorData = null;
            rowColor = _this.colorState.row;
            // this should be configurable...
            color = 'white';
            for (let columnNumber = 0; columnNumber < _this.table.columns.length; columnNumber++) {
              // only columns of type undefined are checked
              if (_this.table.columns[columnNumber].type === undefined) {
                rowColorData = _this.getCellColors(
                  _this.colorState,
                  columnNumber,
                  rowData[columnNumber + rowNumberOffset]
                );
                if (!rowColorData) {
                  continue;
                }
                if (rowColorData.bgColorIndex !== null) {
                  if (rowColorData.bgColorIndex > rowColorIndex) {
                    rowColorIndex = rowColorData.bgColorIndex;
                    rowColor = rowColorData.bgColor;
                  }
                }
              }
            }
            // style the entire row (the parent of the td is the tr)
            // this will color the rowNumber and Timestamp also
            $(td.parentNode)
              .children()
              .css('color', color);
            $(td.parentNode)
              .children()
              .css('background-color', rowColor);
          }

          if (_this.colorState.rowcolumn) {
            // run all of the rowData through threshold check, get the "highest" index
            // and use that for the entire row
            if (rowData === null) {
              return;
            }
            rowColorIndex = -1;
            rowColorData = null;
            rowColor = _this.colorState.rowcolumn;
            // this should be configurable...
            color = 'white';
            for (let columnNumber = 0; columnNumber < _this.table.columns.length; columnNumber++) {
              // only columns of type undefined are checked
              if (_this.table.columns[columnNumber].type === undefined) {
                rowColorData = _this.getCellColors(
                  _this.colorState,
                  columnNumber,
                  rowData[columnNumber + rowNumberOffset]
                );
                if (!rowColorData) {
                  continue;
                }
                if (rowColorData.bgColorIndex !== null) {
                  if (rowColorData.bgColorIndex > rowColorIndex) {
                    rowColorIndex = rowColorData.bgColorIndex;
                    rowColor = rowColorData.bgColor;
                  }
                }
              }
            }
            // style the rowNumber and Timestamp column
            // the cell colors will be determined in the next phase
            if (_this.table.columns[0].type !== undefined) {
              const children = $(td.parentNode).children();
              let aChild = children[0];
              $(aChild).css('color', color);
              $(aChild).css('background-color', rowColor);
              // the 0 column contains the row number, if they are enabled
              // then the above just filled in the color for the row number,
              // now take care of the timestamp
              if (_this.panel.rowNumbersEnabled) {
                aChild = children[1];
                $(aChild).css('color', color);
                $(aChild).css('background-color', rowColor);
              }
            }
          }

          // Process cell coloring
          // Two scenarios:
          //    1) Cell coloring is enabled, the above row color is skipped
          //    2) RowColumn is enabled, the above row color is process, but we also
          //    set the cell colors individually
          const colorData = _this.getCellColors(_this.colorState, actualColumn, cellData);
          if (!colorData) {
            return;
          }
          if (_this.colorState.cell || _this.colorState.rowcolumn) {
            if (colorData.color !== undefined) {
              $(td).css('color', colorData.color);
            }
            if (colorData.bgColor !== undefined) {
              $(td).css('background-color', colorData.bgColor);
            }
          } else if (_this.colorState.value) {
            if (colorData.color !== undefined) {
              $(td).css('color', colorData.color);
            }
          }
        },
      });
    }

    try {
      let shouldDestroy = false;
      if ($.fn.dataTable.isDataTable('#datatable-panel-table-' + this.panel.id)) {
        shouldDestroy = true;
      }
      if (shouldDestroy) {
        const destroyedDT = $('#datatable-panel-table-' + this.panel.id).DataTable();
        destroyedDT.destroy();
        $('#datatable-panel-table-' + this.panel.id).empty();
      }
    } catch (err) {
      console.log('Exception: ' + err.message);
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
    const formattedData = this.generateFormattedData(this.table.rows);

    if (this.panel.rowNumbersEnabled) {
      // shift the data to the right
    }
    let panelHeight = this.panel.panelHeight;
    if (this.panel.scroll) {
      if (typeof this.panel.height === 'undefined') {
        panelHeight = this.getGridHeight(this.panel.gridPos.h);
      }
    } else {
      panelHeight = '';
    }
    const orderSetting = this.panel.sortByColumnsData;

    let selectSettings: DataTables.SelectSettings;
    selectSettings = {
      style: 'os',
    };
    //    scrollY: panelHeight.toString() + 'px',
    const tableOptions = {
      lengthMenu: [
        [5, 10, 25, 50, 75, 100, -1],
        [5, 10, 25, 50, 75, 100, 'All'],
      ],
      searching: this.panel.searchEnabled,
      info: this.panel.infoEnabled,
      lengthChange: this.panel.lengthChangeEnabled,
      scrollCollapse: false,
      scrollX: true,
      scrollY: panelHeight,
      stateSave: false,
      dom: 'Bfrtip',
      buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
      select: selectSettings,
      data: formattedData,
      columns: columns,
      columnDefs: columnDefs,
      // TODO: move search options to editor
      search: {
        regex: true,
        smart: false,
      },
      order: orderSetting,
      scroll: this.panel.scroll,
      paging: !this.panel.scroll,
      pagingType: this.panel.datatablePagingType,
    };
    /*
    if (this.panel.scroll) {
      tableOptions.paging = false;
      tableOptions.scrollY = panelHeight;
    } else {
      tableOptions.paging = true;
      tableOptions.pagingType = this.panel.datatablePagingType;
    }
    */

    const $datatable = $(tableHolderId);

    /*
    const c = document.querySelector(tableHolderId);
    if (c) {
      console.log(c);
      const r = c.getBoundingClientRect();
      console.log(r);
    }
    */
    const newDT = $datatable.DataTable(tableOptions);

    // hide columns that are marked hidden
    for (let i = 0; i < this.table.columns.length; i++) {
      if (this.table.columns[i].hidden) {
        newDT.column(i + rowNumberOffset).visible(false);
      }
    }

    // enable compact mode
    if (this.panel.compactRowsEnabled) {
      $datatable.addClass('compact');
    }
    // enable striped mode
    if (this.panel.stripedRowsEnabled) {
      $datatable.addClass('stripe');
    }
    if (this.panel.hoverEnabled) {
      $datatable.addClass('hover');
    }
    if (this.panel.orderColumnEnabled) {
      $datatable.addClass('order-column');
    }
    // these two are mutually exclusive
    if (this.panel.showCellBorders) {
      $datatable.addClass('cell-border');
    } else {
      if (this.panel.showRowBorders) {
        $datatable.addClass('row-border');
      }
    }
    if (!this.panel.scroll) {
      // set the page size
      if (this.panel.rowsPerPage !== null) {
        newDT.page.len(this.panel.rowsPerPage).draw();
      }
    }
    // function to display row numbers
    if (this.panel.rowNumbersEnabled) {
      newDT
        .on('order.dt search.dt', () => {
          newDT
            .column(0, { search: 'applied', order: 'applied' })
            .nodes()
            .each((cell, i) => {
              cell.innerHTML = i + 1;
            });
        })
        .draw();
    }

    if (this.panel.columnFiltersEnabled) {
      const header = newDT.table(0).header();
      //New additions to be put under a switch
      const newHeaders = $(header)
        .children('tr')
        .clone();
      newHeaders
        .find('th')
        .removeClass()
        .addClass('column-filter');
      newHeaders.appendTo(header as Element);
      $(header)
        .find(`tr:eq(1) th`)
        .each(function(i) {
          var title = $(this).text();
          $(this).html('<input class="column-filter" type="text" placeholder="Search ' + title + '" />');

          $('input', this).on('keyup change', function(this: any) {
            if (newDT.column(i).search() !== this.value) {
              newDT
                .column(i)
                .search(this.value)
                .draw();
            }
          });
        });
    }
  }

  getGridHeight(height: number) {
    const gridHeight = Math.ceil(height * this.GRID_CELL_HEIGHT) - this.TITLE_LINE_HEIGHT - 30;
    return gridHeight;
  }

  // For CSV Export
  render_values() {
    const rows = [];

    for (let y = 0; y < this.table.rows.length; y++) {
      const row = this.table.rows[y];
      const newRow = [];
      for (let i = 0; i < this.table.columns.length; i++) {
        newRow.push(this.formatColumnValue(i, y, row[i]));
      }
      rows.push(newRow);
    }
    return {
      columns: this.table.columns,
      rows: rows,
    };
  }
}
