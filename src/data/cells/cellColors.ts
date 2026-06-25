import { ColumnStyleColoring, ColumnStyleItemType, ColumnStyles, FormattedColumnValue } from 'types';

// text color overlaid on a colored cell background; white is chosen for contrast against the threshold palette
const CELL_TEXT_ON_BG = 'white';

// Single threshold scan returning both color and index. Callers that need
// both values (getCellColors) use this to avoid scanning the array twice.
export const GetColorAndIndexForValue = (
  value: number,
  style: ColumnStyleItemType,
): { color: string | null; colorIndex: number } => {
  const thresholds = style.metricStyle.thresholds;
  if (!thresholds) {
    return { color: null, colorIndex: 0 };
  }
  let color = thresholds[0].color;
  let colorIndex = 0;
  for (let i = thresholds.length - 1; i > 0; i--) {
    if (value >= thresholds[i].value) {
      color = thresholds[i].color;
      colorIndex = i;
      break;
    }
  }
  return { color, colorIndex };
};

export const getCellColors = (aColumnStyle: ColumnStyleItemType | null, cellData: FormattedColumnValue) => {
  if (aColumnStyle === null || cellData === null || cellData === undefined) {
    return null;
  }
  if (aColumnStyle.activeStyle !== ColumnStyles.METRIC) {
    return null;
  }
  let bgColor = null;
  let bgColorIndex = null;
  let color = null;
  let colorIndex = null;

  if (aColumnStyle.metricStyle.colorMode != null && aColumnStyle.metricStyle.thresholds.length > 0) {
    if (aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.Cell ||
      aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.Row ||
      aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.RowColumn) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        const result = GetColorAndIndexForValue(cellData.valueRaw as number, aColumnStyle);
        bgColor = result.color;
        bgColorIndex = result.colorIndex;
      }
      color = CELL_TEXT_ON_BG;
    }
    if (aColumnStyle.metricStyle.colorMode === ColumnStyleColoring.Value) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        const result = GetColorAndIndexForValue(cellData.valueRaw as number, aColumnStyle);
        color = result.color;
        colorIndex = result.colorIndex;
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
      break;
    }
  }
  return color;
};

// to determine the overall row color, the index of the threshold is needed
export const GetColorIndexForValue = (value: number, style: ColumnStyleItemType) => {
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
