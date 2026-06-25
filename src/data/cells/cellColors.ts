import { ColumnStyleColoring, ColumnStyleItemType, ColumnStyles, FormattedColumnValue } from 'types';

// text color overlaid on a colored cell background; white is chosen for contrast against the threshold palette
const CELL_TEXT_ON_BG = 'white';

// Single threshold scan returning both color and index. All other color
// lookups delegate here so the scan logic lives in exactly one place.
export const GetColorAndIndexForValue = (
  value: number,
  style: ColumnStyleItemType,
): { color: string | null; colorIndex: number } => {
  const thresholds = style.metricStyle.thresholds;
  if (!thresholds || thresholds.length === 0) {
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

  const { colorMode, thresholds } = aColumnStyle.metricStyle;
  if (colorMode != null && thresholds.length > 0) {
    if (colorMode === ColumnStyleColoring.Cell ||
      colorMode === ColumnStyleColoring.Row ||
      colorMode === ColumnStyleColoring.RowColumn) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        const result = GetColorAndIndexForValue(cellData.valueRaw as number, aColumnStyle);
        bgColor = result.color;
        bgColorIndex = result.colorIndex;
      }
      color = CELL_TEXT_ON_BG;
    }
    if (colorMode === ColumnStyleColoring.Value) {
      if (cellData.valueRaw !== null && !isNaN(cellData.valueRaw as number)) {
        const result = GetColorAndIndexForValue(cellData.valueRaw as number, aColumnStyle);
        color = result.color;
        colorIndex = result.colorIndex;
      }
    }
  }
  return { bgColor, bgColorIndex, color, colorIndex };
};

// Delegates to GetColorAndIndexForValue — scan logic lives in one place.
export const GetColorForValue = (value: number, style: ColumnStyleItemType) =>
  GetColorAndIndexForValue(value, style).color;

// to determine the overall row color, the index of the threshold is needed.
// Delegates to GetColorAndIndexForValue — scan logic lives in one place.
export const GetColorIndexForValue = (value: number, style: ColumnStyleItemType) =>
  GetColorAndIndexForValue(value, style).colorIndex;
