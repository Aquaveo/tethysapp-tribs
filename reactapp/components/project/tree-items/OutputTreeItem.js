import PropTypes from "prop-types";
import TreeItem from "components/tree/TreeItem";
import * as workflowConstants from "constants/workflowConstants"
import Icon from "assets/Icon";
import ToolHistoryInputItem from 'assets/tool_history_arg_item.svg';
import ToolHistoryFileItem from 'assets/tool_history_output_item.svg';
import { matchesUUID } from "components/tree/propTypes";

const OutputTreeItem = ({ history_item }) => {
  return (
    <TreeItem
      key={`output-${history_item.id}`}
      title="Output:"
      icon={<Icon src={ToolHistoryFileItem} altText="Workflow Output" />}
      highlight
    >
      {history_item.output && history_item.output.length > 0 && history_item.output.map((workflow_output, i) => (
        <TreeItem
          key={`workflow-output-${i}`}
          title={workflow_output.name}
          leaf
          highlight
          icon={<Icon src={ToolHistoryInputItem} altText="Workflow Input" />}
        />
      ))}
    </TreeItem>
  );
};

OutputTreeItem.propTypes = {
  history_item: PropTypes.shape({
    id: matchesUUID,
    name: PropTypes.string,
    date_created: PropTypes.instanceOf(Date),
    status: PropTypes.oneOf(workflowConstants.WORKFLOW_STATUS),
    steps: PropTypes.array,
    output: PropTypes.array,
  })
};

export default OutputTreeItem;