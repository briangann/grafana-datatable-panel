import { renderCell } from './columnDefCallbacks';
import { DTColumnType, DTData, FormattedColumnValue } from 'types';
import { CellMetaSettings } from 'datatables.net';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const formattedString: FormattedColumnValue = {
  valueRaw: 'alpha',
  valueFormatted: 'alpha',
  valueRounded: null,
  valueRoundedAndFormatted: null,
};
const formattedNumber: FormattedColumnValue = {
  valueRaw: 42,
  valueFormatted: '42.00',
  valueRounded: 42,
  valueRoundedAndFormatted: '42',
};
const nullCell: FormattedColumnValue = {
  valueRaw: null,
  valueFormatted: '',
  valueRounded: null,
  valueRoundedAndFormatted: null,
};

const makeColumn = (title: string, type: string): DTColumnType => ({
  title,
  data: title,
  type,
  className: '',
  columnStyles: [],
  widthHint: '',
  visible: true,
});

const dtData: DTData = {
  Columns: [
    makeColumn('name', 'string'),
    makeColumn('value', 'number'),
  ],
  Rows: [[formattedString, formattedNumber]],
};

const flatRow: Array<FormattedColumnValue | number> = [formattedString, formattedNumber];

const meta = (col: number) => ({ col } as CellMetaSettings);

// ---------------------------------------------------------------------------
// renderCell
// ---------------------------------------------------------------------------
describe('renderCell', () => {
  it('returns null when type is undefined (DataTables type-detection probe)', () => {
    expect(renderCell(dtData, null, undefined, flatRow, meta(0))).toBeNull();
  });

  it('returns null when column index is out of bounds', () => {
    expect(renderCell(dtData, null, 'display', flatRow, meta(99))).toBeNull();
  });

  it('returns valueRaw for type=sort (DataTables sorts on the raw value)', () => {
    expect(renderCell(dtData, null, 'sort', flatRow, meta(1))).toBe(42);
  });

  it('returns valueFormatted for type=filter (WYSIWYG: filter against what user sees)', () => {
    expect(renderCell(dtData, null, 'filter', flatRow, meta(1))).toBe('42.00');
  });

  it('returns valueFormatted for type=display', () => {
    expect(renderCell(dtData, null, 'display', flatRow, meta(1))).toBe('42.00');
  });

  it('returns the whole FormattedColumnValue object for type=type', () => {
    expect(renderCell(dtData, null, 'type', flatRow, meta(1))).toBe(formattedNumber);
  });

  it('returns raw cell value when it is a plain number (rowNumber column)', () => {
    const rowWithNumber = [7, formattedNumber];
    expect(renderCell(dtData, null, 'display', rowWithNumber, meta(0))).toBe(7);
  });

  it('returns valueFormatted for type=display on a string column', () => {
    expect(renderCell(dtData, null, 'display', flatRow, meta(0))).toBe('alpha');
  });

  // Shared fixture: null rawValue — valueFormatted='' is falsy (regression guard).
  const rowWithNull = [nullCell, formattedNumber];

  it('returns "" for type=display when valueFormatted is empty (null rawValue)', () => {
    expect(renderCell(dtData, null, 'display', rowWithNull, meta(0))).toBe('');
  });

  it('returns null valueRaw for type=sort when valueFormatted is empty (null rawValue)', () => {
    expect(renderCell(dtData, null, 'sort', rowWithNull, meta(0))).toBeNull();
  });

  it('returns "" for type=filter when valueFormatted is empty (null rawValue)', () => {
    expect(renderCell(dtData, null, 'filter', rowWithNull, meta(0))).toBe('');
  });
});
