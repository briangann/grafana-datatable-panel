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
import { DatatableOptions, DTColumnType, DTData, FlatRow, NamedRow } from 'types';
import { BuildColumnDefs, ConvertDataFrameToDataTableFormat } from 'data/dataHelpers';
import { ApplyColumnWidthHints } from 'data/columns/columnWidthHints';
import { buildSearchBarLayout } from 'data/layout/buildSearchBarLayout';
import { datatableThemedStyles } from './styles';
import { GetDataTransformerID } from 'data/transformations';
import { ApplyColumnAliases } from 'data/columns/columnAliasing';

interface Props extends PanelProps<DatatableOptions> { }

export const DataTablePanel: React.FC<Props> = (props: Props) => {
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

  // Derived from boolean options — recomputed only when an option actually
  // flips. Replaces a useState+useEffect+JSON.stringify round-trip that
  // caused an extra render pass on every data update.
  const dataTableClassesEnabled = useMemo(
    () =>
      [
        'display',
        props.options.compactRowsEnabled && 'compact',
        !props.options.wrapToFitEnabled && 'nowrap',
        props.options.stripedRowsEnabled && 'stripe',
        props.options.hoverEnabled && 'hover',
        props.options.orderColumnEnabled && 'order-column',
      ].filter(Boolean) as string[],
    [
      props.options.compactRowsEnabled,
      props.options.hoverEnabled,
      props.options.orderColumnEnabled,
      props.options.stripedRowsEnabled,
      props.options.wrapToFitEnabled,
    ],
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

    // DataTables sets .dt-scroll-head height at init time (single-row thead).
    // After adding the filter row the container is too short and clips the row
    // via overflow:hidden. Update it to the actual two-row thead height.
    //
    // DataTables also clones the source thead into .dt-scroll-head but only
    // manages visibility of rows it originally created. Our injected filter
    // row is cloned with visibility:hidden inherited from the source — force
    // it visible in the clone.
    const scrollHead = (dataTable.table(0).container() as HTMLElement).querySelector<HTMLElement>('.dt-scroll-head');
    const sourceHeader = dataTable.table(0).header() as HTMLElement;
    if (scrollHead && sourceHeader) {
      scrollHead.style.height = `${sourceHeader.offsetHeight}px`;
      scrollHead.querySelectorAll<HTMLElement>('tr.column-filter').forEach(row => {
        row.style.visibility = 'visible';
      });
    }
  };

  useEffect(() => {
    if (cachedProcessedData !== undefined) {
      const calcColumnDefs = BuildColumnDefs({
        rowNumbersEnabled: props.options.rowNumbersEnabled,
        fontSizePercent: props.options.fontSizePercent,
        alignment,
        timeRange: props.timeRange,
        replaceVariables: props.replaceVariables,
        dtData: cachedProcessedData,
      });
      setCachedColumnDefs(calcColumnDefs);
    }
  }, [
    alignment,
    cachedProcessedData,
    props.timeRange,
    props.replaceVariables,
    props.options.fontSizePercent,
    props.options.rowNumbersEnabled]);

  useEffect(() => {

    if (props.data.state === LoadingState.Done) {
      if (dataFrames && dataFrames.length > 0) {
        // get timezone of dashboard or global setting
        //const useTimeZone = getTimeZone();

        let dtColumns: DTColumnType[] = [];
        let flattenedRows: FlatRow[] = [];
        const result = ConvertDataFrameToDataTableFormat({
          dataFrames,
          fieldConfig: props.fieldConfig,
          userTimeZone: props.timeZone,
          alignment,
          rowNumbersEnabled: props.options.rowNumbersEnabled,
          columnStyles: props.options.columnStylesConfig,
          theme: theme2,
          replaceVariables: props.replaceVariables,
        });
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
    // emptyDataEnabled / emptyDataText are currently unreachable at runtime
    // (see #296), so neither effect body reads them today. Kept in the deps
    // array as a placeholder for the option-B remediation that wires the
    // option into defaultContent — when that lands, this effect WILL need
    // to re-run on toggle, and the dep is ready to carry that change.
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
        // 32=title, 8=padding, 5=select padding, 44=search/length bar, 38=bottom buttons
        const calculatedHeight = props.height - 32 - 8 - 5 - 44 - 38;
        const rowsPerPage = props.options.rowsPerPage || 10;
        if (!jQuery.fn.dataTable.isDataTable(dataTableDOMRef.current)) {
          const dtOptions: Config = {
            buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
            columns: cachedProcessedData.Columns,
            columnDefs: cachedColumnDefs,
            data: cachedProcessedData.Rows,
            info: props.options.infoEnabled,
            lengthChange: props.options.lengthChangeEnabled,
            lengthMenu: (() => {
              const lengths: number[] = [5, 10, 25, 50, 75, 100, -1];
              const labels: Array<string | number> = [5, 10, 25, 50, 75, 100, 'All'];
              if (rowsPerPage > 0 && !lengths.includes(rowsPerPage)) {
                const insertAt = lengths.findIndex(len => len === -1 || len > rowsPerPage);
                lengths.splice(insertAt, 0, rowsPerPage);
                labels.splice(insertAt, 0, rowsPerPage);
              }
              return [lengths, labels];
            })(),
            pageLength: rowsPerPage,
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
            // DataTables' search feature to be enabled even when the
            // global search box is off.
            searching: props.options.searchEnabled || props.options.columnFiltersEnabled,
            layout: buildSearchBarLayout(
              props.options.searchEnabled,
              props.options.searchPosition,
            ),
            //select: selectSettings,
            stateSave: false,
            initComplete: function () {
              const api = this.api();
              // Apply hidden column styles via the DataTables API.
              // columnDefs visible:false is not reliably honoured at init time in
              // DataTables 2.x; calling column(i).visible(false) after initComplete
              // is the guaranteed path.
              //
              // No rowNumberOffset: when rowNumbersEnabled, ConvertDataFrameToDataTableFormat
              // prepends the row-number column at index 0 of cachedProcessedData.Columns,
              // so i already equals the correct DataTables column index directly.
              // Adding +1 would hide the wrong column (off-by-one).
              for (let i = 0; i < cachedProcessedData!.Columns.length; i++) {
                if (!cachedProcessedData!.Columns[i].visible) {
                  api.column(i).visible(false);
                }
              }
              if (props.options.columnFiltersEnabled) {
                enableColumnFilters(api);
              }
              // DataTables may leave scroll-head rows with visibility:hidden when
              // the panel initialises while the container has zero or reduced
              // dimensions (e.g. Grafana 12 layout pass). Explicitly reset them.
              const scrollHead = (api.table(0).container() as HTMLElement).querySelector<HTMLElement>('.dt-scroll-head');
              if (scrollHead) {
                scrollHead.querySelectorAll<HTMLElement>('thead tr').forEach(row => {
                  row.style.visibility = 'visible';
                });
              }
              // React 18+ silently ignores setState on unmounted components,
              // so no mountedRef guard is needed here.
              setDataTableReady(true);
            },
          };
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
    // See the equivalent comment on the BuildColumnDefs effect above — kept
    // in deps for the #296 option-B path that would make this effect sensitive
    // to emptyData toggles via the re-init chain through cachedColumnDefs.
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
    props.options.searchPosition,
    props.options.searchHighlightingEnabled,
    props.options.transformationAggregations,
    props.options.transformation,
  ]);

  const hasData = cachedProcessedData !== undefined && cachedColumnDefs !== undefined;
  return (
    <div
      id={dataTableWrapperId}
      className={divStyles}
      data-testid="datatable-panel-container"
    >
      {!dataTableReady && (
        <div data-testid="datatable-panel-loading">
          Loading... please wait
        </div>
      )}
      {hasData && props.data && (
        <table
          data-testid="datatable-panel-table"
          style={{ visibility: dataTableReady ? 'visible' : 'hidden' }}
          id={dataTableId}
          ref={dataTableDOMRef}
          className={dataTableClassesEnabled.join(' ')}
        />
      )}
    </div>
  );
};

const GetFlattenRows = (
  rows: NamedRow[],
  columns: DTColumnType[],
): FlatRow[] => {
  const flattenedRows: FlatRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const aRow = rows[i];
    const flattenedRow: FlatRow = [];
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const name = columns[colIndex].data as string;
      flattenedRow.push(aRow[name]);
    }
    flattenedRows.push(flattenedRow);
  }
  return flattenedRows;
};
