# Change Log

All notable changes to this project will be documented in this file.

## [1.0.0] - 2020-04-21

- Added option to use orthogonal data option to sort by value and not formatted value
  - <https://datatables.net/manual/data/orthogonal-data>
- Remove moment package
- Updated to use new @grafana/toolkit build process
- Packages updated
- FIX: column index sorting was wrong when row numbers set true
- FIX: light theme search area now more visible
- NEW: time macros $__from, $__to, $__keepFrom will be replaced in clickable urls

## [0.0.9] - 2019-09-07

- Fix stringToJsRegex reference error

## [0.0.8] - 2019-09-07

- update packages

## [0.0.7] - 2019-07-26

New features/bugfixes by contributor jmp0x00, thanks!!
Conversion to typescript
Updated all packages
CircleCI added to publishing

## (previous) Changelog

|Version|Changes|
|-------|-----------|
|0.0.1  | first release |
|0.0.2  | NEW: Added option for a cell or row to link to another page|
|       | NEW: Supports Clickable links inside table |
|       | BUGFIX: Fixed missing CSS files |
|       | BUGFIX: CSS files now load when Grafana has a subpath|
|       | NEW: Added multi-column sorting - sort by any number of columns ascending/descending|
|       | NEW: Column Aliasing - modify the name of a column as sent by the datasource|
|       | NEW: Column width hints - suggest a width for a named column|
|0.0.3  | BUGFIX: Saving State should now work - wrong option was in the datatable constructor|
|       | NEW: Export options for Clipboard/CSV/PDF/Excel/Print|
|       | BUGFIX: Columns from datasources other than JSON can now be aliased|
|       | BUGFIX: No data now clears table (issue #5)|
|0.0.4  | NEW: Now autoscrolls horizontally if number of columns is wider|
|       | than the rendered panel (issue #6)|
|0.0.5  | BUGFIX: SystemJS path changes for Grafana > 4.6|
|0.0.6  | BUGFIX: Compatibility for v5|
|1.0.0  | Update packages and convert to toolkit|
