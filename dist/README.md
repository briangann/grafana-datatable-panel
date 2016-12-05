# Grafana Datatable Panel

This panel plugin provides a [Datatables.net](http://www.datatables.net) table panel for [Grafana](http://www.grafana.org) 3.x/4.x

### Screenshots

##### Example Tables

![Default Theme](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/default-datatable.png)

##### Options

![Options](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/options.png)

##### Thresholding
![Thresholding](https://raw.githubusercontent.com/briangann/grafana-datatable-panel/master/src/screenshots/thresholding.png)

-------

## Features

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

This panel is based on the "Table" panel by Grafana

#### Changelog


##### v0.0.1
- Initial commit
