import { ColumnAlignment, ColumnAlignmentOptions, ColumnStyleColoring, ColumnStyleItemType, FormattedColumnValue } from 'types';
import { getCellColors } from './cellColors';

/**
 * CSS properties to apply to a METRIC-style cell.
 * Undefined means "do not set this property" — the caller must not write it.
 */
export interface MetricColors {
  color?: string;
  bgColor?: string;
}

/**
 * Resolves the CSS colors to apply to a METRIC-style cell.
 *
 * Returns null when getCellColors has no data (no thresholds configured, or
 * the style/value arguments are invalid). Callers should treat null as an
 * early-exit: do not apply colors and do not apply the alignment override.
 *
 * Color modes:
 * - Cell / RowColumn → both text color and background color on the cell.
 * - Row / Value      → text color only (row background handled by processRowStyle).
 */
export function computeMetricCellColors(
  aStyle: ColumnStyleItemType,
  cellValue: FormattedColumnValue,
): MetricColors | null {
  const colorData = getCellColors(aStyle, cellValue);
  if (!colorData) {
    return null;
  }
  const colorMode = aStyle.metricStyle.colorMode;
  const result: MetricColors = {};
  if (colorMode === ColumnStyleColoring.Cell || colorMode === ColumnStyleColoring.RowColumn) {
    if (colorData.color !== null) {
      result.color = colorData.color;
    }
    if (colorData.bgColor !== null) {
      result.bgColor = colorData.bgColor;
    }
  } else if (colorData.color) {
    // Row and Value modes: text color only.
    result.color = colorData.color;
  }
  return result;
}

/**
 * Returns the CSS text-align value to set for a per-column alignment override,
 * or null when no override should be applied.
 *
 * Guards against arbitrary strings from hand-crafted panel JSON by checking the
 * value against the known ColumnAlignmentOptions whitelist before returning it.
 * DEFAULT alignment intentionally defers to the panel-level DataTables class.
 */
export function computeCellAlignment(aStyle: ColumnStyleItemType): string | null {
  if (
    aStyle.align &&
    aStyle.align !== ColumnAlignment.DEFAULT &&
    ColumnAlignmentOptions.some((o) => o.value === aStyle.align)
  ) {
    return aStyle.align;
  }
  return null;
}
