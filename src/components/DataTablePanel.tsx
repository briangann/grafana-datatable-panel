//import jszip from 'jszip';
//import pdfmake from 'pdfmake';
//import DataTable, { Config, ConfigColumns } from 'datatables.net-dt';
import { Config, ConfigColumnDefs, ConfigColumns } from 'datatables.net-dt';
import 'datatables.net-buttons-dt';
import 'datatables.net-buttons/js/buttons.html5.mjs';
import 'datatables.net-buttons/js/buttons.print.mjs';
import 'datatables.net-fixedcolumns-dt';
import 'datatables.net-fixedheader-dt';
import 'datatables.net-keytable-dt';
import 'datatables.net-scroller-dt';
import 'datatables.net-searchpanes-dt';


// might not need this now!
//import 'datatables.net-dt/css/dataTables.dataTables.min.css';

//import 'datatables.net/js/dataTables.min';

//OLD!!
//import 'datatables.net-plugins/features/pageResize/dataTables.pageResize';
//import 'datatables.net-plugins/features/scrollResize/dataTables.scrollResize.min';
//import 'datatables.net-plugins/features/scrollResize/dataTables.scrollResize';
//import 'datatables.net-plugins/css/dataTables.scrollResize.min.css';
//import 'mark.js';
//import 'datatables.mark.js';
//import 'datatables.net-plugins/features/scrollResize/dataTables.scrollResize.js';

import { PanelProps } from '@grafana/data';
import { useApplyTransformation } from 'hooks/useApplyTransformation';
import React, { useEffect, useRef, useState } from 'react';
import { DatatableOptions } from 'types';
import { buildColumnDefs, dataFrameToDataTableFormat } from 'dataHelpers';
//TODO many more css files missing
//import '../css/datatables.css';
import { getDatatableThemedStyles } from './styles';
import { useStyles2 } from '@grafana/ui';

interface Props extends PanelProps<DatatableOptions> { }

export const DataTablePanel: React.FC<Props> = (props: Props) => {

  const [dataTableClassesEnabled, setDatatableClassesEnabled] = useState<string[]>([]);
  const divStyles = useStyles2(getDatatableThemedStyles);
  const dataTableDOMRef = useRef<HTMLTableElement>(null);

  const dataTableWrapperId = `data-table-wrapper-${props.id}`;
  const dataTableId = `data-table-renderer-${props.id}`;

  //TODO actually pass what transformations to use from the options
  //currently simply doing a join by field (series to columns)
  //const { columns, rows } = (dataFrames && dataFrameToDataTableFormat(dataFrames)) || { columns: [], rows: [] };
  //let rowNumberOffset = 0;

  const dataFrames = useApplyTransformation(props.data.series);

  /*
  setDatatableClassesEnabled([
    "display",
    "hover",
    "nowrap",
    "compact"]);
    */
  // compute actual table
  // if panel has a title and is displayed, uses 32px
  // if paging selector is present, it uses 32px
  // search uses 34px (same position as paging selector)
  // bottom paging buttons use 38px
  // showing XofX uses 22, same placement as paging buttons
  useEffect(() => {
    let enabledClasses = ['display'];
    if (props.options.compactRowsEnabled) {
      enabledClasses.push("compact");
    }
    if (props.options.hoverEnabled) {
      enabledClasses.push('hover');
    }
    if (!props.options.wrapToFitEnabled) {
      enabledClasses.push("nowrap");
    }
    if (props.options.orderColumnEnabled) {
      enabledClasses.push('order-column');
    }
    // TODO: these two are mutually exclusive
    if (props.options.showCellBordersEnabled) {
      enabledClasses.push('cell-border');
    }
    if (props.options.showRowBordersEnabled) {
      enabledClasses.push('row-border');
    }
    if (props.options.stripedRowsEnabled) {
      enabledClasses.push('stripe');
    }

    setDatatableClassesEnabled(enabledClasses);
    console.log('set table classes done!');
  }, [
    dataTableClassesEnabled,
    props.options.compactRowsEnabled,
    props.options.hoverEnabled,
    props.options.orderColumnEnabled,
    props.options.showCellBordersEnabled,
    props.options.showRowBordersEnabled,
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

//    setDatatableClassesEnabled({ ...dataTableClassesEnabled, enabledClasses });

    let columns: ConfigColumns[] = [];
    let columnDefs: ConfigColumnDefs[] = [];
    let rows: any[] = [];
    if (dataFrames && dataFrames.length > 0) {
      const result = dataFrameToDataTableFormat(props.options.rowNumbersEnabled, dataFrames);
      columns = result.columns;
      rows = result.rows;
      columnDefs = buildColumnDefs(
        props.options.rowNumbersEnabled,
        props.options.fontSizePercent,
        props.options.alignNumbersToRightEnabled,
        columns,
        rows);
    }

    if (dataTableDOMRef.current && columns.length > 0) {
      try {
          // cleanup existing table, columns may have changed
          const aDT = $(dataTableDOMRef.current).DataTable();
          aDT.destroy();
          $(dataTableDOMRef.current).empty();
      } catch (err) {
        // @ts-ignore
        console.log('Exception: ' + err.message);
      }
      const calculatedHeight = getDatatableHeight(props.height);
      if (!jQuery.fn.dataTable.isDataTable(dataTableDOMRef.current)) {
        //const dtOptions: Config = {
        const dtOptions: any = {
          //buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
          columns: columns,
          columnDefs: columnDefs,
          data: rows,
          info: props.options.infoEnabled,
          lengthChange: props.options.lengthChangeEnabled,
          lengthMenu: [
            [5, 10, 25, 50, 75, 100, -1],
            [5, 10, 25, 50, 75, 100, 'All'],
          ],
          //mark: props.options.searchHighlightingEnabled || false,
          //order: orderSetting,
          //TODO these hardcoded height values come from observing the elements datatable creates
          // the scroll Y you pass will be the data part of the table itself, datatable will
          // create all the headers, pagination, etc... and it will not consider it into the
          // final height calculation. So we need to exclude it.
          // this blogpost might have a better way to achieve this
          // https://datatables.net/blog/2017/vertical-scroll-fitting
          // leaving it here for now while I move on
          //scroll: props.options.scroll,
          scroll: props.options.scroll,
          paging: !props.options.scroll,
          scrollY: `${calculatedHeight}px`,
          pagingType: props.options.datatablePagingType,
          scrollCollapse: false,
          scrollX: true,
          search: {
            regex: true,
            smart: false,
          },
          searching: true, //props.options.searchEnabled,
          //select: selectSettings,
          stateSave: false,
        };
        jQuery(dataTableDOMRef.current).DataTable(dtOptions as Config);
      }
    }
    const currentDom = dataTableDOMRef.current;

    // make sure we clean up on unmount
    return () => {
      if (currentDom && jQuery.fn.dataTable.isDataTable(currentDom)) {
        jQuery(currentDom).DataTable().destroy();
      }
    };
  }, [
    dataFrames,
    dataTableClassesEnabled,
    props.height,
    props.options.alignNumbersToRightEnabled,
    props.options.datatablePagingType,
    props.options.fontSizePercent,
    props.options.infoEnabled,
    props.options.lengthChangeEnabled,
    props.options.orderColumnEnabled,
    props.options.rowNumbersEnabled,
    props.options.scroll]);

  /*
  <div className={divStyles} style={{
      width: '100%',
      height: props.height,
    }}>
  */
  return (
    <div id={dataTableWrapperId} className={divStyles}>
      {props.data &&
        <table
          id={dataTableId}
          ref={dataTableDOMRef}
          className={dataTableClassesEnabled.join(' ')}
          width="100%">
        </table>
      }
    </div>
  );
};
