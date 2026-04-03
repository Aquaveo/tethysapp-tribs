import PropTypes from "prop-types";
import Icon from 'assets/Icon';

import TreeItem from "components/tree/TreeItem";
import RunAction from "components/project/actions/RunAction";
import * as workflowConstants from "constants/workflowConstants"

import ToolHistoryFailure from 'assets/tool_history_item_failure.svg';
import ToolHistoryPending from 'assets/tool_history_item_gold.svg';
import ToolHistoryContinue from 'assets/tool_history_item_blue.svg';
import ToolHistorySuccess from 'assets/tool_history_item_success.svg';
import { BsFillGearFill } from "react-icons/bs";
import { IconContext } from "react-icons";
import { matchesUUID } from "components/tree/propTypes";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import { useEffect, useState } from "react";

const HistoryTreeItem = ({
    historyItem,
    historyIndex,
    onDelete,
    onDuplicate,
    onUpdate,
    runWorkflow,
  }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (disabled) {
      // This is as a backup if a dataset can't be deleted
      // For example if a dataset is used in a Scenario or Realization.
      const timer = setTimeout(() => {
        setDisabled(false);
      }, 3000); // Is 3 seconds a good amount of time?

      // Cleanup the timer when the component unmounts or disabled changes
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const handleDeleteCancel = () => {
    setShowConfirmDelete(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(historyItem.id);
    setShowConfirmDelete(false);
    setDisabled(true);
  };

  const handleDuplicate = () => {
    onDuplicate(historyItem.id);
  };

  const handleUpdate = (historyItem) => {
    onUpdate(historyItem);
  };

  const handleRename = (newName) => {
    const newHistoryItem = { ...historyItem, name: newName };
    handleUpdate(newHistoryItem);
  };

  const handleRunWorkflow = () => {
    runWorkflow(historyItem);
  }

  const workflowStatusMap = {
    Complete: <Icon src={ToolHistorySuccess} altText="Success" title="Success"/>,
    Continue: <Icon src={ToolHistoryContinue} altText="Continue" title="Continue" />,
    Running: 
      <IconContext.Provider value={{color: "#3E9C35", size: "1.375em"}}>
        <BsFillGearFill alt="Running" title="Running" />
      </IconContext.Provider>,
    Error: <Icon src={ToolHistoryFailure} altText="Error" title="Error" />,
    Pending: <Icon src={ToolHistoryPending} altText="Pending" title="Pending" />,
  };

  return (
    <>
      <TreeItem
        title={historyItem.name}
        icon={workflowStatusMap[historyItem.status]}
        deletable
        duplicatable
        renameable
        highlight
        leaf
        onDelete={handleDelete}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        style={{backgroundColor: historyIndex % 2 === 1 ? "var(--app-secondary-color)" : "unset"}}
        disabled={disabled}
        actions={[
          <RunAction
            key="workflow-run-action"
            title={`Run ${historyItem.name}`}
            onClick={handleRunWorkflow}
            inline
          />
        ]}
      />
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${historyItem.name}?`}
      />
    </>
  );
};

HistoryTreeItem.propTypes = {
  historyItem: PropTypes.shape({
    id: matchesUUID,
    name: PropTypes.string,
    date_created: PropTypes.instanceOf(Date),
    status: PropTypes.oneOf(workflowConstants.WORKFLOW_STATUS),
    steps: PropTypes.array,
    output: PropTypes.array,
  }).isRequired,
  historyIndex: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  runWorkflow: PropTypes.func.isRequired,
};

export default HistoryTreeItem;
