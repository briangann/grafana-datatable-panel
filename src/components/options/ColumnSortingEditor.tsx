import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Box, Button, IconButton, InlineField, Input, Select, Stack } from '@grafana/ui';
import React, { FormEvent } from 'react';
import { ColumnSorting, ColumnSortingOptions } from 'types';

function getSortingValue(item: string): ColumnSortingOptions {
  return item === 'asc' ? ColumnSortingOptions.Ascending : ColumnSortingOptions.Descending;
}

export function ColumnSortingEditor(props: StandardEditorProps<ColumnSorting[]>) {
  const { onChange, value = [] } = props;

  function handleNewColumnSorting() {
    const newIndex = value.length ? Math.max(...value.map((item) => item.index)) + 1 : 0;
    onChange([...value, { index: newIndex, order: ColumnSortingOptions.Descending }]);
  }

  function handleRemoveColumnSorting(index: number) {
    onChange([...value.slice(0, index), ...value.slice(index + 1)]);
  }

  function handleIndexChange(event: FormEvent<HTMLInputElement>, selectIndex: number) {
    const target = event.target as HTMLInputElement;
    const newSorting = value.map((item: ColumnSorting, itemIndex: number) => {
      if (itemIndex === selectIndex) {
        return { index: parseInt(target.value, 10), order: item.order };
      }
      return item;
    });
    onChange(newSorting);
  }

  function handleOrderChange(event: SelectableValue<string>, selectIndex: number) {
    const newOrder = getSortingValue(event.value ?? ColumnSortingOptions.Descending);
    const newSorting = value.map((item: ColumnSorting, itemIndex: number) => {
      if (itemIndex === selectIndex) {
        return { index: item.index, order: newOrder };
      }
      return item;
    });
    onChange(newSorting);
  }

  const currentSortSettings = value.map((items: ColumnSorting, index: number) => {
    return (
      <div key={index} style={{ width: '100%' }}>
        <Stack justifyContent="start" direction="row" alignItems="start">
          <InlineField label="Column" tooltip="Column Number to Sort, Starts with 0">
            <Input
              width={6}
              type="number"
              value={items.index}
              onChange={(event) => {
                handleIndexChange(event, index);
              }}
            />
          </InlineField>
          <Select
            value={items.order}
            options={[
              { value: ColumnSortingOptions.Ascending, label: 'Ascending' },
              { value: ColumnSortingOptions.Descending, label: 'Descending' },
            ]}
            onChange={(event) => handleOrderChange(event, index)}
          />
          <IconButton name="trash-alt" aria-label="Remove column" onClick={() => handleRemoveColumnSorting(index)} />
        </Stack>
      </div>
    );
  });

  return (
    <div>
      {currentSortSettings}
      <Box marginTop={1}>
        <Button fill="solid" variant="primary" icon="plus" onClick={handleNewColumnSorting}>
          Add Column Sort
        </Button>
      </Box>
    </div>
  );
}
