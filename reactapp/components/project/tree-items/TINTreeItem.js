import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import Icon from 'assets/Icon';
import Elevation_Data_Active from 'assets/Elevation_Data_Active.svg';
import Scalar_Dataset_Active from 'assets/Scalar_Dataset_Active.svg';
import TreeItem from "components/tree/TreeItem";
import VisibilityAction from "components/project/actions/VisibilityAction";
import { TIN_DATA_NAMES } from "constants/tinData";
import { DEFAULT_DATASET_ICON_NAME } from "constants/projectConstants";
import { datasetPropTypes } from "components/tree/propTypes";
import { GraphicsWindowVisualsContext, ProjectContext } from "react-tethys/context";

const TINTreeItem = ({ dataset, datasetIndex, ...props }) => {
  const { isFirstProjectRender, projectId } = useContext(ProjectContext);
  const { visibleObjects, hideObject, revealObject } = useContext(GraphicsWindowVisualsContext);
  const [visible, setVisible] = useState(visibleObjects?.[projectId] ? !visibleObjects?.[projectId].includes(dataset.id) : false);

  useEffect(() => {
    // visibleObjects context gets updated in the initial render.
    // This is after the useState default state is defined.
    // To avoid this, we will skip the first render on this component for checking the visibleObjects.
    // In that first render, we will update visibleObjects to include every dataset except the first.
    if (isFirstProjectRender) {
      // Do Nothing
    } else if (visibleObjects[projectId] !== undefined) {
      if (!visibleObjects[projectId].includes(dataset.id)) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    }
  }, [visibleObjects, isFirstProjectRender, dataset.id, datasetIndex, hideObject, projectId]);

  const toggleVisibility = (event, visibility) => {
    if (!visibility) {
      hideObject(dataset.id)
    } else {
      revealObject(dataset.id)
    }
    setVisible(visibility);
  };

  const iconMap = {
    [TIN_DATA_NAMES.ZDIR]: Elevation_Data_Active,
    [TIN_DATA_NAMES.SOIL_MOISTURE]: Scalar_Dataset_Active,
    [DEFAULT_DATASET_ICON_NAME]: Scalar_Dataset_Active,
  }

  const datasetIconName = dataset.name.includes('.')
    ? dataset.name.split('.')[0]?.replace(" ", "_").toUpperCase()
    : dataset.name.replace(" ", "_").toUpperCase();

  const icon = iconMap[datasetIconName] || iconMap[DEFAULT_DATASET_ICON_NAME];

  return (
    <TreeItem
      title={dataset.name}
      leaf
      icon={<Icon src={icon} altText={datasetIconName} width="20px" height="20px" />}
      actions={[
        <VisibilityAction
          key="visibility"
          onClick={toggleVisibility}
          inline
          off={!visible}
        />,
      ]}
      {...props}
    />
  );
};

TINTreeItem.propTypes = {
  dataset: datasetPropTypes.isRequired,
  datasetIndex: PropTypes.number,
};

export default TINTreeItem;
