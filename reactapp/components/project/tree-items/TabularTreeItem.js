import PropTypes from "prop-types";
import Icon from 'assets/Icon';
import Scalar_Dataset from 'assets/Scalar_Dataset_Active.svg';
import TreeItem from "components/tree/TreeItem";
import { datasetPropTypes } from "components/tree/propTypes";
import { useEffect, useState } from "react";
import { ConfirmDeleteModal } from "components/dialogs/ConfirmDeleteModal";
import DetailsAction from "../actions/DetailsAction";

const TabularTreeItem = ({
  tabular,
  onDelete,
  onUpdate,
  onDuplicate,
  deletable=true,
  duplicatable=true,
  renameable=true
}) => {
  const TETHYS_ROOT_URL = process.env.TETHYS_APP_ROOT_URL;
  const dataset_url = `datasets/${tabular.id}/details/summary/`;

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
    onDelete(tabular.id);
    setShowConfirmDelete(false);
    setDisabled(true);
  };

  const handleDuplicate = () => {
    onDuplicate(tabular.id);
  };

  const handleUpdate = (tabular) => {
    onUpdate(tabular);
  };

  const handleRename = (newName) => {
    const newGeometry = { ...tabular, name: newName };
    handleUpdate(newGeometry);
  };

  const handleOpenDatasetDetails = () => {
    const details_url = TETHYS_ROOT_URL + dataset_url;
    window.open(details_url, "_blank", "noopener noreferrer");
  };

  return (
    <>
      <TreeItem
        title={tabular.name}
        icon={<Icon src={Scalar_Dataset} altText="Tabular Data" width="20px" height="20px" />}
        leaf
        deletable={deletable}
        duplicatable={duplicatable}
        renameable={renameable}
        onDelete={deletable ? handleDelete : () => {}}
        onDuplicate={duplicatable ? handleDuplicate : () => {}}
        onRename={renameable ? handleRename : () => {}}
        disabled={disabled}
        actions={[
          <DetailsAction
            key="details"
            onClick={handleOpenDatasetDetails}
          />,
        ]}
      />
      <ConfirmDeleteModal
        showConfirm={showConfirmDelete}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        message={`Are you sure you want to delete ${tabular.name}?`}
      />
    </>
  );
};

TabularTreeItem.propTypes = {
  tabular: datasetPropTypes.isRequired,
  onDelete: PropTypes.func,
  onDuplicate: PropTypes.func,
  onUpdate: PropTypes.func,
  deletable: PropTypes.bool,
  duplicatable: PropTypes.bool,
  renameable: PropTypes.bool,
};

export default TabularTreeItem;
