import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Box, Button, IconButton, InlineField, Input, Select, Stack } from '@grafana/ui';
import React, { FormEvent } from 'react';
import { getDataFrameFields } from 'data/transformations';
import { ColumnAliasField } from 'types';

export function ColumnAliasesEditor(props: StandardEditorProps<ColumnAliasField[]>) {
  const { onChange, value = [] } = props;
  const dataFields = getDataFrameFields(props.context.data);
  const availableFields = dataFields.reduce<SelectableValue[]>((acc, field) => {
    // Filter out fields that already have an alias
    if (value.find((alias) => alias.name === field)) {
      return acc;
    }
    acc.push({ value: field, label: field });
    return acc;
  }, []);

  function handleNewColumnAlias() {
    onChange([...value, { name: '', alias: '' }]);
  }

  function handleRemoveColumnAlias(index: number) {
    onChange([...value.slice(0, index), ...value.slice(index + 1)]);
  }

  function handleSelectChange(event: SelectableValue, selectIndex: number) {
    const newAliases = value.map((alias: ColumnAliasField, index: number) => {
      if (index === selectIndex) {
        return { name: event.value, alias: alias.alias };
      }
      return alias;
    });
    onChange(newAliases);
  }

  function handleAliasChange(event: FormEvent<HTMLInputElement>, selectIndex: number) {
    const target = event.target as HTMLInputElement;
    const newAliases = value.map((alias: ColumnAliasField, index: number) => {
      if (index === selectIndex) {
        return { name: alias.name, alias: target.value };
      }
      return alias;
    });
    onChange(newAliases);
  }

  const currentAliases = value.map((alias: ColumnAliasField, index: number) => {
    const options =
      alias.name === '' ? availableFields : [...availableFields, { value: alias.name, label: alias.name }];
    // TODO: fix the styling so all fields align. Currently
    return (
      <div key={index} style={{ width: '100%' }}>
        <Stack justifyContent="start" direction="row" alignItems="start">
          <InlineField label="Column">
            <Select
              // TODO: We don't want this width here. it should be somehow auto
              width={15}
              options={options}
              allowCustomValue={true}
              aria-label={`Current selected column ${alias.name}`}
              value={alias.name || ''}
              onChange={(event) => handleSelectChange(event, index)}
            />
          </InlineField>
          <InlineField label="Alias">
            <Input
              value={alias.alias || ''}
              onChange={(event) => {
                handleAliasChange(event, index);
              }}
            />
          </InlineField>
          <IconButton name="trash-alt" aria-label="Remove column" onClick={() => handleRemoveColumnAlias(index)} />
        </Stack>
      </div>
    );
  });

  return (
    <div>
      {currentAliases}
      <Box marginTop={1}>
        <Button fill="solid" variant="primary" icon="plus" onClick={handleNewColumnAlias}>
          Add Alias
        </Button>
      </Box>
    </div>
  );
}
