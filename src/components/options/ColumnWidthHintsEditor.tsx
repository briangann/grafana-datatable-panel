import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Box, Button, IconButton, InlineField, Input, Select, Stack } from '@grafana/ui';
import React, { FormEvent } from 'react';
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

  function handleWidthChange(event: FormEvent<HTMLInputElement>, selectIndex: number) {
    const target = event.target as HTMLInputElement;
    const newWidths = value.map((item: ColumnWidthHint, index: number) => {
      if (index === selectIndex) {
        return { name: item.name, width: target.value };
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
        <Stack justifyContent="start" direction="row" alignItems="start">
          <InlineField label="Column" tooltip="The column to apply width hints to">
            <Select
              // TODO: We don't want this width here. it should be somehow auto
              width={15}
              options={options}
              aria-label={`Current selected column ${item.name}`}
              value={item.name || ''}
              onChange={(event) => handleSelectChange(event, index)}
            />
          </InlineField>
          <InlineField label="Width" tooltip="The width hint to apply. (add % or px)">
            <Input
              value={item.width || ''}
              onChange={(event) => {
                handleWidthChange(event, index);
              }}
            />
          </InlineField>
          <IconButton name="trash-alt" aria-label="Remove column" onClick={() => handleRemoveColumnWidth(index)} />
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
