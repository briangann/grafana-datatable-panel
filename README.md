# Grafana Datatable Panel

![Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fbriangann-datatable-panel&query=version&prefix=v&logo=grafana&label=Version&color=orange)
![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fbriangann-datatable-panel&query=downloads&logo=grafana&label=Downloads&color=orange)
[![License](https://img.shields.io/github/license/briangann/grafana-datatable-panel)](LICENSE)
![CI (main)](https://github.com/briangann/grafana-datatable-panel/actions/workflows/ci.yml/badge.svg?branch=main)

[![Twitter Follow](https://img.shields.io/twitter/follow/jepetlefeu.svg?style=social)](https://twitter.com/jepetlefeu)
![Release](https://github.com/briangann/grafana-datatable-panel/workflows/Release/badge.svg)

[![Known Vulnerabilities](https://snyk.io/test/github/briangann/grafana-datatable-panel/badge.svg)](https://snyk.io/test/github/briangann/grafana-datatable-panel)
[![Maintainability](https://api.codeclimate.com/v1/badges/7b3cb7018973e4ddfdac/maintainability)](https://codeclimate.com/github/briangann/grafana-datatable-panel/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/7b3cb7018973e4ddfdac/test_coverage)](https://codeclimate.com/github/briangann/grafana-datatable-panel/test_coverage)

This panel plugin provides a [Datatables.net](http://www.datatables.net) table panel for [Grafana](http://www.grafana.com) 10.x/11.x/12.x.

This table includes features for metric thresholds, value mapping, aggregations, and
per-cell filtering.

## Features

* Multiple options for row and cell thresholds
* Scrolling and Paging options with horizontal scroll as needed
* Search and highlight cell content
* Filters per column
* Click through urls based on cell data
* URLs inside row text can be "clicked"
* Rows can have a click-through URL
* Multi-Column Sorting
* Horizontal scrolling enabled when columns are wider than panel

## Screenshots

### Scrolling Enabled - Dark Theme

By default the panel enables scrolling for the data, use the `Enable Paging` option to use the paging method.

![Scrolling with Compact Rows - Dark Theme](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-scrolling.png)

### Paging Enabled - Dark Theme

![Paging - Dark Theme](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-paging.png)

### Paging with Numbered Rows and Compact Style - Dark Theme

![Numbered and Compact Rows - Dark Theme](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-paging-numbered-compact.png)

### Thresholds - Dark Theme

![Thresholds - Dark Theme](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-thresholds.png)

### Value Maps and Range Maps - Dark Theme

![Value Maps and Range Maps - Dark Theme](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-mappings.png)

## Options

There are multiple sections for configuring the data in the editor.

### Visual Options

![Options](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-visual-options.png)

#### Scrolling and Paging Modes

##### Scrolling Mode

When scrolling is enabled, the table supports vertical and horizontal scrolling of the data.

##### Paging Mode

When scrolling is disabled, the panel switches to paging mode with controls that will skip through data at specific intervals.

###### Entries per page

The number of rows displayed can be set with the `entries per page` selector at the top left of the panel.

###### Show rows per page

Show rows per page selection

#### Other options

| Option                 | Meaning                           |
|------------------------|-----------------------------------|
| Enable Row Numbers     | Adds left column showing row numbers |
| Font Size              | Adjust font size of text in table |
| Highlight Order Column | When the column order is modified, this highlights it |
| Hover                  | Highlight row under mouse         |
| Right Align Numbers    | All cells with numbers will be aligned to the right |
| Show Footer Info       | Displays number of rows           |
| Show Stripes on Rows   | Alternating stripes for even/odd rows |
| Use Compact Rows       | Reduce space used to display data |
| Wrap Row Content       | Auto-wraps text to fit in column width |

### Search Options

### Data Options

#### Fill Empty Data with Custom Value

When there is no data available for a cell, a custom value can be substituted with this setting enabled.

#### Transform

Selects how to convert the source data to a compatible panel format.

| Transform Type          |                                                |
|-------------------------|------------------------------------------------|
| Timeseries to Columns   | This is the typical method                     |
| Timeseries to Rows      | Converts to rows (wide data)                   |
| Timeseries Aggregations | Provides selectable aggregations for metrics   |
|                         | Last/Mean/Min/Max etc                          |
| JSON Data               | Converts JSON to table format                  |
| Table                   | Generic table format to datatable              |

### Column Aliasing

Override the name displayed for a column. Each column can be selected and an alias provided.

### Column Width Hints

Provide a width "hint" in percentage or pixels ( 100px or 10% ). Note: The table will autosize as needed, but will use the hints provided.

### Column Sorting

Sort table by specified column number in ascending/descending order.
Multiple sorting options can be applied.

## Column Styles

There are four styles that can be applied to the datatable.

### Date Style

This lets you convert "unix epoch" numerical timestamps to a readable format.

### String Style

Matching column names can have a clickthrough applied to them.

Once the url is specified, additional options are displayed that provide additonal "macros."

Additional you can specify if the URL should be open in a new tab or new window, and specify a custom target.

#### Pattern Macros

`Split By RegEx` - the cell content of the matching column is split by this regex which can then be used within the URL.

For example, a column named `text` with a RegEx '/text/', and a split by as space `/\s/`.  The content of the cell split can be referenced by:

`$__pattern_N` - where N is the position of the split

#### Cell Macros

`$__cell_N` - the content of cell N within the same row
`$__cell` - the content of the current cell

Time Macros

`$__keepTime` - provides the `from=now-24h&to=now` time option of the dashboard
`$__from` - provides the raw `from` time of the dashboard
`$__to` - provides the raw `to` time of the dashboard

#### Example URLs with Macros

##### Keep Time

`https://myinstance.grafana.net/d/dashboard-example?$__keepTime`

expands to:

`https://myinstance.grafana.net/d/dashboard-example?from=now-24h&to=now`

##### Use specific cell as template variable

`https://myinstance.grafana.net/d/dashboard-example?$__keepTime&var-SERVER=$__cell_2`

expands to:

`https://myinstance.grafana.net/d/dashboard-example?from=now-24h&to=now&var-SERVER=ServerA`

##### Use current cell as template variable

`https://myinstance.grafana.net/d/dashboard-example?$__keepTime&var-SERVER=$__cell`

expands to (the current cell contains `Server B`), params are encoded:

`https://myinstance.grafana.net/d/dashboard-example?$__keepTime&var-SERVER=Server%20B`

##### Use split by regex pattern as template variable

`https://myinstance.grafana.net/d/dashboard-example?$__keepTime&var-SERVER=$__pattern_2`

Where cell content contains `Error on ServerC`, and split by is `/\s/`

expands to:

`https://myinstance.grafana.net/d/dashboard-example?$__keepTime&var-SERVER=ServerC`

### Hidden Style

Matching columns will be "hidden" from the table

### Metric Style

### Thresholding

#### Row-based threshold coloring

"Row" coloring uses the "highest" threshold color of all columns

![Thresholding with Row Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-threshold-row.png)

#### Cell based threshold coloring

![Thresholding with Cell Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-threshold-cell.png)

#### Cell based threshold value coloring

![Thresholding with Value Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-threshold-value.png)

#### RowColumn threshold coloring

This option sets the row color to the "highest" threshold found for all cells in row.

It also sets the color for each cell according to the threshold (you can tell which columns actually exceeded the threshold).

This means - a row can have an overall color, with each cell indicating it's real threshold color.

![Thresholding with RowColumn1](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-threshold-rowcolumn1.png)

![Thresholding with RowColumn2](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-threshold-rowcolumn2.png)

#### RowColumn threshold coloring including row counter

Same as above, but with row counter included

![Thresholding with RowColumn including row count](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/main/src/screenshots/datatable-dark-threshold-rowcolumn-rownumbers.png)

## Acknowledgements

This panel is based on the "Table" panel by GrafanaLabs
Special thanks to Esteban Beltran for his help porting from Angular!
