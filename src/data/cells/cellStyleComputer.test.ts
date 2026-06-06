import { computeCellAlignment, computeMetricCellColors } from './cellStyleComputer';
import {
  ColumnAlignment,
  ColumnStyleColoring,
  ColumnStyleItemType,
  ColumnStyles,
  FormattedColumnValue,
  Threshold,
} from 'types';

// ---------------------------------------------------------------------------
// Typed fixtures — no any/as any
// ---------------------------------------------------------------------------

/** Build a minimal but fully-typed METRIC ColumnStyleItemType. */
function makeMetricStyle(colorMode: ColumnStyleColoring, thresholds: Threshold[] = []): ColumnStyleItemType {
  return {
    activeStyle: ColumnStyles.METRIC,
    enabled: true,
    label: '',
    nameOrRegex: '',
    order: 0,
    align: ColumnAlignment.DEFAULT,
    dateStyle: {},
    hiddenStyle: {},
    metricStyle: {
      alias: '',
      thresholds,
      colors: [],
      colorMode,
      decimals: '2',
      scaledDecimals: null,
      unitFormat: 'short',
      ignoreNullValues: false,
    },
    stringStyle: {
      clickThrough: '',
      clickThroughSanitize: false,
      clickThroughOpenNewTab: false,
      clickThroughCustomTargetEnabled: false,
      clickThroughCustomTarget: '',
      splitByPattern: '',
    },
  };
}

/** One threshold at value=0, color='red'. With value=50, GetColorForValue returns 'red'. */
const ONE_THRESHOLD: Threshold[] = [{ value: 0, color: 'red', state: 0 }];

function makeCellValue(valueRaw: number): FormattedColumnValue {
  return { valueRaw, valueFormatted: String(valueRaw), valueRounded: valueRaw, valueRoundedAndFormatted: String(valueRaw) };
}

// ---------------------------------------------------------------------------
// computeMetricCellColors
// ---------------------------------------------------------------------------
describe('computeMetricCellColors', () => {
  const cell = makeCellValue(50);

  it('Cell mode — color (white) and bgColor (threshold color) both set', () => {
    const result = computeMetricCellColors(makeMetricStyle(ColumnStyleColoring.Cell, ONE_THRESHOLD), cell);
    expect(result).toEqual({ color: 'white', bgColor: 'red' });
  });

  it('RowColumn mode — both color and bgColor set (same as Cell; row bg handled by processRowColumnStyle)', () => {
    const result = computeMetricCellColors(makeMetricStyle(ColumnStyleColoring.RowColumn, ONE_THRESHOLD), cell);
    expect(result).toEqual({ color: 'white', bgColor: 'red' });
  });

  it('Row mode — text color only; bgColor absent (row bg handled by processRowStyle)', () => {
    const result = computeMetricCellColors(makeMetricStyle(ColumnStyleColoring.Row, ONE_THRESHOLD), cell);
    expect(result.color).toBe('white');
    expect(result.bgColor).toBeUndefined();
  });

  it('Value mode — threshold color used as text color; no bgColor', () => {
    const result = computeMetricCellColors(makeMetricStyle(ColumnStyleColoring.Value, ONE_THRESHOLD), cell);
    expect(result.color).toBe('red');
    expect(result.bgColor).toBeUndefined();
  });

  it('No thresholds — returns empty MetricColors (getCellColors returns object with all nulls)', () => {
    const result = computeMetricCellColors(makeMetricStyle(ColumnStyleColoring.Cell, []), cell);
    // getCellColors returns a truthy object even with no thresholds; neither color
    // nor bgColor can be resolved, so the descriptor is empty rather than null.
    expect(result).toEqual({});
  });

  it('Disabled mode — returns empty MetricColors (no color mode matched)', () => {
    const result = computeMetricCellColors(makeMetricStyle(ColumnStyleColoring.Disabled, ONE_THRESHOLD), cell);
    expect(result).toEqual({});
  });

  it('higher-priority threshold takes effect when value exceeds it', () => {
    const thresholds: Threshold[] = [
      { value: 0, color: 'green', state: 0 },
      { value: 80, color: 'red', state: 2 },
    ];
    // value=90 exceeds threshold[1].value=80, so red is chosen.
    const result = computeMetricCellColors(
      makeMetricStyle(ColumnStyleColoring.Cell, thresholds),
      makeCellValue(90),
    );
    expect(result.bgColor).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// computeCellAlignment
// ---------------------------------------------------------------------------
describe('computeCellAlignment', () => {
  /** Build a style with a specific alignment, reusing a METRIC base for other required fields. */
  function makeStyle(align?: ColumnAlignment): ColumnStyleItemType {
    return { ...makeMetricStyle(ColumnStyleColoring.Cell), align };
  }

  it('LEFT → "left"', () => {
    expect(computeCellAlignment(makeStyle(ColumnAlignment.LEFT))).toBe('left');
  });

  it('CENTER → "center"', () => {
    expect(computeCellAlignment(makeStyle(ColumnAlignment.CENTER))).toBe('center');
  });

  it('RIGHT → "right"', () => {
    expect(computeCellAlignment(makeStyle(ColumnAlignment.RIGHT))).toBe('right');
  });

  it('DEFAULT → null (defers to panel-level DataTables class)', () => {
    expect(computeCellAlignment(makeStyle(ColumnAlignment.DEFAULT))).toBeNull();
  });

  it('undefined align → null', () => {
    expect(computeCellAlignment(makeStyle(undefined))).toBeNull();
  });

  it('value not in ColumnAlignmentOptions whitelist → null (injection guard)', () => {
    // The whitelist prevents hand-crafted panel JSON from injecting arbitrary CSS values.
    expect(computeCellAlignment(makeStyle('inject' as ColumnAlignment))).toBeNull();
  });
});
