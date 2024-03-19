import { SelectableValue, StandardEditorProps } from '@grafana/data';
import { Box, Button, IconButton, Select, Stack, Text } from '@grafana/ui';
import React from 'react';
import { getDataFramesFields } from 'transformations';
import { ColumnAliasField } from 'types';

export function ColumnAliasesEditor(props: StandardEditorProps<ColumnAliasField[]>) {
  const { onChange, value = [] } = props;
  const dataFields = getDataFramesFields(props.context.data);
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

  function handleAliasChange(event: React.ChangeEvent<HTMLInputElement>, selectIndex: number) {
    const newAliases = value.map((alias: ColumnAliasField, index: number) => {
      if (index === selectIndex) {
        return { name: alias.name, alias: event.target.value };
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
        <Stack justifyContent="space-evenly" direction="row" alignItems="center">
          <div>
            <Text>Column</Text>
          </div>
          <div>
            <Select
              // TODO: We don't want this width here. it should be somehow auto
              width={15}
              options={options}
              aria-label={`Current selected column ${alias.name}`}
              value={alias.name || ''}
              onChange={(event) => handleSelectChange(event, index)}
            />
          </div>
          <div>
            <Text>Alias</Text>
          </div>
          <div>
            <input
              value={alias.alias || ''}
              onChange={(event) => {
                handleAliasChange(event, index);
              }}
            />
          </div>
          <div>
            <IconButton name="trash-alt" aria-label="Remove column" onClick={() => handleRemoveColumnAlias(index)} />
          </div>
        </Stack>
      </div>
    );
  });

  return (
    <div>
      {currentAliases}
      <Box marginTop={1}>
        <Button variant="secondary" icon="plus" onClick={handleNewColumnAlias}>
          Add Column Alias
        </Button>
      </Box>
    </div>
  );
}
