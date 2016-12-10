# Grafana Datatable Panel

This panel plugin provides a [Datatables.net](http://www.datatables.net) table panel for [Grafana](http://www.grafana.org) 3.x/4.x

PLEASE NOTE: This is a work in progress, and has not been integrated into grafana.net

### Screenshots

##### Example Tables

![Default Theme](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/default-datatable.png)

##### Options

![Options](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/options.png)

##### Thresholding
![Thresholding](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/thresholding.png)

-------

## Features

Feature parity with built-in Grafana Table Panel
Set font size for rows
Scrolling
Paging
  Preset page sizes
  Multiple paging types
  Dropdown for page size
Row Numbers on left side
Searchable table content (filtering)
Themes
  Multiple built-in themes

## TODO

* Add option to cells for linking to another page
* Add option to enable regex in search

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
