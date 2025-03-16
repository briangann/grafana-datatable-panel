//import jszip from 'jszip';
//import pdfmake from 'pdfmake';
//import DataTable, { Config, ConfigColumns } from 'datatables.net-dt';
import { Config, ConfigColumnDefs, ConfigColumns, Order } from 'datatables.net-dt';

import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.html5.mjs';
import 'datatables.net-buttons/js/buttons.print.mjs';
import 'datatables.net-fixedcolumns-dt';
import 'datatables.net-fixedheader-dt';
import 'datatables.net-keytable-dt';
import 'datatables.net-scroller-dt';
import 'datatables.net-searchpanes-dt';
import 'datatables.net-select-dt';

import 'datatables.net-plugins/features/pageResize/dataTables.pageResize';
import 'datatables.net-plugins/features/scrollResize/dataTables.scrollResize.min';
import 'datatables.net-plugins/features/scrollResize/dataTables.scrollResize';
import 'datatables.mark.js';

import { PanelProps } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { useApplyTransformation } from 'hooks/useApplyTransformation';
import React, { useEffect, useRef, useState } from 'react';
import { DatatableOptions } from 'types';
import { buildColumnDefs, dataFrameToDataTableFormat, setColumnAliases, setColumnWidthHints } from 'data/dataHelpers';
import { datatableThemedStyles } from './styles';
import { GetDataTransformerID } from 'data/types';

interface Props extends PanelProps<DatatableOptions> { }


export const DataTablePanel: React.FC<Props> = (props: Props) => {
  const [dataTableClassesEnabled, setDatatableClassesEnabled] = useState<string[]>([]);
  const divStyles = useStyles2(datatableThemedStyles);
  const dataTableDOMRef = useRef<HTMLTableElement>(null);

  const dataTableWrapperId = `data-table-wrapper-${props.id}`;
  const dataTableId = `data-table-renderer-${props.id}`;
  const theme2 = useTheme2();

  //TODO actually pass what transformations to use from the options
  //currently simply doing a join by field (series to columns)
  //const { columns, rows } = (dataFrames && dataFrameToDataTableFormat(dataFrames)) || { columns: [], rows: [] };
  //let rowNumberOffset = 0;
  const transformID = GetDataTransformerID(props.options.transformation);
  let dataFrames = useApplyTransformation(props.data.series, transformID);
  const enableColumnFilters = (dataTable: any) => {
      // @ts-ignore
      const header = dataTable.table(0).header();
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
          let title = $(this).text();
          $(this).html('<input class="column-filter" type="text" placeholder="Search ' + title + '" />');

          $('input', this).on('keyup change', function(this: any) {
            if (dataTable.column(i).search() !== this.value) {
              dataTable
                .column(i)
                .search(this.value)
                .draw();
            }
          });
        });
  };
  useEffect(() => {
    let enabledClasses = ['display'];
    if (props.options.compactRowsEnabled) {
      enabledClasses.push("compact");
    }
    if (!props.options.wrapToFitEnabled) {
      enabledClasses.push("nowrap");
    }
    if (props.options.stripedRowsEnabled) {
      enabledClasses.push('stripe');
    }
    if (props.options.hoverEnabled) {
      enabledClasses.push('hover');
    }
    if (props.options.orderColumnEnabled) {
      enabledClasses.push('order-column');
    }

    if (JSON.stringify(enabledClasses) !== JSON.stringify(dataTableClassesEnabled)) {
      setDatatableClassesEnabled(enabledClasses);
    }
    //console.log('set table classes done!');
  }, [
    dataTableClassesEnabled,
    props.options.compactRowsEnabled,
    props.options.hoverEnabled,
    props.options.orderColumnEnabled,
    props.options.stripedRowsEnabled,
    props.options.wrapToFitEnabled]);

  // actually render the table
  useEffect(() => {

    // 32 = panel title when displayed
    // 8 = panel content wrapper padding (all the way around) - need this for width too!
    // 5 = select rows to display padding top/bottom
    // 44 = when dt-search or select rows displayed
    // 38 = bottom buttons
    //let computedHeight = height - 32 - 8 - 5 - 44 - 38;
    const getDatatableHeight = (height: number) => {
      let computedHeight = height - 32 - 8 - 5 - 44 - 38;
      return computedHeight;
    };

    let columns: ConfigColumns[] = [];
    let columnDefs: ConfigColumnDefs[] = [];
    let rows: any[] = [];

    if (dataFrames && dataFrames.length > 0) {
      const result = dataFrameToDataTableFormat(props.options.alignNumbersToRightEnabled, props.options.rowNumbersEnabled, dataFrames, theme2);
      columns = result.columns;
      // get the column widths
      columns = setColumnWidthHints(columns, props.options.columnWidthHints);
      columns = setColumnAliases(columns, props.options.columnAliases);
      // TODO: convert this to the expected format
      let flattenedRows = [];
      for (let i = 0; i < result.rows.length; i++) {
        const aRow = result.rows[i];
        // flatten
        // iterate the columns in order
        let flattenedRow = [];
        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          const name = columns[colIndex].data as string;
          // @ts-ignore
          flattenedRow.push(aRow[name])
        }
        //console.log(flattenedRow);
        flattenedRows.push(flattenedRow);
      }
      // this ends up with the formatted data in the correct format
      rows = flattenedRows; // result.rows;
      columnDefs = buildColumnDefs(
        props.options.emptyDataEnabled,
        props.options.emptyDataText,
        props.options.rowNumbersEnabled,
        props.options.fontSizePercent,
        props.options.columnAliases,
        props.options.alignNumbersToRightEnabled,
        columns,
        rows);
    }

    // convert to order data structure used by datatable
    let orderColumn: Order = [];
    for (let i = 0; i< props.options.columnSorting.length; i++) {
      orderColumn.push([props.options.columnSorting[i].index, props.options.columnSorting[i].order]);
    }
    if (dataTableDOMRef.current && columns.length > 0) {
      try {
          // cleanup existing table, columns may have changed
          const aDT = $(dataTableDOMRef.current).DataTable();
          aDT.destroy();
          $(dataTableDOMRef.current).empty();
      } catch (err) {
        console.log('Exception: ' + err);
      }
      const calculatedHeight = getDatatableHeight(props.height);

      if (!jQuery.fn.dataTable.isDataTable(dataTableDOMRef.current)) {
        const dtOptions: Config = {
          buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
          columns: columns,
          columnDefs: columnDefs,
          data: rows,
          info: props.options.infoEnabled,
          lengthChange: props.options.lengthChangeEnabled,
          lengthMenu: [
            [5, 10, 25, 50, 75, 100, -1],
            [5, 10, 25, 50, 75, 100, 'All'],
          ],
          // @ts-expect-error
          mark: props.options.searchHighlightingEnabled || false,
          select: { style: 'os' },
          scroll: props.options.scroll,
          paging: !props.options.scroll,
          scrollY: `${calculatedHeight}px`,
          ordering: true,
          orderFixed: orderColumn,
          orderMulti: true,
          pagingType: props.options.datatablePagingType,
          scrollCollapse: false,
          scrollX: true,
          search: {
            regex: true,
            smart: false,
          },
          searching: props.options.searchEnabled,
          //select: selectSettings,
          stateSave: false,
        };
        if (props.options.rowsPerPage) {
          dtOptions.pageLength = props.options.rowsPerPage;
        }
        jQuery(dataTableDOMRef.current).DataTable(dtOptions as Config);
      }
    }
    const currentDom = dataTableDOMRef.current;
    if (props.options.columnFiltersEnabled) {
      if (currentDom) {
        enableColumnFilters(jQuery(currentDom).DataTable());
      }
    }
    // make sure we clean up on unmount
    return () => {
      if (currentDom && jQuery.fn.dataTable.isDataTable(currentDom)) {
        jQuery(currentDom).DataTable().destroy();
      }
    };
  }, [
    dataFrames,
    dataTableClassesEnabled,
    theme2,
    props.height,
    props.options.alignNumbersToRightEnabled,
    props.options.columnAliases,
    props.options.columnFiltersEnabled,
    props.options.columnWidthHints,
    props.options.datatablePagingType,
    props.options.emptyDataEnabled,
    props.options.emptyDataText,
    props.options.fontSizePercent,
    props.options.infoEnabled,
    props.options.lengthChangeEnabled,
    props.options.orderColumnEnabled,
    props.options.rowNumbersEnabled,
    props.options.rowsPerPage,
    props.options.scroll,
    props.options.searchEnabled,
    props.options.searchHighlightingEnabled,
    props.options.columnSorting]);

  /*
  <div className={divStyles} style={{
      width: '100%',
      height: props.height,
    }}>
  */
  return (
    <div id={dataTableWrapperId} className={divStyles} style={{width: '100%', height: '100%'}}>
      {props.data &&
        <table style={{width: '100%'}}
          id={dataTableId}
          ref={dataTableDOMRef}
          className={dataTableClassesEnabled.join(' ')}
          width="100%">
        </table>
      }
    </div>
  );
};
