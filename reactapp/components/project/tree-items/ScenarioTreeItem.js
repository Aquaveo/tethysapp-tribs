import PropTypes from "prop-types";
import Icon from 'assets/Icon';

import GenericFolder from 'assets/Generic_Folder.svg';
import Drainage_Module_Icon from 'assets/Drainage_Module_Icon.svg';
import TreeItem from "components/tree/TreeItem";
import ModelTreeItem from "./ModelTreeItem";
import { MODEL_DATA_NAMES } from "constants/modelData";
import newUUID from "lib/uuid";
import { matchesUUID } from "components/tree/propTypes";
import { useEffect, useState } from "react";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";

const ScenarioTreeItem = ({
  scenario,
  onDelete,
  onDuplicate,
  onUpdate,
  openModelControl,
  setScenarioIndex,
  scenarioIndex
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
    onDelete(scenario.id);
    setShowConfirmDelete(false);
    setDisabled(true);
  };

  const handleDuplicate = () => {
    onDuplicate(scenario.id);
  };

  const handleUpdate = (scenario) => {
    onUpdate(scenario);
  };

  const handleRename = (newName) => {
    const newGeometry = { ...scenario, name: newName };
    handleUpdate(newGeometry);
  };

  const updateScenarioIndex = () => {
    setScenarioIndex(scenarioIndex)
  }

  return (
    <>
      <TreeItem
        title={scenario.name}
        icon={<Icon src={Drainage_Module_Icon} altText="Scenario Data"/>}
        deletable
        duplicatable
        renameable
        onDelete={handleDelete}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        uniqueId={scenario.id}
        disabled={disabled}
      >
        <ModelTreeItem
          dataset={{
            id: newUUID(),
            name: MODEL_DATA_NAMES.CONTROL
          }}
          key={"model-control-data-set"}
          openModelControl={openModelControl}
          updateScenarioIndex={updateScenarioIndex}
        />
        <TreeItem
          title="Linked Datasets"
          icon={<Icon src={GenericFolder} altText="Linked Dataset" />}
          uniqueId={scenario.id}
        >
          {scenario?.linked_datasets.map((dataset, i) => (
            <ModelTreeItem
              dataset={dataset}
              key={"data-set-" + i}
              openModelControl={openModelControl}
              updateScenarioIndex={updateScenarioIndex}
            />
          ))}
        </TreeItem>
      </TreeItem>
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${scenario.name}?`}
      />
    </>
  );
};

ScenarioTreeItem.propTypes = {
  scenario: PropTypes.shape({
    id: matchesUUID,
    name: PropTypes.string,
    linked_datasets: PropTypes.arrayOf(
      PropTypes.shape({
        id: matchesUUID,
        name: PropTypes.string,
      })
    ),
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  openModelControl: PropTypes.func.isRequired,
  setScenarioIndex: PropTypes.func,
  scenarioIndex: PropTypes.number
};

export default ScenarioTreeItem;
