import { StandardEditorProps } from '@grafana/data';
import { Stack, Box, Button, Field, Input } from '@grafana/ui';
import React from 'react';
import { ColumnStyleType, ColumnStyling } from 'types';

export function ColumnStylesEditorNOT(props: StandardEditorProps<ColumnStyling[]>) {
  const { onChange, value = [] } = props;

  // @ts-ignore
  function handleRemoveColumnStyle(index: number) {
    onChange([...value.slice(0, index), ...value.slice(index + 1)]);
  }

  function handleAddColumnStyle() {
    onChange([...value, { nameOrRegex: '', type: ColumnStyleType.Number, ignoreNull: false }]);
  }

  function handleChange(key: keyof ColumnStyling, index: number) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const newStyling = value.map((item: ColumnStyling, itemIndex: number) => {
        if (itemIndex === index) {
          return { ...item, [key]: event.target.value };
        }
        return item;
      });
      onChange(newStyling);
    };
  }

  const currentStyling = value.map((item: ColumnStyling, index: number) => {
    return (
      <div key={index} style={{ width: '100%' }}>
        <Stack justifyContent="space-evenly" direction="row" alignItems="center">
          <Field label="Name or Regex">
            <Input type="text" value={item.nameOrRegex} onChange={handleChange('nameOrRegex', index)} />
          </Field>
        </Stack>
      </div>
    );
  });

  return (
    <div>
      <Stack>{currentStyling}</Stack>
      <Box marginTop={2}>
        <Button variant="secondary" onClick={handleAddColumnStyle}>
          Add Style
        </Button>
      </Box>
    </div>
  );
}
