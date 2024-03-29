# Grafana Datatable Panel

[![Marketplace](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=marketplace&prefix=v&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-datatable-panel%22%29%5D.version&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-datatable-panel)
[![Downloads](https://img.shields.io/badge/dynamic/json?logo=grafana&color=F47A20&label=downloads&query=%24.items%5B%3F%28%40.slug%20%3D%3D%20%22briangann-datatable-panel%22%29%5D.downloads&url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins)](https://grafana.com/grafana/plugins/briangann-datatable-panel)
[![License](https://img.shields.io/github/license/briangann/grafana-datatable-panel)](LICENSE)

[![Twitter Follow](https://img.shields.io/twitter/follow/jepetlefeu.svg?style=social)](https://twitter.com/jepetlefeu)
![Release](https://github.com/briangann/grafana-datatable-panel/workflows/Release/badge.svg)
![CI (main)](https://github.com/briangann/grafana-datatable-panel/actions/workflows/ci.yml/badge.svg?branch=main)

[![Known Vulnerabilities](https://snyk.io/test/github/briangann/grafana-datatable-panel/badge.svg)](https://snyk.io/test/github/briangann/grafana-datatable-panel)
[![Maintainability](https://api.codeclimate.com/v1/badges/7b3cb7018973e4ddfdac/maintainability)](https://codeclimate.com/github/briangann/grafana-datatable-panel/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/7b3cb7018973e4ddfdac/test_coverage)](https://codeclimate.com/github/briangann/grafana-datatable-panel/test_coverage)

This panel plugin provides a [Datatables.net](http://www.datatables.net) table panel for [Grafana](http://www.grafana.com) 8.x/9.x/10.x

NOTE: main branch is now v2.0.0 in progress, these docs are for v1.x

## Screenshots

### Paging enabled

![Default Paging](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-basic-dark.png)

### Scrolling enabled

![Scrolling](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-dark-scrolling.png)

### Light Theme with Paging

![Light Theme with Paging](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-basic-light.png)

### Numbered Rows and Compact Style

![Numbered and Compact Rows](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-dark-numbered-compact.png)

## Options

### Options Tab

![Options](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-options.png)

Same options as built-in table panel

### Datatable Options Tab

![Datatable Options](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-dt-options.png)

Table Display Options

* Font Size - set font size of table content
* Scroll - toggle for scrolling vs Paging
* Paging Options
  * Rows Per Page - number of rows to display when paging is enabled
  * Paging type - multiple navigation options

Column Aliasing

* Override the name displayed for a column

Column Width Hints

* Provide a width "hint" in percentage or pixels ( 100px or 10% ). Note: The table will autosize as needed, but will use the hints provided.

Column Sorting

* Sort table by any number of columns in ascending/descending order.

Table Options

* Row Numbers - toggle to show row numbers
* Length Change Enabled - top left dropdown for showing alternate page sizes
* Search Enabled - toggle to allow searching table content (regex is enabled)
* Info - Displays the "Show N of X entries" on bottom left of table
* Cell Borders - show borders around each Cell (cannot be enabled with Row Borders)
* Row Borders - show border between rows
* Compact Rows - uses less padding for denser data display
* Striped Rows - non-colored rows will be "striped" odd/even
* Order Column - Highlights the column used for sorting
* Hover - Highlights row on mouse hover

Theme Settings

* Basic theme is currently the only option, more to be added

## Thresholding

### Row-based threshold coloring

![Thresholding with Row Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-threshold-row.png)

### Cell based threshold coloring

![Thresholding with Cell Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-threshold-cell.png)

### Cell based threshold value coloring

![Thresholding with Value Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-threshold-value.png)

### RowColumn threshold coloring

This option sets the row color to the "highest" threshold found for all cells in row.

It also sets the color for each cell according to the threshold (you can tell which columns actually exceeded the threshold).

This means - a row can have an overall color, with each cell indicating it's real threshold color.

![Thresholding with RowColumn1](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-threshold-rowcolumn1.png)

![Thresholding with RowColumn2](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-threshold-rowcolumn2.png)

### RowColumn threshold coloring including row counter

Same as above, but with row counter included

![Thresholding with RowColumn including row count](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/v1.x/src/screenshots/datatable-threshold-rowcolumn-rownumbers.png)

## Features

* Feature parity with built-in Grafana Table Panel
* Row coloring uses the "highest" threshold color of all columns
* New "RowColumn" threshold color option:
   Sets color to "highest" threshold found for all cells in row.
   Also sets color for each cell according to the threshold.
   This means - a row can have an overall color, with each cell indicating it's real threshold color.
* Set font size for rows
* Scrolling
* Paging
  * Preset page sizes
  * Multiple paging types
  * Dropdown for page size
* Row Numbers reactive to filtering
* Searchable table content (filtering), regex enabled
* Columns names can be aliased
* URLs inside row text can be "clicked"
* Rows can have a click-through URL
* Multi-Column Sorting
* Horizontal scrolling enabled when columns are wider than panel

## TODO

* [+] Column is not working

## Building

This plugin relies on Yarn, typical build sequence:

```BASH
yarn install
yarn build
```

For development, you can run:

```BASH
yarn install
yarn watch
```

The code will be parsed then copied into "dist" if the build passes without errors.

## Docker Support

A docker-compose.yml file is include for easy development and testing, just run

```BASH
docker-compose up
```

Then browse to (<http://localhost:3000>)

## RPM

A spec file is included to facilitate RPM based deployments, to generate run

```BASH
make rpm
```

## External Dependencies

* Grafana 6.x/7.x

## Build Dependencies

* yarn

## Acknowledgements

This panel is based on the "Table" panel by GrafanaLabs
