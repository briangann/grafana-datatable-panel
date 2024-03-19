import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Box, Button, IconButton, Select, Stack, Text } from '@grafana/ui';
import React from 'react';
import { getDataFramesFields } from 'transformations';
import { ColumnWidthHint } from 'types';

export function ColumnWidthHints(props: StandardEditorProps<ColumnWidthHint[]>) {
  const { onChange, value = [] } = props;
  const dataFields = getDataFramesFields(props.context.data);
  const availableFields = dataFields.reduce<SelectableValue[]>((acc, field) => {
    // Filter out fields that already have an width
    if (value.find((item) => item.name === field)) {
      return acc;
    }
    acc.push({ value: field, label: field });
    return acc;
  }, []);

  function handleNewColumnWidth() {
    onChange([...value, { name: '', width: '' }]);
  }

  function handleRemoveColumnWidth(index: number) {
    onChange([...value.slice(0, index), ...value.slice(index + 1)]);
  }

  function handleSelectChange(event: SelectableValue, selectIndex: number) {
    const newWidths = value.map((item: ColumnWidthHint, index: number) => {
      if (index === selectIndex) {
        return { name: event.value, width: item.width };
      }
      return item;
    });
    onChange(newWidths);
  }

  function handleWidthChange(event: React.ChangeEvent<HTMLInputElement>, selectIndex: number) {
    const newWidths = value.map((item: ColumnWidthHint, index: number) => {
      if (index === selectIndex) {
        return { name: item.name, width: event.target.value };
      }
      return item;
    });
    onChange(newWidths);
  }

  const currentWidths = value.map((item: ColumnWidthHint, index: number) => {
    const options = item.name === '' ? availableFields : [...availableFields, { value: item.name, label: item.name }];
    // TODO: fix the styling so all fields align. Currently
    return (
      <div key={index} style={{ width: '100%' }}>
        <Stack justifyContent="space-evenly" direction="row" alignItems="center">
          <div>
            <Text>Column</Text>
          </div>
          <div>
            <Select
              // TODO: We don't want this width here. it should be somehow auto
              width={15}
              options={options}
              aria-label={`Current selected column ${item.name}`}
              value={item.name || ''}
              onChange={(event) => handleSelectChange(event, index)}
            />
          </div>
          <div>
            <Text>Width (% or px)</Text>
          </div>
          <div>
            <input
              value={item.width || ''}
              onChange={(event) => {
                handleWidthChange(event, index);
              }}
            />
          </div>
          <div>
            <IconButton name="trash-alt" aria-label="Remove column" onClick={() => handleRemoveColumnWidth(index)} />
          </div>
        </Stack>
      </div>
    );
  });

  return (
    <div>
      {currentWidths}
      <Box marginTop={1}>
        <Button variant="secondary" icon="plus" onClick={handleNewColumnWidth}>
          Add Column Width
        </Button>
      </Box>
    </div>
  );
}
