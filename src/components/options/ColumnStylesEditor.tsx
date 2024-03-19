import { StandardEditorProps } from '@grafana/data';
import { ColumnStyleType, ColumnStyling } from 'types';

export function ColumnStylesEditor(props: StandardEditorProps<ColumnStyling[]>) {
  const { onChange, value = [] } = props;

  function handleRemoveColumnStyle(index: number) {
    onChange([...value.slice(0, index), ...value.slice(index + 1)]);
  }

  function handleAddColumnStyle() {
    onChange([...value, { nameOrRegex: '', type: ColumnStyleType.Number, ignoreNull: false }]);
  }
}
