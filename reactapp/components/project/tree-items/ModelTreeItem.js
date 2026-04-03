import PropTypes from "prop-types";
import { useContext } from "react";

import Icon from 'assets/Icon';
import Simulation_Icon from 'assets/Simulation_Icon.svg';
import TIN_Module_Icon from 'assets/TIN_Module_Icon.svg';
import Materials_Display_Options from 'assets/Materials_Display_Options.svg';
import Scalar_Dataset from 'assets/Scalar_Dataset_Active.svg';
import Polygons from 'assets/Polygons.svg';
import TreeItem from "components/tree/TreeItem";
import { MODEL_DATA_NAMES } from "constants/modelData";
import { DATASET_GROUPS, DATASET_TYPE_MAPS, DEFAULT_DATASET_ICON_NAME } from "constants/projectConstants";
import SettingsAction from "../actions/SettingsAction";
import { matchesUUID } from "components/tree/propTypes";
import { DatasetContext } from "react-tethys/context";

const ModelTreeItem = ({ dataset, openModelControl, updateScenarioIndex }) => {
  const handleModalOpen = () => {
    updateScenarioIndex();
    openModelControl();
  };

  const { contextDatasets } = useContext(DatasetContext);
  const correspondingDataset = contextDatasets?.find((contextDataset) => contextDataset.id === dataset.id);

  const iconMap = {
    [MODEL_DATA_NAMES.CONTROL]: Simulation_Icon,
    [MODEL_DATA_NAMES.TIN]: TIN_Module_Icon,
    [MODEL_DATA_NAMES.LAND_USE]: Materials_Display_Options,
    [MODEL_DATA_NAMES.SOIL_TYPE]: Materials_Display_Options,
    [DEFAULT_DATASET_ICON_NAME]: Materials_Display_Options,
    [DATASET_GROUPS.MESH]: TIN_Module_Icon,
    [DATASET_GROUPS.GIS]: Polygons,
    [DATASET_GROUPS.TABULAR]: Scalar_Dataset,
  };

  const icon = iconMap[correspondingDataset?.name ?? dataset.name]
    || iconMap[DATASET_TYPE_MAPS[correspondingDataset?.dataset_type]]
    || iconMap[DEFAULT_DATASET_ICON_NAME];

  return (
    <TreeItem
      title={correspondingDataset?.name ?? dataset.name}
      leaf
      icon={<Icon src={icon} altText="TIN Data" width="20px" height="20px" />}
      actions={dataset.name === MODEL_DATA_NAMES.CONTROL ? [
          <SettingsAction key="model_control" onClick={handleModalOpen} inline />
        ] : []
      }
    />
  );
};

ModelTreeItem.propTypes = {
  dataset: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    id: matchesUUID,
    dataset_type: PropTypes.oneOf(Object.keys(DATASET_TYPE_MAPS))
  }).isRequired,
  openModelControl: PropTypes.func.isRequired,
  updateScenarioIndex: PropTypes.func
};

export default ModelTreeItem;
