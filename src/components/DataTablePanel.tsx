//import jszip from 'jszip';
//import pdfmake from 'pdfmake';
//import DataTable, { Config, ConfigColumns } from 'datatables.net-dt';
import { Config, ConfigColumnDefs, Order } from 'datatables.net-dt';

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

import { LoadingState, PanelProps, textUtil } from '@grafana/data';

import { useStyles2, useTheme2 } from '@grafana/ui';
import { useApplyTransformation } from 'hooks/useApplyTransformation';
import React, { useEffect, useRef, useState } from 'react';
import { DatatableOptions } from 'types';
import { BuildColumnDefs, ConvertDataFrameToDataTableFormat } from 'data/dataHelpers';
import { ApplyColumnWidthHints } from 'data/columnWidthHints';
import { datatableThemedStyles } from './styles';
import { GetDataTransformerID } from 'data/transformations';
import { DTColumnType } from 'data/types';
import { ApplyColumnAliases } from 'data/columnAliasing';

interface Props extends PanelProps<DatatableOptions> { }

export interface DTData {
  Columns: DTColumnType[],
  Rows: any[],
};

export const DataTablePanel: React.FC<Props> = (props: Props) => {

  const [dataTableClassesEnabled, setDatatableClassesEnabled] = useState<string[]>([]);
  const [cachedProcessedData, setCachedProcessedData] = useState<DTData>();
  const [cachedColumnDefs, setCachedColumnDefs] = useState<ConfigColumnDefs[]>();

  const divStyles = useStyles2(datatableThemedStyles);
  const dataTableDOMRef = useRef<HTMLTableElement>(null);

  const dataTableWrapperId = `data-table-wrapper-${props.id}`;
  const dataTableId = `data-table-renderer-${props.id}`;
  const theme2 = useTheme2();

  // convert the option to a usable type
  const transformID = GetDataTransformerID(props.options.transformation);
  const dataFrames = useApplyTransformation(props.data.series, transformID, props.options.transformationAggregations);

  const enableColumnFilters = (dataTable: any) => {
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
      .each(function (i) {
        let title = textUtil.sanitize($(this).text());
        $(this).html('<input class="column-filter" type="text" placeholder="Search ' + title + '" />');

        $('input', this).on('keyup change', function (this: any) {
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
    if (cachedProcessedData !== undefined && cachedColumnDefs !== undefined) {
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

    }
  }, [
    cachedProcessedData,
    cachedColumnDefs,
    dataTableClassesEnabled,
    props.options.compactRowsEnabled,
    props.options.hoverEnabled,
    props.options.orderColumnEnabled,
    props.options.stripedRowsEnabled,
    props.options.wrapToFitEnabled]);

  useEffect(() => {
    if (cachedProcessedData !== undefined) {
      const calcColumnDefs = BuildColumnDefs(
        props.options.emptyDataEnabled,
        props.options.emptyDataText,
        props.options.rowNumbersEnabled,
        props.options.fontSizePercent,
        props.options.alignNumbersToRightEnabled,
        props.timeRange,
        cachedProcessedData);
      setCachedColumnDefs(calcColumnDefs);
    }
  }, [
    cachedProcessedData,
    props.timeRange,
    props.options.alignNumbersToRightEnabled,
    props.options.emptyDataEnabled,
    props.options.emptyDataText,
    props.options.fontSizePercent,
    props.options.rowNumbersEnabled]);

  useEffect(() => {

    if (props.data.state === LoadingState.Done) {
      if (dataFrames && dataFrames.length > 0) {
        // get timezone of dashboard or global setting
        //const useTimeZone = getTimeZone();

        let dtColumns: DTColumnType[] = [];
        let flattenedRows: any[] = [];
        const result = ConvertDataFrameToDataTableFormat(
          dataFrames,
          props.fieldConfig,
          props.timeZone,
          props.timeRange,
          props.options.alignNumbersToRightEnabled,
          props.options.rowNumbersEnabled,
          props.options.columnStylesConfig,
          theme2);
        dtColumns = result.columns;
        // get the column widths
        dtColumns = ApplyColumnWidthHints(dtColumns, props.options.columnWidthHints);
        dtColumns = ApplyColumnAliases(dtColumns, props.options.columnAliases);
        flattenedRows = GetFlattenRows(result.rows, dtColumns);
        // update state
        setCachedProcessedData({
          Columns: dtColumns,
          Rows: flattenedRows,
        });
      }
    }
  }, [
    dataFrames,
    props.fieldConfig,
    props.timeZone,
    props.timeRange,
    props.data.state,
    props.data.series,
    props.options.alignNumbersToRightEnabled,
    props.options.columnAliases,
    props.options.columnStylesConfig,
    props.options.columnWidthHints,
    props.options.emptyDataEnabled,
    props.options.emptyDataText,
    props.options.fontSizePercent,
    props.options.rowNumbersEnabled,
    props.options.transformation,
    props.options.transformationAggregations,
    theme2]);

  useEffect(() => {
    if (cachedProcessedData !== undefined && cachedColumnDefs !== undefined) {

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

      // convert to order data structure used by datatable
      let orderColumn: Order = [];
      for (let i = 0; i < props.options.columnSorting.length; i++) {
        orderColumn.push([props.options.columnSorting[i].index, props.options.columnSorting[i].order]);
      }
      if (dataTableDOMRef.current && cachedProcessedData.Columns.length > 0) {
        try {
          // cleanup existing table, columns may have changed
          const aDT = $(dataTableDOMRef.current).DataTable();
          aDT.destroy();
          $(dataTableDOMRef.current).empty();
        } catch (err) {
          console.error('Exception: ' + err);
        }
        const calculatedHeight = getDatatableHeight(props.height);
        if (!jQuery.fn.dataTable.isDataTable(dataTableDOMRef.current)) {
          const dtOptions: Config = {
            buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
            columns: cachedProcessedData.Columns,
            columnDefs: cachedColumnDefs,
            data: cachedProcessedData.Rows,
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
            scrollY: `${calculatedHeight}px`,
            ordering: true,
            orderFixed: orderColumn,
            orderMulti: true,
            paging: !props.options.scroll,
            pagingType: props.options.datatablePagingType,
            language: {
              paginate: {
                previous: 'Previous',
                next: 'Next',
                first: 'First',
                last: 'Last',
              }
            },
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
    }
    return () => {
      return;
    }
  }, [
    dataTableClassesEnabled,
    cachedProcessedData,
    cachedColumnDefs,
    props.height,
    props.options.alignNumbersToRightEnabled,
    props.options.columnAliases,
    props.options.columnFiltersEnabled,
    props.options.columnSorting,
    props.options.columnStylesConfig,
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
    props.options.transformationAggregations,
    props.options.transformation,
  ]);

  if (cachedProcessedData === undefined || cachedColumnDefs === undefined) {
    return (
      <>Loading... please wait</>
    )
  }
  return (
    <div id={dataTableWrapperId} className={divStyles} style={{ width: '100%', height: '100%' }}>
      {props.data &&
        <table style={{ width: '100%' }}
          id={dataTableId}
          ref={dataTableDOMRef}
          className={dataTableClassesEnabled.join(' ')}
          width="100%">
        </table>
      }
    </div>
  );
};

const GetFlattenRows = (rows: any, columns: DTColumnType[]) => {
  let flattenedRows = [];
  for (let i = 0; i < rows.length; i++) {
    const aRow = rows[i];
    // flatten
    // iterate the columns in order
    let flattenedRow = [];
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const name = columns[colIndex].data as string;
      // @ts-ignore
      flattenedRow.push(aRow[name])
    }
    flattenedRows.push(flattenedRow);
  }
  return flattenedRows;
}
