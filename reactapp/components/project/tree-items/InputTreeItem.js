import PropTypes from "prop-types";
import TreeItem from "components/tree/TreeItem";
import * as workflowConstants from "constants/workflowConstants"
import Icon from "assets/Icon";
import ToolHistoryInputItem from 'assets/tool_history_arg_item.svg';
import ToolHistoryFileItem from 'assets/tool_history_output_item.svg';
import { matchesUUID } from "components/tree/propTypes";

const InputTreeItem = ({ history_item }) => {
  return (
    <TreeItem
      key={`input-${history_item.id}`}
      title="Input:"
      icon={<Icon src={ToolHistoryFileItem} altText="Workflow Input" />}
      highlight
    >
      {history_item.steps.length > 0 && history_item.steps.map((workflow_input, i) => (
        <TreeItem
          key={`workflow-input-${i}`}
          title={workflow_input.name}
          leaf
          highlight
          icon={<Icon src={ToolHistoryInputItem} altText="Workflow Input" />}
        />
      ))}
    </TreeItem>
  );
};

InputTreeItem.propTypes = {
  history_item: PropTypes.shape({
    id: matchesUUID,
    name: PropTypes.string,
    date_created: PropTypes.instanceOf(Date),
    status: PropTypes.oneOf(workflowConstants.WORKFLOW_STATUS),
    steps: PropTypes.array,
    output: PropTypes.array,
  })
};

export default InputTreeItem;