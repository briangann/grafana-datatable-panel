# Grafana Datatable Panel

This panel plugin provides a [Datatables.net](http://www.datatables.net) table panel for [Grafana](http://www.grafana.org) 3.x/4.x

### Screenshots


##### Paging enabled
![Default Paging](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-basic-dark.png)

##### Scrolling enabled
![Scrolling](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-dark-scrolling.png)

##### Light Theme with Paging
![Light Theme with Paging](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-basic-light.png)

##### Numbered Rows and Compact Style

![Numbered and Compact Rows](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-dark-numbered-compact.png)

#### Options

##### Options Tab

![Options](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-options.png)

Same options as built-in table panel

##### Datatable Options Tab

![Datatable Options](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-dt-options.png)

Table Display Options
* Font Size - set font size of table content
* Scroll - toggle for scrolling vs Paging
* Paging Options
  * Rows Per Page - number of rows to display when paging is enabled
  * Paging type - multiple navigation options

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

#### Thresholding

##### Row-based threshold coloring

![Thresholding with Row Coloring](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-threshold-row.png)

##### Cell based threshold coloring

![Thresholding with Cell Coloring](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-threshold-cell.png)

##### Cell based threshold value coloring

![Thresholding with Value Coloring](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-threshold-value.png)

##### RowColumn threshold coloring

This option sets the row color to the "highest" threshold found for all cells in row.

It also sets the color for each cell according to the threshold (you can tell which columns actually exceeded the threshold).

This means - a row can have an overall color, with each cell indicating it's real threshold color.

![Thresholding with RowColumn1](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-threshold-rowcolumn1.png)

![Thresholding with RowColumn2](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-threshold-rowcolumn2.png)

##### RowColumn threshold coloring including row counter

Same as above, but with row counter included

![Thresholding with RowColumn including row count](https://raw.githubusercontent.com/abmptit/grafana-datatable-panel/master/src/screenshots/datatable-threshold-rowcolumn-rownumbers.png)


-------

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


## TODO
* [+] Column is not working
* Add option for a cell or row to link to another page
* Add Additional Themes
    * Bootstrap:
        * Requires a modified .js file since it looks for "datatables.net" - need workaround
    * Foundation:
        * Requires a modified .js file since it looks for "datatables.net" - need workaround
        * Needs a new CSS that is "dark" for Grafana - the builtin is light
          http://foundation.zurb.com/sites/download.html/#customizeFoundation
    * JQueryUI ThemeRoller
        * Requires a modified .js file since it looks for "datatables.net" - need workaround

## Building

This plugin relies on Grunt/NPM/Bower, typical build sequence:

```
npm install
bower install
grunt
```

For development, you can run:
```
grunt watch
```
The code will be parsed then copied into "dist" if "jslint" passes without errors.


### Docker Support

A docker-compose.yml file is include for easy development and testing, just run
```
docker-compose up
```

Then browse to http://localhost:3000


## External Dependencies

* Grafana 3.x/4.x

## Build Dependencies

* npm
* bower
* grunt

#### Acknowledgements

This panel is based on the "Table" panel by GrafanaLabs

#### Changelog


##### v0.0.1
- Initial commit
