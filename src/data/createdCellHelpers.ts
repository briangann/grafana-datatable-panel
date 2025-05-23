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
    let aColumnStyle = dtData.Columns[columnNumber].columnStyles[0];
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
      if (columnsInCellData[columnNumber].columnStyles !== null) {
        let aColumnStyle = columnsInCellData[columnNumber].columnStyles[0];
        // need the style to get the color
        if (!aColumnStyle) {
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
    // when there are no styles for a cell, apply this "worst" color value
    if (!columnsInCellData[columnNumber].columnStyles) {
      const children = $(cell.parentNode).children();
      let aChild = children[columnNumber];
      $(aChild).css('color', color);
      if (rowColor) {
        const fmtColors = 'background-color: ' + rowColor + ' !important;';
        $(aChild).children().attr('style', function (i, s) { return s + fmtColors });
      }
    }
    // a metric style will already be applied and will indicate whatever threshold is met
    // for that cell, otherwise the cell needs to worst color.
    if (columnsInCellData[columnNumber]?.columnStyles[0]?.activeStyle !== ColumnStyles.METRIC) {
      const children = $(cell.parentNode).children();
      let aChild = children[columnNumber];
      if (rowColor) {
        const fmtColors = 'background-color: ' + rowColor + ' !important;';
        $(aChild).attr('style', function (i, s) { return s + fmtColors });
      }
    }

  }
}

export const ProcessStringValueStyle = (
  columnStyle: ColumnStyleItemType | null,
  columnsInCellData: DTColumnType[],
  rowData: any,
  rowIndex: number,
  valueFormatted: FormattedColumnValue,
  timeRange: TimeRange): string | null => {

  const processedURL = ProcessClickthrough(
    columnStyle,
    columnsInCellData,
    rowData,
    rowIndex,
    valueFormatted,
    timeRange);
  if (processedURL !== undefined) {
    return processedURL;
  }
  return null;
};
