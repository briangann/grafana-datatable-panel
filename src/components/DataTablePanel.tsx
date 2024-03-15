import jQuery from 'jquery';
import 'datatables.net';

import { PanelProps } from '@grafana/data';
import { useApplyTransformation } from 'hooks/useApplyTransformation';
import React, { useEffect, useRef } from 'react';
import { SimpleOptions } from 'types';
import { dataFrameToDataTableFormat } from 'dataHelpers';
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

  useEffect(() => {
    if (dataTableDOMRef.current && columns.length > 0) {
      if (!jQuery.fn.dataTable.isDataTable(dataTableDOMRef.current)) {
        jQuery(dataTableDOMRef.current).DataTable({
          columns,
          data: rows,
          scrollY: `${height}px`,
          scrollX: true,
          pageLength: 80,
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
  }, [columns, height, rows]);

  return (
    <div className="resizer">
      <table id={dataTableId} ref={dataTableDOMRef}></table>
    </div>
  );
};
