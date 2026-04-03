import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import newUUID from "lib/uuid";
import Icon from 'assets/Icon';

import GenericFolder from 'assets/Generic_Folder.svg';
import Drainage_Module_Icon from 'assets/Drainage_Module_Icon.svg';
import Scalar_Dataset from 'assets/Scalar_Dataset_Active.svg';
import TreeItem from "components/tree/TreeItem";
import { datasetPropTypes, matchesUUID } from "components/tree/propTypes";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import ModelTreeItem from "./ModelTreeItem";
import { MODEL_DATA_NAMES } from "constants/modelData";
import { DATASET_GROUPS, DATASET_TYPE_MAPS } from "constants/projectConstants";
import RealizationOutputTreeItem from "./RealizationOutputTreeItem";

const RealizationTreeItem = ({
  realization,
  onDelete,
  onUpdate,
  onDeleteDataset,
  onUpdateDataset,
  outputDatasets,
  openModelControl,
  setRealizationIndex,
  realizationIndex,
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
    onDelete(realization.id);
    setShowConfirmDelete(false);
    setDisabled(true);
  };

  const handleUpdate = (realization) => {
    onUpdate(realization);
  };

  const handleRename = (newName) => {
    const newRealization = { ...realization, name: newName };
    handleUpdate(newRealization);
  };

  const updateRealizationIndex = () => {
    setRealizationIndex(realizationIndex)
  }

  return (
    <>
      <TreeItem
        title={realization.name}
        icon={<Icon src={Scalar_Dataset} altText="Realization Data" width="20px" height="20px" />}
        uniqueId={realization.id}
        deletable
        renameable
        onDelete={handleDelete}
        onRename={handleRename}
        disabled={disabled}
      >
        <ModelTreeItem
          dataset={{
            id: newUUID(),
            name: MODEL_DATA_NAMES.CONTROL
          }}
          key={`realization-control-data-set-${realizationIndex}`}
          openModelControl={openModelControl}
          updateScenarioIndex={updateRealizationIndex}
          disabled={disabled}
        />
        <TreeItem
          title={realization.scenario_name}
          icon={<Icon src={Drainage_Module_Icon} altText="Linked Scenario" />}
          leaf
        />
        {/* <TreeItem
          title="Linked Datasets"
          icon={<Icon src={GenericFolder} altText="Linked Dataset" />}
        >
          {realization?.linked_datasets.map((linked_dataset, i) => (
            <ModelTreeItem
              dataset={linked_dataset}
              key={"data-set-" + i}
              openModelControl={openModelControl}
              updateScenarioIndex={updateRealizationIndex}
            />
          ))}
        </TreeItem> */}
        <TreeItem
          title="Output"
          icon={<Icon src={GenericFolder} altText="Output Datasets" />}
          uniqueId={realization.id}
        >
          {realization?.linked_datasets.map((linked_dataset, i) => {
            const dataset = outputDatasets.find((output) => {
              return linked_dataset.id === output.id;
            });
            if (DATASET_TYPE_MAPS?.[dataset?.dataset_type] !== DATASET_GROUPS.OUTPUT) {
              return null;
            }
            return (
              <RealizationOutputTreeItem
                key={"data-set-" + i}
                dataset={dataset}
                onDelete={onDeleteDataset}
                onUpdate={onUpdateDataset}
                realizationIndex={realizationIndex}
              />
            );
          })}
        </TreeItem>
      </TreeItem>
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${realization.name}?`}
      />
    </>
  );
};

RealizationTreeItem.propTypes = {
  realization: PropTypes.shape({
    id: matchesUUID,
    name: PropTypes.string,
    scenario_name: PropTypes.string,
    scenario_id: matchesUUID,
    linked_datasets: PropTypes.arrayOf(
      PropTypes.shape({
        id: matchesUUID,
        name: PropTypes.string
      })
    )
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onUpdateDataset: PropTypes.func.isRequired,
  onDeleteDataset: PropTypes.func.isRequired,
  outputDatasets: PropTypes.arrayOf(
    datasetPropTypes
  ),
  openModelControl: PropTypes.func,
  setRealizationIndex: PropTypes.func,
  realizationIndex: PropTypes.number,
};

export default RealizationTreeItem;
