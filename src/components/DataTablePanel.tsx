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
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  // Gates the table visibility. Flipped to true inside DataTables'
  // `initComplete` once formatters, threshold coloring, and the optional
  // filter row are all in place. Hides the un-formatted first-paint flash.
  const [dataTableReady, setDataTableReady] = useState(false);

  const divStyles = useStyles2(datatableThemedStyles);
  const dataTableDOMRef = useRef<HTMLTableElement>(null);
  // Tracks whether the component is still mounted, so DataTables' async
  // `initComplete` callback doesn't setState on an unmounted instance.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const dataTableWrapperId = `data-table-wrapper-${props.id}`;
  const dataTableId = `data-table-renderer-${props.id}`;
  const theme2 = useTheme2();

  // convert the option to a usable type
  const transformID = GetDataTransformerID(props.options.transformation);
  const dataFrames = useApplyTransformation(props.data.series, transformID, props.options.transformationAggregations);

  // Stable reference so the dep arrays below can depend on a single value
  // without re-triggering every render. If the object were rebuilt inline
  // at the call sites, dropping it into a dep array would cause an
  // infinite loop; using the memoized value makes that invariant explicit.
  const alignment = useMemo(
    () => ({
      numbers: props.options.alignNumbersToRightEnabled,
      strings: props.options.alignStringsToRightEnabled,
    }),
    [props.options.alignNumbersToRightEnabled, props.options.alignStringsToRightEnabled],
  );

  const enableColumnFilters = (dataTable: any) => {
    const header = dataTable.table(0).header();
    const $header = $(header);

    // Idempotency guard — don't stack rows on re-invocation
    if ($header.find('tr.column-filter').length > 0) {
      return;
    }

    // Clone the existing header row; strip only sort-interactivity classes so
    // DataTables' layout classes (dt-*, width hints) survive and keep the
    // filter cells aligned with the body columns.
    const newHeaders = $header.children('tr').first().clone();
    newHeaders
      .addClass('column-filter')
      .find('th')
      .removeClass('sorting')
      .removeClass('sorting_asc')
      .removeClass('sorting_desc')
      .removeClass('sorting_disabled')
      .addClass('column-filter');
    newHeaders.appendTo(header as Element);

    // Populate each cloned th with a search input. Structure only — handlers
    // go on the wrapper via delegation below, because DataTables' scrollX
    // mode re-clones the source thead into `.dt-scroll-head` on every draw
    // and wipes any listeners bound directly to input nodes.
    // Build the <input> via DOM APIs rather than `.html(string)` templating
    // so a column title containing a `"` character cannot break out of the
    // placeholder attribute — `textUtil.sanitize` strips HTML tags but does
    // not escape attribute-context quotes.
    $header.find(`tr.column-filter th`).each(function () {
      const th = this as HTMLTableCellElement;
      const title = textUtil.sanitize(th.textContent ?? '');
      const input = document.createElement('input');
      input.className = 'column-filter';
      input.type = 'text';
      input.placeholder = `Search ${title}`;
      th.textContent = '';
      th.appendChild(input);
    });

    // Delegated handlers on the table container survive DataTables' per-draw
    // clone refresh, so they fire on whichever thead instance the user is
    // actually interacting with (the visible clone in `.dt-scroll-head`).
    const $container = $(dataTable.table(0).container());
    const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>();

    $container.on('click.columnFilter', 'tr.column-filter th', function (ev: JQuery.TriggeredEvent) {
      ev.stopPropagation();
    });

    $container.on('keyup.columnFilter change.columnFilter', 'input.column-filter', function (this: HTMLInputElement, _ev: JQuery.TriggeredEvent) {
      const columnIndex = $(this).closest('th').index();
      const value = this.value;
      const existing = debounceTimers.get(columnIndex);
      if (existing !== undefined) {
        clearTimeout(existing);
      }
      debounceTimers.set(
        columnIndex,
        setTimeout(() => {
          if (dataTable.column(columnIndex).search() !== value) {
            dataTable.column(columnIndex).search(value).draw();
          }
        }, 250),
      );
    });

    // Resync header clone (scrollX) and body widths now that the thead has
    // a second row.
    dataTable.columns.adjust().draw(false);
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
        alignment,
        props.timeRange,
        props.replaceVariables,
        cachedProcessedData);
      setCachedColumnDefs(calcColumnDefs);
    }
  }, [
    alignment,
    cachedProcessedData,
    props.timeRange,
    props.replaceVariables,
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
          alignment,
          props.options.rowNumbersEnabled,
          props.options.columnStylesConfig,
          theme2,
          props.replaceVariables);
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
    alignment,
    dataFrames,
    props.fieldConfig,
    props.timeZone,
    props.timeRange,
    props.replaceVariables,
    props.data.state,
    props.data.series,
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
      // Re-init in progress — keep the overlay up until the new initComplete
      // fires, otherwise a transient un-formatted paint appears between
      // destroy and the next draw.
      setDataTableReady(false);

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
          // cleanup existing table, columns may have changed. Remove any
          // delegated `.columnFilter` handlers first so a destroy path that
          // retains the container element cannot accumulate stale handlers
          // across re-inits.
          $(dataTableDOMRef.current).closest('.dt-container').off('.columnFilter');
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
            sortClasses: false,
            destroy: true,
            scrollCollapse: false,
            scrollX: true,
            search: {
              regex: true,
              smart: false,
            },
            // Column filters drive `.column(i).search()`, which requires
            // DataTables' search feature to be enabled. When the user has
            // only turned on column filters (not the global search box),
            // keep the feature on but suppress the top-end search control
            // via layout so no stray global input appears.
            searching: props.options.searchEnabled || props.options.columnFiltersEnabled,
            ...(!props.options.searchEnabled && props.options.columnFiltersEnabled
              ? { layout: { topEnd: null } }
              : {}),
            //select: selectSettings,
            stateSave: false,
            initComplete: function () {
              if (props.options.columnFiltersEnabled) {
                enableColumnFilters(this.api());
              }
              if (mountedRef.current) {
                setDataTableReady(true);
              }
            },
          };
          if (props.options.rowsPerPage) {
            dtOptions.pageLength = props.options.rowsPerPage;
          }
          jQuery(dataTableDOMRef.current).DataTable(dtOptions as Config);
        }
      }
    }
  }, [
    alignment,
    dataTableClassesEnabled,
    cachedProcessedData,
    cachedColumnDefs,
    props.height,
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

  const hasData = cachedProcessedData !== undefined && cachedColumnDefs !== undefined;
  return (
    <div
      id={dataTableWrapperId}
      className={divStyles}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {!dataTableReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            background: theme2.colors.background.primary,
            color: theme2.colors.text.secondary,
          }}
        >
          Loading... please wait
        </div>
      )}
      {hasData && props.data && (
        <table
          style={{ width: '100%', visibility: dataTableReady ? 'visible' : 'hidden' }}
          id={dataTableId}
          ref={dataTableDOMRef}
          className={dataTableClassesEnabled.join(' ')}
          width="100%"
        />
      )}
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
