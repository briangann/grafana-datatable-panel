import { DTData } from "components/DataTablePanel";
import { getCellColors } from "./dataHelpers";
import { DTColumnType, FormattedColumnValue } from "./types";
import { ProcessClickthrough } from "./cellRenderer";
import { ColumnStyleItemType, ColumnStyles } from "components/options/columnstyles/types";
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
    if (aColumnStyle.activeStyle !== ColumnStyles.METRIC) {
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
    if (columnsInCellData[columnNumber].type !== undefined) {
      if (columnsInCellData[columnNumber].columnStyle !== null) {
        let aColumnStyle = columnsInCellData[columnNumber].columnStyle;
        // need the style to get the color
        if (!aColumnStyle) {
          continue;
        }
        // only process color values for numbers
        if (aColumnStyle.activeStyle !== ColumnStyles.METRIC) {
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

  for (let columnNumber = 0; columnNumber < columnsInCellData.length; columnNumber++) {
    if (!columnsInCellData[columnNumber].columnStyle) {
      const children = $(cell.parentNode).children();
      let aChild = children[columnNumber];
      $(aChild).css('color', color);
      if (rowColor) {
        // ugly but it works..
        $(aChild)[0].style.setProperty('background-color', rowColor, 'important');
      }
    }
  }
}

export const ProcessStringValueStyle = (
  columnStyle: ColumnStyleItemType | null,
  columnsInCellData: DTColumnType[],
  rowData: any,
  valueFormatted: FormattedColumnValue,
  timeRange: TimeRange): string | null => {

  const processedURL = ProcessClickthrough(
    columnStyle,
    columnsInCellData,
    rowData,
    valueFormatted,
    timeRange);
  if (processedURL !== undefined) {
    return processedURL;
  }
  return null;
};
