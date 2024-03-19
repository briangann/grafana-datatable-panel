import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Box, Button, IconButton, Select, Stack, Text } from '@grafana/ui';
import React from 'react';
import { ColumnSorting } from 'types';

function getSortingValue(item: string): 'asc' | 'desc' {
  return item === 'asc' ? 'asc' : 'desc';
}

export function ColumnSortingEditor(props: StandardEditorProps<ColumnSorting[]>) {
  const { onChange, value = [] } = props;

  function handleNewColumnSorting() {
    const newIndex = value.length ? Math.max(...value.map((item) => item.index)) + 1 : 0;
    onChange([...value, { index: newIndex, order: 'desc' }]);
  }

  function handleRemoveColumnSorting(index: number) {
    onChange([...value.slice(0, index), ...value.slice(index + 1)]);
  }

  function handleIndexChange(event: React.ChangeEvent<HTMLInputElement>, selectIndex: number) {
    const newSorting = value.map((item: ColumnSorting, itemIndex: number) => {
      if (itemIndex === selectIndex) {
        return { index: parseInt(event.target.value, 10), order: item.order };
      }
      return item;
    });
    onChange(newSorting);
  }

  function handleOrderChange(event: SelectableValue<string>, selectIndex: number) {
    const newOrder = getSortingValue(event.value ?? 'desc');
    const newSorting = value.map((item: ColumnSorting, itemIndex: number) => {
      if (itemIndex === selectIndex) {
        return { index: item.index, order: newOrder };
      }
      return item;
    });
    onChange(newSorting);
  }

  const currentAliases = value.map((items: ColumnSorting, index: number) => {
    return (
      <div key={index} style={{ width: '100%' }}>
        <Stack justifyContent="space-evenly" direction="row" alignItems="center">
          <div>
            <Text>Column</Text>
          </div>
          <div>
            <input
              type="number"
              value={items.index}
              onChange={(event) => {
                handleIndexChange(event, index);
              }}
            />
          </div>
          <div>
            <Select
              value={items.order}
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
              ]}
              onChange={(event) => handleOrderChange(event, index)}
            />
          </div>
          <div>
            <IconButton name="trash-alt" aria-label="Remove column" onClick={() => handleRemoveColumnSorting(index)} />
          </div>
        </Stack>
      </div>
    );
  });

  return (
    <div>
      {currentAliases}
      <Box marginTop={1}>
        <Button variant="secondary" icon="plus" onClick={handleNewColumnSorting}>
          Add Column Alias
        </Button>
      </Box>
    </div>
  );
}
