import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
//import '../css/datatables.css';
//import '../css/dataTables.dataTables.css';
/*
export const getDatatableStyles = (theme: GrafanaTheme2) => css`
  width: 100%;
  margin: 0 auto;
  clear: both;
  border-collapse: separate;
  border-spacing: 0;
`;
*/

export const getDatatableThemedStyles = (theme: GrafanaTheme2) =>
  css({
    width: '100%',
    margin: '0 auto',
    clear: 'both',
    borderCollapse: 'separate',
    borderSpacing: 0,
    '&': {
      ':root': {
        '--dt-row-selected': '13, 110, 253',
        '--dt-row-selected-text': '255, 255, 255',
        '--dt-row-selected-link': '9, 10, 11',
        '--dt-row-stripe': '0, 0, 0',
        '--dt-row-hover': '0, 0, 0',
        '--dt-column-ordering': '0, 0, 0',
        '--dt-html-background': 'white',
      },
      ':root.dark': {
        '--dt-html-background': 'rgb(33, 37, 41)',
      },
      'table.dataTable td.dt-control': {
        textAlign: 'center',
        cursor: 'pointer',
      },
      'table.dataTable td.dt-control:before': {
        display: 'inline-block',
        boxSizing: 'border-box',
        content: '',
        borderTop: '5px solid transparent',
        borderLeft: '10px solid rgba(0, 0, 0, 0.5)',
        borderBottom: '5px solid transparent',
        borderRight: '0px solid transparent',
      },
      'table.dataTable tr.dt-hasChild td.dt-control:before': {
        borderTop: '10px solid rgba(0, 0, 0, 0.5)',
        borderLeft: '5px solid transparent',
        borderBottom: '0px solid transparent',
        borderRight: '5px solid transparent',
      },
      'html.dark table.dataTable td.dt-control:before, \
        :root[data-bs-theme=dark] table.dataTable td.dt-control:before': {
        borderLeftColor: 'rgba(255, 255, 255, 0.5)',
      },
      'html.dark table.dataTable tr.dt-hasChild td.dt-control:before, \
        :root[data-bs-theme=dark] table.dataTable tr.dt-hasChild td.dt-control:before': {
        borderTopColor: 'rgba(255, 255, 255, 0.5)',
        borderLeftColor: 'transparent',
      },
      'div.dt-scroll-body thead tr, \
        div.dt-scroll-body tfoot tr': {
        height: 0,
      },
      'div.dt-scroll-body thead tr th, div.dt-scroll-body thead tr td, \
        div.dt-scroll-body tfoot tr th, \
        div.dt-scroll-body tfoot tr td': {
        height: '0 !important',
        paddingTop: '0px !important',
        paddingBottom: '0px !important',
        borderTopWidth: '0px !important',
        borderBottomWidth: '0px !important',
      },
      'div.dt-scroll-body thead tr th div.dt-scroll-sizing, div.dt-scroll-body thead tr td div.dt-scroll-sizing, \
        div.dt-scroll-body tfoot tr th div.dt-scroll-sizing, \
        div.dt-scroll-body tfoot tr td div.dt-scroll-sizing': {
        height: '0 !important',
        overflow: 'hidden !important',
      },
      'table.dataTable thead > tr > th:active, \
        table.dataTable thead > tr > td:active': {
        outline: 'none',
      },
      'table.dataTable thead > tr > th.dt-orderable-asc span.dt-column-order:before, table.dataTable thead > tr > th.dt-ordering-asc span.dt-column-order:before, \
        table.dataTable thead > tr > td.dt-orderable-asc span.dt-column-order:before, \
        table.dataTable thead > tr > td.dt-ordering-asc span.dt-column-order:before': {
        position: 'absolute',
        display: 'block',
        bottom: '50%',
        //content: '▲',
        content: '"▲"/""',
      },
      'table.dataTable thead > tr > th.dt-orderable-desc span.dt-column-order:after, table.dataTable thead > tr > th.dt-ordering-desc span.dt-column-order:after, \
        table.dataTable thead > tr > td.dt-orderable-desc span.dt-column-order:after, \
        table.dataTable thead > tr > td.dt-ordering-desc span.dt-column-order:after': {
        position: 'absolute',
        display: 'block',
        top: '50%',
        //content: '▼',
        content: '"▼"/""',
      },
      'table.dataTable thead > tr > th.dt-orderable-asc, table.dataTable thead > tr > th.dt-orderable-desc, table.dataTable thead > tr > th.dt-ordering-asc, table.dataTable thead > tr > th.dt-ordering-desc, \
      table.dataTable thead > tr > td.dt-orderable-asc, \
      table.dataTable thead > tr > td.dt-orderable-desc, \
      table.dataTable thead > tr > td.dt-ordering-asc, \
      table.dataTable thead > tr > td.dt-ordering-desc': {
        position: 'relative',
        paddingRight: '30px',
      },
      'table.dataTable thead > tr > th.dt-orderable-asc span.dt-column-order, table.dataTable thead > tr > th.dt-orderable-desc span.dt-column-order, table.dataTable thead > tr > th.dt-ordering-asc span.dt-column-order, table.dataTable thead > tr > th.dt-ordering-desc span.dt-column-order, \
      table.dataTable thead > tr > td.dt-orderable-asc span.dt-column-order, \
      table.dataTable thead > tr > td.dt-orderable-desc span.dt-column-order, \
      table.dataTable thead > tr > td.dt-ordering-asc span.dt-column-order, \
      table.dataTable thead > tr > td.dt-ordering-desc span.dt-column-order': {
        position: 'absolute',
        right: '12px',
        top: 0,
        bottom: 0,
        width: '12px',
      },
      'table.dataTable thead > tr > th.dt-orderable-asc span.dt-column-order:before, \
        table.dataTable thead > tr > th.dt-orderable-asc span.dt-column-order:after, \
        table.dataTable thead > tr > th.dt-orderable-desc span.dt-column-order:before, \
        table.dataTable thead > tr > th.dt-orderable-desc span.dt-column-order:after, \
        table.dataTable thead > tr > th.dt-ordering-asc span.dt-column-order:before, \
        table.dataTable thead > tr > th.dt-ordering-asc span.dt-column-order:after, \
        table.dataTable thead > tr > th.dt-ordering-desc span.dt-column-order:before, \
        table.dataTable thead > tr > th.dt-ordering-desc span.dt-column-order:after, \
        table.dataTable thead > tr > td.dt-orderable-asc span.dt-column-order:before, \
        table.dataTable thead > tr > td.dt-orderable-asc span.dt-column-order:after, \
        table.dataTable thead > tr > td.dt-orderable-desc span.dt-column-order:before, \
        table.dataTable thead > tr > td.dt-orderable-desc span.dt-column-order:after, \
        table.dataTable thead > tr > td.dt-ordering-asc span.dt-column-order:before, \
        table.dataTable thead > tr > td.dt-ordering-asc span.dt-column-order:after, \
        table.dataTable thead > tr > td.dt-ordering-desc span.dt-column-order:before, \
        table.dataTable thead > tr > td.dt-ordering-desc span.dt-column-order:after': {
        left: 0,
        opacity: 0.125,
        lineHeight: '9px',
        fontSize: '0.8em',
      },
      'table.dataTable thead > tr > th.dt-orderable-asc, \
        table.dataTable thead > tr > th.dt-orderable-desc, \
        table.dataTable thead > tr > td.dt-orderable-asc, \
        table.dataTable thead > tr > td.dt-orderable-desc': {
        cursor: 'pointer',
      },
      'table.dataTable thead > tr > th.dt-orderable-asc:hover, \
        table.dataTable thead > tr > th.dt-orderable-desc:hover, \
        table.dataTable thead > tr > td.dt-orderable-asc:hover, \
        table.dataTable thead > tr > td.dt-orderable-desc:hover': {
        outline: '2px solid rgba(0, 0, 0, 0.05)',
        outlineOffset: '-2px',
      },
      'table.dataTable thead > tr > th.dt-ordering-asc span.dt-column-order:before, \
        table.dataTable thead > tr > th.dt-ordering-desc span.dt-column-order:after, \
        table.dataTable thead > tr > td.dt-ordering-asc span.dt-column-order:before, \
        table.dataTable thead > tr > td.dt-ordering-desc span.dt-column-order:after': {
        opacity: 0.6,
      },
      'table.dataTable thead > tr > th.sorting_desc_disabled span.dt-column-order:after, \
        table.dataTable thead > tr > th.sorting_asc_disabled span.dt-column-order:before, \
        table.dataTable thead > tr > td.sorting_desc_disabled span.dt-column-order:after, \
        table.dataTable thead > tr > td.sorting_asc_disabled span.dt-column-order:before': {
        display: 'none',
      },
      'div.dt-scroll-body > table.dataTable > thead > tr > th, \
        div.dt-scroll-body > table.dataTable > thead > tr > td': {
        overflow: 'hidden',
      },
      ':root.dark table.dataTable thead > tr > th.dt-orderable-asc:hover, \
        :root.dark table.dataTable thead > tr > th.dt-orderable-desc:hover, \
        :root.dark table.dataTable thead > tr > td.dt-orderable-asc:hover, \
        :root.dark table.dataTable thead > tr > td.dt-orderable-desc:hover, \
        :root[data-bs-theme=dark] table.dataTable thead > tr > th.dt-orderable-asc:hover, \
        :root[data-bs-theme=dark] table.dataTable thead > tr > th.dt-orderable-desc:hover, \
        :root[data-bs-theme=dark] table.dataTable thead > tr > td.dt-orderable-asc:hover, \
        :root[data-bs-theme=dark] table.dataTable thead > tr > td.dt-orderable-desc:hover': {
        outline: '2px solid rgba(255, 255, 255, 0.05)',
      },
      'div.dt-processing': {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '200px',
        marginLeft: '-100px',
        marginTop: '-22px',
        textAlign: 'center',
        padding: '2px',
        zIndex: 10,
      },
      'div.dt-processing > div:last-child': {
        position: 'relative',
        width: '80px',
        height: '15px',
        margin: '1em auto',
      },
      'div.dt-processing > div:last-child > div': {
        position: 'absolute',
        top: 0,
        width: '13px',
        height: '13px',
        borderRadius: '50%',
        // background: 'rgb(13, 110, 253)',
        background: 'rgb(var(--dt-row-selected))',
        animationTimingFunction: 'cubic-bezier(0, 1, 1, 0)',
      },
      'div.dt-processing > div:last-child > div:nth-child(1)': {
        left: '8px',
        animation: 'datatables-loader-1 0.6s infinite',
      },
      'div.dt-processing > div:last-child > div:nth-child(2)': {
        left: '8px',
        animation: 'datatables-loader-2 0.6s infinite',
      },
      'div.dt-processing > div:last-child > div:nth-child(3)': {
        left: '32px',
        animation: 'datatables-loader-2 0.6s infinite',
      },
      'div.dt-processing > div:last-child > div:nth-child(4)': {
        left: '56px',
        animation: 'datatables-loader-3 0.6s infinite',
      },
      '@keyframes datatables-loader-1': {
        '0%': {
          transform: 'scale(0)',
        },
        '100%': {
          transform: 'scale(1)',
        },
      },
      '@keyframes datatables-loader-3': {
        '0%': {
          transform: 'scale(1)',
        },
        '100%': {
          transform: 'scale(0)',
        },
      },
      '@keyframes datatables-loader-2': {
        '0%': {
          transform: 'translate(0, 0)',
        },
        '100%': {
          transform: 'translate(24px, 0)',
        },
      },
      'table.dataTable.nowrap th, table.dataTable.nowrap td': {
        whiteSpace: 'nowrap',
      },
      'table.dataTable th, \
        table.dataTable td': {
        boxSizing: 'border-box',
      },
      'table.dataTable th.dt-left, \
        table.dataTable td.dt-left': {
        textAlign: 'left',
      },
      'table.dataTable th.dt-center, \
        table.dataTable td.dt-center': {
        textAlign: 'center',
      },
      'table.dataTable th.dt-right, \
        table.dataTable td.dt-right': {
        textAlign: 'right',
      },
      'table.dataTable th.dt-justify, \
        table.dataTable td.dt-justify': {
        textAlign: 'justify',
      },
      'table.dataTable th.dt-nowrap, \
        table.dataTable td.dt-nowrap': {
        whiteSpace: 'nowrap',
      },
      'table.dataTable th.dt-empty, \
        table.dataTable td.dt-empty': {
        textAlign: 'center',
        verticalAlign: 'top',
      },
      'table.dataTable th.dt-type-numeric, \
        table.dataTable th.dt-type-date, \
        table.dataTable td.dt-type-numeric, \
        table.dataTable td.dt-type-date': {
        textAlign: 'right',
      },
      'able.dataTable thead th, \
        table.dataTable thead td, \
        table.dataTable tfoot th, \
        table.dataTable tfoot td': {
        textAlign: 'left',
      },
      'table.dataTable thead th.dt-head-left, \
        table.dataTable thead td.dt-head-left, \
        table.dataTable tfoot th.dt-head-left, \
        table.dataTable tfoot td.dt-head-left': {
        textAlign: 'left',
      },
      'table.dataTable thead th.dt-head-center, \
        table.dataTable thead td.dt-head-center, \
        table.dataTable tfoot th.dt-head-center, \
        table.dataTable tfoot td.dt-head-center': {
        textAlign: 'center',
      },
      'table.dataTable thead th.dt-head-right, \
        table.dataTable thead td.dt-head-right, \
        table.dataTable tfoot th.dt-head-right, \
        table.dataTable tfoot td.dt-head-right': {
        textAlign: 'right',
      },
      'table.dataTable thead th.dt-head-justify, \
        table.dataTable thead td.dt-head-justify, \
        table.dataTable tfoot th.dt-head-justify, \
        table.dataTable tfoot td.dt-head-justify': {
        textAlign: 'justify',
      },
      'table.dataTable thead th.dt-head-nowrap, \
        table.dataTable thead td.dt-head-nowrap, \
        table.dataTable tfoot th.dt-head-nowrap, \
        table.dataTable tfoot td.dt-head-nowrap': {
        whiteSpace: 'nowrap',
      },
      'table.dataTable tbody th.dt-body-left, \
        table.dataTable tbody td.dt-body-left': {
        textAlign: 'left',
      },
      'table.dataTable tbody th.dt-body-center, \
        table.dataTable tbody td.dt-body-center': {
        textAlign: 'center',
      },
      'table.dataTable tbody th.dt-body-right, \
        table.dataTable tbody td.dt-body-right': {
        textAlign: 'right',
      },
      'table.dataTable tbody th.dt-body-justify, \
        table.dataTable tbody td.dt-body-justify': {
        textAlign: 'justify',
      },
      'table.dataTable tbody th.dt-body-nowrap, \
        table.dataTable tbody td.dt-body-nowrap': {
        whiteSpace: 'nowrap',
      },
      /*
       * Table styles
       */
      'table.dataTable': {
        width: '100%',
        margin: '0 auto',
        borderSpacing: 0,
        /*
         * Header and footer styles
         */
        /*
         * Body styles
         */
      },
      'table.dataTable thead th, \
        table.dataTable tfoot th': {
        fontWeight: 'bold',
        color: 'rgb(31, 178, 229)',
      },
      'table.dataTable > thead > tr > th, \
        table.dataTable > thead > tr > td': {
        padding: '10px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
      },
      'table.dataTable > thead > tr > th:active, \
        table.dataTable > thead > tr > td:active': {
        outline: 'none',
      },
      'table.dataTable > tfoot > tr > th, \
        table.dataTable > tfoot > tr > td': {
        borderTop: '1px solid rgba(0, 0, 0, 0.3)',
        padding: '10px 10px 6px 10px',
      },
      'table.dataTable > tbody > tr': {
        backgroundColor: 'transparent',
      },
      'table.dataTable > tbody > tr:first-child > *': {
        borderTop: 'none',
      },
      'table.dataTable > tbody > tr:last-child > *': {
        borderBottom: 'none',
      },
      'table.dataTable > tbody > tr.selected > *': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.9)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.9)',
        color: 'rgb(255, 255, 255)',
        //color: 'rgb(var(--dt-row-selected-text))',
      },
      'table.dataTable > tbody > tr.selected a': {
        color: 'rgb(9, 10, 11)',
        // color: 'rgb(var(--dt-row-selected-link))',
      },
      'table.dataTable > tbody > tr > th, \
        table.dataTable > tbody > tr > td': {
        padding: '8px 10px',
      },
      'table.dataTable.row-border > tbody > tr > *, \
       table.dataTable.display > tbody > tr > *': {
        borderTop: '1px solid rgba(0, 0, 0, 0.15)',
      },
      'table.dataTable.row-border > tbody > tr:first-child > *, \
       table.dataTable.display > tbody > tr:first-child > *': {
        borderTop: 'none',
      },
      'table.dataTable.row-border > tbody > tr.selected + tr.selected > td, \
        table.dataTable.display > tbody > tr.selected + tr.selected > td': {
        //borderTopColor: 'rgba(13, 110, 253, 0.65)',
        borderTopColor: 'rgba(var(--dt-row-selected), 0.65)',
      },
      'table.dataTable.cell-border > tbody > tr > *': {
        borderTop: '1px solid rgba(0, 0, 0, 0.15)',
        borderRight: '1px solid rgba(0, 0, 0, 0.15)',
      },
      'table.dataTable.cell-border > tbody > tr > *:first-child': {
        borderLeft: '1px solid rgba(0, 0, 0, 0.15)',
      },
      'table.dataTable.cell-border > tbody > tr:first-child > *': {
        borderTop: '1px solid rgba(0, 0, 0, 0.3)',
      },
      'table.dataTable.stripe > tbody > tr:nth-child(odd) > *, \
       table.dataTable.display > tbody > tr:nth-child(odd) > *': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.023)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-stripe), 0.023)',
      },
      'table.dataTable.stripe > tbody > tr:nth-child(odd).selected > *, \
       table.dataTable.display > tbody > tr:nth-child(odd).selected > *': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.923)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.923)',
      },
      'table.dataTable.hover > tbody > tr:hover > *, \
       table.dataTable.display > tbody > tr:hover > *': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.035)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-hover), 0.035)',
      },
      'table.dataTable.hover > tbody > tr.selected:hover > *, \
       table.dataTable.display > tbody > tr.selected:hover > *': {
        //boxShadow: 'inset 0 0 0 9999px #0d6efd !important',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 1) !important',
      },
      'table.dataTable.order-column > tbody tr > .sorting_1, \
        table.dataTable.order-column > tbody tr > .sorting_2, \
        table.dataTable.order-column > tbody tr > .sorting_3, \
        table.dataTable.display > tbody tr > .sorting_1, \
        table.dataTable.display > tbody tr > .sorting_2, \
        table.dataTable.display > tbody tr > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.019)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-column-ordering), 0.019)',
      },
      'table.dataTable.order-column > tbody tr.selected > .sorting_1, \
        table.dataTable.order-column > tbody tr.selected > .sorting_2, \
        table.dataTable.order-column > tbody tr.selected > .sorting_3, \
        table.dataTable.display > tbody tr.selected > .sorting_1, \
        table.dataTable.display > tbody tr.selected > .sorting_2, \
        table.dataTable.display > tbody tr.selected > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.919)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.919)',
      },
      'table.dataTable.display > tbody > tr:nth-child(odd) > .sorting_1, \
        table.dataTable.order-column.stripe > tbody > tr:nth-child(odd) > .sorting_1': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.054)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-column-ordering), 0.054)',
      },
      'table.dataTable.display > tbody > tr:nth-child(odd) > .sorting_2, \
        table.dataTable.order-column.stripe > tbody > tr:nth-child(odd) > .sorting_2': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.047)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-column-ordering), 0.047)',
      },
      'table.dataTable.display > tbody > tr:nth-child(odd) > .sorting_3, \
        table.dataTable.order-column.stripe > tbody > tr:nth-child(odd) > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.039)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-column-ordering), 0.039)',
      },
      'table.dataTable.display > tbody > tr:nth-child(odd).selected > .sorting_1, \
        table.dataTable.order-column.stripe > tbody > tr:nth-child(odd).selected > .sorting_1': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.954)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.954)',
      },
      'table.dataTable.display > tbody > tr:nth-child(odd).selected > .sorting_2, \
        table.dataTable.order-column.stripe > tbody > tr:nth-child(odd).selected > .sorting_2': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.947)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.947)',
      },
      'table.dataTable.display > tbody > tr:nth-child(odd).selected > .sorting_3, \
        table.dataTable.order-column.stripe > tbody > tr:nth-child(odd).selected > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.939)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.939)',
      },
      'table.dataTable.display > tbody > tr.even > .sorting_1, \
        table.dataTable.order-column.stripe > tbody > tr.even > .sorting_1': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.019)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-column-ordering), 0.019)',
      },
      'table.dataTable.display > tbody > tr.even > .sorting_2, \
        table.dataTable.order-column.stripe > tbody > tr.even > .sorting_2': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.011)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-column-ordering), 0.011)',
      },
      'table.dataTable.display > tbody > tr.even > .sorting_3, \
        table.dataTable.order-column.stripe > tbody > tr.even > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.003)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-column-ordering), 0.003)',
      },
      'table.dataTable.display > tbody > tr.even.selected > .sorting_1, \
        table.dataTable.order-column.stripe > tbody > tr.even.selected > .sorting_1': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.919)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.919);',
      },
      'table.dataTable.display > tbody > tr.even.selected > .sorting_2, \
        table.dataTable.order-column.stripe > tbody > tr.even.selected > .sorting_2': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.911)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.911)',
      },
      'table.dataTable.display > tbody > tr.even.selected > .sorting_3, \
        table.dataTable.order-column.stripe > tbody > tr.even.selected > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.903)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.903)',
      },
      'table.dataTable.display tbody tr:hover > .sorting_1, \
        table.dataTable.order-column.hover tbody tr:hover > .sorting_1': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.082',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-hover), 0.082)',
      },
      'table.dataTable.display tbody tr:hover > .sorting_2, \
        table.dataTable.order-column.hover tbody tr:hover > .sorting_2': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.074)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-hover), 0.074)',
      },
      'table.dataTable.display tbody tr:hover > .sorting_3, \
        table.dataTable.order-column.hover tbody tr:hover > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.062)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-hover), 0.062)',
      },
      'table.dataTable.display tbody tr:hover.selected > .sorting_1, \
        table.dataTable.order-column.hover tbody tr:hover.selected > .sorting_1': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.982)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.982)',
      },
      'table.dataTable.display tbody tr:hover.selected > .sorting_2, \
        table.dataTable.order-column.hover tbody tr:hover.selected > .sorting_2': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.974)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.974)',
      },
      'table.dataTable.display tbody tr:hover.selected > .sorting_3, \
        table.dataTable.order-column.hover tbody tr:hover.selected > .sorting_3': {
        //boxShadow: 'inset 0 0 0 9999px rgba(13, 110, 253, 0.962)',
        boxShadow: 'inset 0 0 0 9999px rgba(var(--dt-row-selected), 0.962)',
      },
      'table.dataTable.compact thead th, \
        table.dataTable.compact thead td, \
        table.dataTable.compact tfoot th, \
        table.dataTable.compact tfoot td, \
        table.dataTable.compact tbody th, \
        table.dataTable.compact tbody td': {
        padding: '4px',
      },
      /*
       * Control feature layout
       */
      'div.dt-container': {
        //color: 'aqua',
        position: 'relative',
        clear: 'both',
      },
      'div.dt-container div.dt-layout-row': {
        display: 'table',
        clear: 'both',
        width: '100%',
      },
      'div.dt-container div.dt-layout-row.dt-layout-table': {
        display: 'block',
      },
      'div.dt-container div.dt-layout-row.dt-layout-table div.dt-layout-cell': {
        display: 'block',
      },
      'div.dt-container div.dt-layout-cell': {
        display: 'table-cell',
        verticalAlign: 'middle',
        padding: '5px 0',
      },
      'div.dt-container div.dt-layout-cell.dt-full': {
        textAlign: 'center',
      },
      'div.dt-container div.dt-layout-cell.dt-start': {
        textAlign: 'left',
      },
      'div.dt-container div.dt-layout-cell.dt-end': {
        textAlign: 'right',
      },
      'div.dt-container div.dt-layout-cell:empty': {
        display: 'none',
      },
      'div.dt-container .dt-search input': {
        border: '1px solid #aaa',
        borderRadius: '3px',
        padding: '5px',
        backgroundColor: 'transparent',
        color: 'inherit',
        marginLeft: '3px',
      },
      'div.dt-container .dt-input': {
        border: '1px solid #aaa',
        borderRadius: '3px',
        padding: '5px',
        backgroundColor: 'transparent',
        color: 'inherit',
      },
      'div.dt-container select.dt-input': {
        width: 'auto',
        padding: '4px',
      },
      'div.dt-container .dt-paging .dt-paging-button': {
        boxSizing: 'border-box',
        display: 'inline-block',
        minWidth: '1.5em',
        padding: '0.5em 1em',
        marginLeft: '2px',
        textAlign: 'center',
        textDecoration: 'none !important',
        cursor: 'pointer',
        color: 'inherit !important',
        border: '1px solid transparent',
        borderRadius: '2px',
        background: 'transparent',
      },
      'div.dt-container .dt-paging .dt-paging-button.current, \
        div.dt-container .dt-paging .dt-paging-button.current:hover': {
        color: 'rgb(31, 178, 229) !important',
        //  color: 'inherit !important',
        border: '1px solid rgba(0, 0, 0, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        //background: '-webkit-gradient(linear, left top, left bottom, color-stop(0%, rgba(230, 230, 230, 0.05)), color-stop(100%, rgba(0, 0, 0, 0.05)))', /* Chrome,Safari4+ */
        //background: '-webkit-linear-gradient(top, rgba(230, 230, 230, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%)', /* Chrome10+,Safari5.1+ */
        //background: '-moz-linear-gradient(top, rgba(230, 230, 230, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%)', /* FF3.6+ */
        //background: '-ms-linear-gradient(top, rgba(230, 230, 230, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%)', /* IE10+ */
        //background: '-o-linear-gradient(top, rgba(230, 230, 230, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%)', /* Opera 11.10+ */
        background: 'linear-gradient(to bottom, rgba(230, 230, 230, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%)', /* W3C */
      },
      'div.dt-container .dt-paging .dt-paging-button.disabled, \
        div.dt-container .dt-paging .dt-paging-button.disabled:hover, \
        div.dt-container .dt-paging .dt-paging-button.disabled:active': {
        cursor: 'default',
        color: 'rgba(0, 0, 0, 0.5) !important',
        border: '1px solid transparent',
        background: 'transparent',
        boxShadow: 'none',
      },
      'div.dt-container .dt-paging .dt-paging-button:hover': {
        color: 'white !important',
        border: '1px solid #111',
        backgroundColor: '#111',
        //background: '-webkit-gradient(linear, left top, left bottom, color-stop(0%, #585858), color-stop(100%, #111))', /* Chrome,Safari4+ */
        //background: '-webkit-linear-gradient(top, #585858 0%, #111 100%)', /* Chrome10+,Safari5.1+ */
        //background: '-moz-linear-gradient(top, #585858 0%, #111 100%)', /* FF3.6+ */
        //background: '-ms-linear-gradient(top, #585858 0%, #111 100%)', /* IE10+ */
        //background: '-o-linear-gradient(top, #585858 0%, #111 100%)', /* Opera 11.10+ */
        background: 'linear-gradient(to bottom, #585858 0%, #111 100%)', /* W3C */
      },
      'div.dt-container .dt-paging .dt-paging-button:active': {
        outline: 'none',
        backgroundColor: '#0c0c0c',
        //background: '-webkit-gradient(linear, left top, left bottom, color-stop(0%, #2b2b2b), color-stop(100%, #0c0c0c))', /* Chrome,Safari4+ */
        //background: '-webkit-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%)', /* Chrome10+,Safari5.1+ */
        //background: '-moz-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%)', /* FF3.6+ */
        //background: '-ms-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%)', /* IE10+ */
        //background: '-o-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%)', /* Opera 11.10+ */
        //background: 'linear-gradient(to bottom, #2b2b2b 0%, #0c0c0c 100%)', /* W3C */
        boxShadow: 'inset 0 0 3px #111',
      },
      'div.dt-container .dt-paging .ellipsis': {
        padding: '0 1em',
      },
      'div.dt-container .dt-length, \
        div.dt-container .dt-search, \
        div.dt-container .dt-info, \
        div.dt-container .dt-processing, \
        div.dt-container .dt-paging': {
        color: 'inherit',
      },
      'div.dt-container .dataTables_scroll': {
        clear: 'both',
      },
      'div.dt-container .dataTables_scroll div.dt-scroll-body': {
        '-webkit-overflow-scrolling': 'touch',
      },
      'div.dt-container .dataTables_scroll div.dt-scroll-body > table > thead > tr > th, \
        div.dt-container .dataTables_scroll div.dt-scroll-body > table > thead > tr > td, \
        div.dt-container .dataTables_scroll div.dt-scroll-body > table > tbody > tr > th, \
        div.dt-container .dataTables_scroll div.dt-scroll-body > table > tbody > tr > td': {
        verticalAlign: 'middle',
      },
      'div.dt-container .dataTables_scroll div.dt-scroll-body > table > thead > tr > th > div.dataTables_sizing, \
        div.dt-container .dataTables_scroll div.dt-scroll-body > table > thead > tr > td > div.dataTables_sizing, \
        div.dt-container .dataTables_scroll div.dt-scroll-body > table > tbody > tr > th > div.dataTables_sizing, \
        div.dt-container .dataTables_scroll div.dt-scroll-body > table > tbody > tr > td > div.dataTables_sizing': {
        height: 0,
        overflow: 'hidden',
        margin: '0 !important',
        padding: '0 !important',
      },
      'div.dt-container.dt-empty-footer tbody > tr:last-child > *': {
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
      },
      'div.dt-container.dt-empty-footer .dt-scroll-body': {
        borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
      },
      'div.dt-container.dt-empty-footer .dt-scroll-body tbody > tr:last-child > *': {
        borderBottom: 'none',
      },

      '@media screen and (max-width: 767px)': {
        'div.dt-container div.dt-layout-row': {
          display: 'block',
        },
        'div.dt-container div.dt-layout-cell': {
          display: 'block',
        },
        'div.dt-container div.dt-layout-cell.dt-full, \
          div.dt-container div.dt-layout-cell.dt-start, \
          div.dt-container div.dt-layout-cell.dt-end': {
          textAlign: 'center',
        },
      },
      '@media screen and (max-width: 640px)': {
        '.dt-container .dt-length, \
          .dt-container .dt-search': {
          float: 'none',
          textAlign: 'center',
        },
        '.dt-container .dt-search': {
          marginTop: '0.5em',
        },
      },

      'html.dark': {
        '--dt-row-hover': '255, 255, 255',
        '--dt-row-stripe': '255, 255, 255',
        '--dt-column-ordering': '255, 255, 255',
      },
      'html.dark table.dataTable > thead > tr > th, \
        html.dark table.dataTable > thead > tr > td': {
        borderBottom: '1px solid rgb(89, 91, 94)',
      },
      'html.dark table.dataTable > thead > tr > th:active, \
        html.dark table.dataTable > thead > tr > td:active': {
        outline: 'none',
      },
      'html.dark table.dataTable > tfoot > tr > th, \
        html.dark table.dataTable > tfoot > tr > td': {
        borderTop: '1px solid rgb(89, 91, 94)',
      },
      'html.dark table.dataTable.row-border > tbody > tr > *, \
        html.dark table.dataTable.display > tbody > tr > *': {
        borderTop: '1px solid rgb(64, 67, 70)',
      },
      'html.dark table.dataTable.row-border > tbody > tr:first-child > *, \
        html.dark table.dataTable.display > tbody > tr:first-child > *': {
        borderTop: 'none',
      },
      'html.dark table.dataTable.row-border > tbody > tr.selected + tr.selected > td, \
        html.dark table.dataTable.display > tbody > tr.selected + tr.selected > td': {
        //borderTopColor: 'rgba(13, 110, 253, 0.65)',
        borderTopColor: 'rgba(var(--dt-row-selected), 0.65)',
      },
      'html.dark table.dataTable.cell-border > tbody > tr > th, \
        html.dark table.dataTable.cell-border > tbody > tr > td': {
        borderTop: '1px solid rgb(64, 67, 70)',
        borderRight: '1px solid rgb(64, 67, 70)',
      },
      'html.dark table.dataTable.cell-border > tbody > tr > th:first-child, \
      html.dark table.dataTable.cell-border > tbody > tr > td:first-child': {
        borderLeft: '1px solid rgb(64, 67, 70)',
      },
      'html.dark .dt-container.dt-empty-footer table.dataTable': {
        borderBottom: '1px solid rgb(89, 91, 94)',
      },
      'html.dark .dt-container .dt-search input, \
        html.dark .dt-container .dt-length select': {
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'var(--dt-html-background)',
      },
      'html.dark .dt-container .dt-paging .dt-paging-button.current, \
        html.dark .dt-container .dt-paging .dt-paging-button.current:hover': {
        border: '1px solid rgb(89, 91, 94)',
        background: 'rgba(255, 255, 255, 0.15)',
      },
      'html.dark .dt-container .dt-paging .dt-paging-button.disabled, \
        html.dark .dt-container .dt-paging .dt-paging-button.disabled:hover, html.dark .dt-container .dt-paging .dt-paging-button.disabled:active': {
        color: '#666 !important',
      },
      'html.dark .dt-container .dt-paging .dt-paging-button:hover': {
        border: '1px solid rgb(53, 53, 53)',
        background: 'rgb(53, 53, 53)',
      },
      'html.dark .dt-container .dt-paging .dt-paging-button:active': {
        background: '#3a3a3a',
      },

      /*
       * Overrides for RTL support
       */
      '*[dir=rtl] table.dataTable thead th, \
        *[dir=rtl] table.dataTable thead td, \
        *[dir=rtl] table.dataTable tfoot th, \
        *[dir=rtl] table.dataTable tfoot td': {
        textAlign: 'right',
      },
      '*[dir=rtl] table.dataTable th.dt-type-numeric, \
        *[dir=rtl] table.dataTable th.dt-type-date, \
        *[dir=rtl] table.dataTable td.dt-type-numeric, \
        *[dir=rtl] table.dataTable td.dt-type-date': {
        textAlign: 'left',
      },
      '*[dir=rtl] div.dt-container div.dt-layout-cell.dt-start': {
        textAlign: 'right',
      },
      '*[dir=rtl] div.dt-container div.dt-layout-cell.dt-end': {
        textAlign: 'left',
      },
      '*[dir=rtl] div.dt-container div.dt-search input': {
        margin: '0 3px 0 0',
      },
    },
  });


export const getWrapperStyles = (theme: GrafanaTheme2) => css`
  width: 99%;
  margin: 0 auto;
  clear: both;
  border-collapse: separate;
  border-spacing: 0;
  & > div.dt-container {
    & * table.dataTable thead th,
        table.dataTable tfoot th {
      color: #1fb2e5;
      font-weight: bold;
    };
    & * table.dataTable thead th,
        table.dataTable thead td {
      padding: 10px 18px;
      border-bottom: 1px solid #111111;
    };
    & * table.dataTable thead th:active,
        table.dataTable thead td:active {
      outline: none;
    };
    & * table.dataTable tfoot th,
        table.dataTable tfoot td {
      padding: 10px 18px 6px 18px;
      border-top: 1px solid #111111;
    };
    & * table.dataTable thead .sorting,
        table.dataTable thead .sorting_asc,
        table.dataTable thead .sorting_desc {
      cursor: pointer;
    };
    & * table.dataTable thead .sorting,
        table.dataTable thead .sorting_asc,
        table.dataTable thead .sorting_desc,
        table.dataTable thead .sorting_asc_disabled,
        table.dataTable thead .sorting_desc_disabled {
      background-repeat: no-repeat;
      background-position: center right;
    };
    & * table.dataTable thead .sorting {
      background-image: url('../images/sort_both.png');
    };
    & * table.dataTable thead .sorting_asc {
      background-image: url('../images/sort_asc.png');
    };
    & * table.dataTable thead .sorting_desc {
      background-image: url('../images/sort_desc.png');
    };
    & * table.dataTable thead .sorting_asc_disabled {
      background-image: url('../images/sort_asc_disabled.png');
    };
    & * table.dataTable thead .sorting_desc_disabled {
      background-image: url('../images/sort_desc_disabled.png');
    };
    & * table.dataTable tbody tr {
      background-color: #545151;
    };

    & * .dataTables_wrapper .dataTables_paginate {
  float: right;
  text-align: right;
  padding-top: 0.25em;
};
& * .dataTables_wrapper .dataTables_paginate .paginate_button {
  box-sizing: border-box;
  display: inline-block;
  min-width: 1.5em;
  padding: 0.5em 1em;
  margin-left: 2px;
  text-align: center;
  text-decoration: none !important;
  cursor: pointer;
  color: #333333 !important;
  border: 1px solid transparent;
  border-radius: 2px;
};

& * div.dt-container .dt-paging .dt-paging-button.current,
div.dt-container .dt-paging .dt-paging-button.current:hover {
  color: blue !important;
  border: 1px solid #8fc7c7;
  background-color: white;
  background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, white), color-stop(100%, #ebf5f5));
  /* Chrome,Safari4+ */
  background: -webkit-linear-gradient(top, white 0%, #ebf5f5 100%);
  /* Chrome10+,Safari5.1+ */
  background: -moz-linear-gradient(top, white 0%, #ebf5f5 100%);
  /* FF3.6+ */
  background: -ms-linear-gradient(top, white 0%, #ebf5f5 100%);
  /* IE10+ */
  background: -o-linear-gradient(top, white 0%, #ebf5f5 100%);
  /* Opera 11.10+ */
  background: linear-gradient(to bottom, white 0%, #ebf5f5 100%);
  /* W3C */
};
& * .dataTables_wrapper .dataTables_paginate .paginate_button.disabled,
.dataTables_wrapper .dataTables_paginate .paginate_button.disabled:hover,
.dataTables_wrapper .dataTables_paginate .paginate_button.disabled:active {
  cursor: default;
  color: #666 !important;
  border: 1px solid transparent;
  background: transparent;
  box-shadow: none;
};
& * .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
  color: white !important;
  border: 1px solid #111111;
  background-color: #585858;
  background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #585858), color-stop(100%, #111111));
  /* Chrome,Safari4+ */
  background: -webkit-linear-gradient(top, #585858 0%, #111111 100%);
  /* Chrome10+,Safari5.1+ */
  background: -moz-linear-gradient(top, #585858 0%, #111111 100%);
  /* FF3.6+ */
  background: -ms-linear-gradient(top, #585858 0%, #111111 100%);
  /* IE10+ */
  background: -o-linear-gradient(top, #585858 0%, #111111 100%);
  /* Opera 11.10+ */
  background: linear-gradient(to bottom, #585858 0%, #111111 100%);
  /* W3C */
};
& * .dataTables_wrapper .dataTables_paginate .paginate_button:active {
  outline: none;
  background-color: #2b2b2b;
  background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #2b2b2b), color-stop(100%, #0c0c0c));
  /* Chrome,Safari4+ */
  background: -webkit-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%);
  /* Chrome10+,Safari5.1+ */
  background: -moz-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%);
  /* FF3.6+ */
  background: -ms-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%);
  /* IE10+ */
  background: -o-linear-gradient(top, #2b2b2b 0%, #0c0c0c 100%);
  /* Opera 11.10+ */
  background: linear-gradient(to bottom, #2b2b2b 0%, #0c0c0c 100%);
  /* W3C */
  box-shadow: inset 0 0 3px #111;
};
& * .dataTables_wrapper .dataTables_paginate .ellipsis {
  padding: 0 1em;
};

  };
`;

export const getTableStyles = (theme: GrafanaTheme2) => css`
    div.dt-container {
      background-color: 'aliceblue';
    }
]`;
