import { DTData } from "components/DataTablePanel";
import { ColumnStyleType } from "types";
import { getCellColors } from "./dataHelpers";
import { DTColumnType } from "./types";
import { ProcessClickthrough } from "./cellRenderer";
import { ColumnStyleItemType } from "components/options/columnstyles/types";
import { TimeRange } from "@grafana/data";


export const processRowStyle = (
  cell: any,
  rowData: any,
  dtData: DTData,
  rowNumberOffset: number) => {

  let rowColorIndex = -1;
  let rowColorData = null;
  let rowColor = null;
  // this should be configurable...
  let color = 'white';

  for (let columnNumber = 0; columnNumber < dtData.Columns.length; columnNumber++) {
    let aColumnStyle = dtData.Columns[columnNumber].columnStyle;
    // need the style to get the color
    if (!aColumnStyle) {
      // no style set, skip
      continue;
    }
    // only process color values for numbers
    if (aColumnStyle.styleItemType !== ColumnStyleType.Metric) {
      continue;
    }
    rowColorData = getCellColors(
      aColumnStyle,
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
  // style the entire row (the parent of the td is the tr)
  const fmtColors = 'color: ' + color + ' !important;' +
    'background-color: ' + rowColor + ' !important;';
  $(cell.parentNode)
    .children()
    .attr('style', function (i, s) { return s + fmtColors });

}

export const processRowColumnStyle = (
  cell: any,
  rowData: any,
  columnsInCellData: DTColumnType[],
  rowNumbersEnabled: boolean,
  rowNumberOffset: number) => {

  let rowColorIndex = -1;
  let rowColorData = null;
  let rowColor = null;
  // this should be configurable...
  let color = 'white';
  for (let columnNumber = 0; columnNumber < columnsInCellData.length; columnNumber++) {
    if (columnsInCellData[columnNumber].type === undefined) {
      if (columnsInCellData[columnNumber].columnStyle !== null) {
        let aColumnStyle = columnsInCellData[columnNumber].columnStyle;
        // need the style to get the color
        if (!aColumnStyle) {
          continue;
        }
        // only process color values for numbers
        if (aColumnStyle.styleItemType !== ColumnStyleType.Metric) {
          continue;
        }
        rowColorData = getCellColors(
          columnsInCellData[columnNumber].columnStyle!,
          columnNumber,
          rowData[columnNumber + rowNumberOffset]
        );
      }
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
  if (columnsInCellData[0].type !== undefined) {
    const children = $(cell.parentNode).children();
    let aChild = children[0];
    $(aChild).css('color', color);
    if (rowColor) {
      $(aChild).css('background-color', rowColor);
    }
    // the 0 column contains the row number, if they are enabled
    // then the above just filled in the color for the row number,
    // now take care of the timestamp
    if (rowNumbersEnabled) {
      aChild = children[1];
      $(aChild).css('color', color);
      if (rowColor) {
        $(aChild).css('background-color', rowColor);
      }
    }
  }

}

export const ProcessStringValueStyle = (
  columnStyle: ColumnStyleItemType|null,
  columnsInCellData: DTColumnType[],
  rowData: any,
  rowIndex: number,
  value: any,
  timeRange: TimeRange): string|null => {
  // eslint-disable-next-line no-debugger
  debugger;
  const clickThrough = ProcessClickthrough(columnStyle, columnsInCellData, rowData, rowIndex, value, timeRange);
  if (clickThrough !== undefined) {
    return clickThrough;
  }
  return null;
};
