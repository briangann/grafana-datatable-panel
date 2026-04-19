import { ColumnStyleColoring, ColumnStyleItemType, ColumnStyles } from 'types';
import { FormattedColumnValue } from '../types';

export const getCellColors = (aColumnStyle: ColumnStyleItemType | null, cellData: FormattedColumnValue) => {
  if (aColumnStyle === null || cellData === null || cellData === undefined) {
    return null;
  }
  // only color cell if the content is a number
  if (aColumnStyle.activeStyle !== ColumnStyles.METRIC) {
    return null;
  }
  let bgColor = null;
  let bgColorIndex = null;
  let color = null;
  let colorIndex = null;

  if (aColumnStyle && aColumnStyle.metricStyle.colorMode != null && aColumnStyle.metricStyle.thresholds.length > 0) {
    // check color for either cell or row
    if (aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.Cell ||
      aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.Row ||
      aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.RowColumn) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        bgColor = GetColorForValue(cellData.valueRaw as number, aColumnStyle);
        bgColorIndex = GetColorIndexForValue(cellData.valueRaw as number, aColumnStyle);
      }
      color = 'white';
    }
    // just the value color is set
    if (aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.Value) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        color = GetColorForValue(cellData.valueRaw as number, aColumnStyle);
        colorIndex = GetColorIndexForValue(cellData.valueRaw as number, aColumnStyle);
      }
    }
  }
  return {
    bgColor: bgColor,
    bgColorIndex: bgColorIndex,
    color: color,
    colorIndex: colorIndex,
  };
};

export const GetColorForValue = (value: number, style: ColumnStyleItemType) => {
  if (!style.metricStyle.thresholds) {
    return null;
  }
  let color = style.metricStyle.thresholds[0].color;
  for (let i = style.metricStyle.thresholds.length - 1; i > 0; i--) {
    const checkValue = style.metricStyle.thresholds[i].value;
    if (value >= checkValue) {
      color = style.metricStyle.thresholds[i].color;
      // found highest match
      break;
    }
  }
  return color;
};

// to determine the overall row color, the index of the threshold is needed
export const GetColorIndexForValue = (value: any, style: any) => {
  if (!style.metricStyle.thresholds) {
    return null;
  }
  let colorIndex = 0;
  for (let i = style.metricStyle.thresholds.length - 1; i > 0; i--) {
    if (value >= style.metricStyle.thresholds[i].value) {
      colorIndex = i;
      break;
    }
  }
  return colorIndex;
};
