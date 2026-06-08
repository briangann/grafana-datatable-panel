import { getCellColors } from "./cellColors";
import { ColumnStyleItemType, ColumnStyles, DTColumnType, FlatRow, FormattedColumnValue } from "types";
import { ProcessClickthrough } from "./cellRenderer";
import { InterpolateFunction, TimeRange } from "@grafana/data";



export const processRowColumnStyle = (
  cell: HTMLElement,
  rowData: FlatRow,
  columnsInCellData: DTColumnType[]) => {

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
          rowData[columnNumber] as FormattedColumnValue
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
      const children = $(cell.parentNode as HTMLElement).children();
      const aChild = children[columnNumber];
      $(aChild).css('color', color);
      if (rowColor) {
        const fmtColors = 'background-color: ' + rowColor + ' !important;';
        $(aChild).children().attr('style', (_i: number, s: string) => s + fmtColors);
      }
    }
    // a metric style will already be applied and will indicate whatever threshold is met
    // for that cell, otherwise the cell needs to worst color.
    if (columnsInCellData[columnNumber]?.columnStyles[0]?.activeStyle !== ColumnStyles.METRIC) {
      const children = $(cell.parentNode as HTMLElement).children();
      const aChild = children[columnNumber];
      if (rowColor) {
        const fmtColors = 'background-color: ' + rowColor + ' !important;';
        $(aChild).attr('style', (_i: number, s: string) => s + fmtColors);
      }
    }

  }
}

export const ProcessStringValueStyle = (
  columnStyle: ColumnStyleItemType | null,
  rowData: FlatRow,
  valueFormatted: FormattedColumnValue,
  timeRange: TimeRange,
  replaceVariables: InterpolateFunction): string | null => {

  const processedURL = ProcessClickthrough(
    columnStyle,
    rowData as unknown as FormattedColumnValue[],
    valueFormatted,
    timeRange,
    replaceVariables);
  if (processedURL !== undefined) {
    return processedURL;
  }
  return null;
};
