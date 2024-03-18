import jQuery from 'jquery';
import 'datatables.net';

import { PanelProps } from '@grafana/data';
import { useApplyTransformation } from 'hooks/useApplyTransformation';
import React, { useEffect, useRef } from 'react';
import { SimpleOptions } from 'types';
import { dataFrameToDataTableFormat } from 'dataHelpers';
import '../css/datatables.css';
interface Props extends PanelProps<SimpleOptions> {}

export const DataTablePanel: React.FC<Props> = (props: Props) => {
  const { data, height } = props;
  console.log('Current height', height);

  const dataTableId = `data-table-renderer-${props.id}`;

  const dataTableDOMRef = useRef<HTMLTableElement>(null);
  //TODO actually pass what transformations to use from the options
  //currently simply doing a join by field (series to columns)
  const dataFrames = useApplyTransformation(data.series);
  const { columns, rows } = (dataFrames && dataFrameToDataTableFormat(dataFrames)) || { columns: [], rows: [] };

  // actually render the table
  useEffect(() => {
    if (dataTableDOMRef.current && columns.length > 0) {
      if (!jQuery.fn.dataTable.isDataTable(dataTableDOMRef.current)) {
        jQuery(dataTableDOMRef.current).DataTable({
          columns,
          data: rows,
          //TODO these hardcoded height values come from observing the elements datatable creates
          // the scroll Y you pass will be the data part of the table itself, datatable will
          // create all the headers, pagination, etc... and it will not consider it into the
          // final height calculation. So we need to exclude it.
          // this blogpost might have a better way to achieve this
          // https://datatables.net/blog/2017/vertical-scroll-fitting
          // leaving it here for now while I move on
          scrollY: `${height - 32 - 42 - 43}px`,
          scrollCollapse: false,
          search: {
            regex: true,
            smart: false,
          },
          lengthMenu: [
            [5, 10, 25, 50, 75, 100, -1],
            [5, 10, 25, 50, 75, 100, 'All'],
          ],
        });
      }
    }
    const currentDom = dataTableDOMRef.current;

    // make sure we clean up on unmount
    return () => {
      if (currentDom && jQuery.fn.dataTable.isDataTable(currentDom)) {
        jQuery(currentDom).DataTable().destroy();
      }
    };
  }, [columns, height, rows]);

  return (
    <div className="resizer">
      <table id={dataTableId} ref={dataTableDOMRef}></table>
    </div>
  );
};
