import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';

export const datatableThemedStyles = (theme: GrafanaTheme2) =>
  css({
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    'table.dataTable.hover tbody tr:hover > *': {
      backgroundColor: theme.isDark ? 'rgb(72, 72, 72) !important' : 'rgb(202,202,202) !important',
    },
    'table.dataTable.stripe > tbody > tr:nth-child(odd) > *': {
      backgroundColor: theme.isDark ? 'rgb(42, 42, 42)' : 'rgb(222,222,222)',
    },
    'table.dataTable.order-column > tbody tr > .sorting_1, \
      table.dataTable.order-column > tbody tr > .sorting_2, \
      table.dataTable.order-column > tbody tr > .sorting_3': {
      backgroundColor: theme.isDark ? 'rgb(30, 30, 30) !important' : 'rgb(182,182,182) !important',
    },
    'table.dataTable.order-column tbody tr.selected > .sorting_1, \
      table.dataTable.order-column tbody tr.selected > .sorting_2, \
      table.dataTable.order-column tbody tr.selected > .sorting_3, \
      table.dataTable.display tbody tr.selected > .sorting_1, \
      table.dataTable.display tbody tr.selected > .sorting_2, \
      table.dataTable.display tbody tr.selected > .sorting_3': {
        backgroundColor: theme.isDark ? '#232121' : '#f5f5f5',
    },
    'div.dt-container .dt-paging .dt-paging-button.disabled, \
      div.dt-container .dt-paging .dt-paging-button.disabled:hover, \
      div.dt-container .dt-paging .dt-paging-button.disabled:active': {
        cursor: 'default',
        color: theme.isDark ? 'rgb(82, 82, 82) !important' : 'rgb(202,202,202) !important',
        border: '1px solid transparent',
        background: 'transparent',
        boxShadow: 'none',
    },
    'div.dt-container': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '0 6px',
    },
    'div.dt-container div.dt-layout-row': {
      margin: '6px 0',
    },
    'div.dt-container div.dt-layout-row.dt-layout-table': {
      flex: 1,
      minHeight: 0,
    },
    // Upstream provides border/borderRadius/padding/backgroundColor/color for
    // .dt-input and .dt-search input; we only add the plugin-specific sizing.
    'div.dt-container .dt-input': {
      marginRight: '5px',
      height: '30px',
      width: '65px',
    },
    'div.dt-container .dt-search input': {
      width: '150px',
    },
    'div.dt-container .dt-paging .dt-paging-button.current, \
      div.dt-container .dt-paging .dt-paging-button.current:hover': {
        color: '#1fb2e5 !important',
        border: theme.isDark ? '1px solid black !important' : '1px solid #797979',
        backgroundColor: theme.isDark ? '#6d6767' : 'white',
      },
    '[data-testid="datatable-panel-loading"]': {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      background: theme.colors.background.primary,
      color: theme.colors.text.secondary,
    },
});
