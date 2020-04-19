const colorModes = [
  {
    text: 'Disabled',
    value: null,
  },
  {
    text: 'Cell',
    value: 'cell',
  },
  {
    text: 'Value',
    value: 'value',
  },
  {
    text: 'Row',
    value: 'row',
  },
  {
    text: 'Row Column',
    value: 'rowcolumn',
  },
];

const panelDefaults = {
  targets: [{}],
  transform: 'timeseries_to_columns',
  rowsPerPage: 5,
  showHeader: true,
  styles: [
    {
      type: 'date',
      pattern: 'Time',
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      unit: 'short',
      type: 'number',
      decimals: 2,
      colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
      colorMode: null,
      pattern: '/.*/',
      thresholds: [],
    },
  ],
  columns: [],
  scroll: false,
  scrollHeight: 'default',
  fontSize: '100%',
  sort: {
    col: 0,
    desc: true,
  },
  columnAliases: [],
  columnWidthHints: [],
  sortByColumnsData: [[0, 'desc']],
  sortByColumns: [
    {
      columnData: 0,
      sortMethod: 'desc',
    },
  ],
  datatableTheme: 'basic_theme',
  themeOptions: {
    light: './styles/light.scss',
    dark: './styles/dark.scss',
  },
  rowNumbersEnabled: false,
  infoEnabled: true,
  searchEnabled: true,
  showCellBorders: false,
  showRowBorders: true,
  hoverEnabled: true,
  orderColumnEnabled: true,
  compactRowsEnabled: false,
  stripedRowsEnabled: true,
  lengthChangeEnabled: true,
  datatablePagingType: 'simple_numbers',
  pagingTypes: [
    {
      text: 'Page number buttons only',
      value: 'numbers',
    },
    {
      text: "'Previous' and 'Next' buttons only",
      value: 'simple',
    },
    {
      text: "'Previous' and 'Next' buttons, plus page numbers",
      value: 'simple_numbers',
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons",
      value: 'full',
    },
    {
      text: "'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers",
      value: 'full_numbers',
    },
    {
      text: "'First' and 'Last' buttons, plus page numbers",
      value: 'first_last_numbers',
    },
  ],
  themes: [
    {
      value: 'basic_theme',
      text: 'Basic',
      disabled: false,
    },
    {
      value: 'bootstrap_theme',
      text: 'Bootstrap',
      disabled: true,
    },
    {
      value: 'foundation_theme',
      text: 'Foundation',
      disabled: true,
    },
    {
      value: 'themeroller_theme',
      text: 'ThemeRoller',
      disabled: true,
    },
  ],
};

const columnStyleDefaults = {
  unit: 'short',
  type: 'number',
  decimals: 2,
  colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
  colorMode: null,
  pattern: '/.*/',
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  thresholds: [],
  mappingType: 1,
};

const dateFormats = [
  {
    text: 'YYYY-MM-DD HH:mm:ss',
    value: 'YYYY-MM-DD HH:mm:ss',
  },
  {
    text: 'MM/DD/YY h:mm:ss a',
    value: 'MM/DD/YY h:mm:ss a',
  },
  {
    text: 'MMMM D, YYYY LT',
    value: 'MMMM D, YYYY LT',
  },
];

const columnTypes = [
  {
    text: 'Number',
    value: 'number',
  },
  {
    text: 'String',
    value: 'string',
  },
  {
    text: 'Date',
    value: 'date',
  },
  {
    text: 'Hidden',
    value: 'hidden',
  },
];

const fontSizes = ['80%', '90%', '100%', '110%', '120%', '130%', '150%', '160%', '180%', '200%', '220%', '250%'];

export { colorModes, columnTypes, dateFormats, panelDefaults, columnStyleDefaults, fontSizes };
