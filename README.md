# Grafana Datatable Panel

This panel plugin provides a [Datatables.net](http://www.datatables.net) table panel for [Grafana](http://www.grafana.org) 3.x/4.x

### Screenshots

##### Example Tables

![Default Paging](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-default-paging.png)

![Scrolling](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-scroll.png)

![Numbered and Compact Rows](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-compact-numbered.png)
##### Options

![Options](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-options.png)

![Datatable Options](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-dt-options.png)
##### Thresholding

![Thresholding with Row Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-threshold-row.png)

![Thresholding with Cell Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-threshold-cell.png)

![Thresholding with Value Coloring](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/datatable-threshold-cell.png)


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
* + Column is not working
* Save state
* Add option to cells for linking to another page
* Themes
  * Multiple built-in themes
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
