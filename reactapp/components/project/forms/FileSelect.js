import PropTypes from "prop-types";
import { inputPropTypes } from "components/forms/propTypes";
import { Row, Form, Col } from "react-bootstrap";
import { useContext } from "react";
import { BsPlus } from "react-icons/bs";

import { ModalContext, ProjectObjectContext } from "react-tethys/context";
import SelectInput from "components/forms/SelectInput";
import MinimalButton from "components/buttons/MinimalButton";

import * as ProjectConstants from "constants/projectConstants"

const FileSelect = ({
    label,
    size = 'm',
    selectOptions,
    tooltip,
    ...props
  }) => {
  const {
    setShowAddMesh,
    setShowAddGIS,
    setShowAddRaster,
    setShowAddTabular,
    setShowAddGenericDataset,
  } = useContext(ModalContext);

  const { setProjectObjectLocation } = useContext(ProjectObjectContext);

  const handleButtonClick = () => {
    const datasetType = ProjectConstants.KEY_NAME_TO_GENERAL_DATASET_TYPE_MAP[label];
    setProjectObjectLocation(selectOptions.name);
    switch (datasetType) {
      case ProjectConstants.DATASET_GROUPS.MESH:
        setShowAddMesh(true);
        break
      case ProjectConstants.DATASET_GROUPS.GIS:
        setShowAddGIS(true);
        break
      case ProjectConstants.DATASET_GROUPS.RASTER:
        setShowAddRaster(true);
        break
      case ProjectConstants.DATASET_GROUPS.TABULAR:
        setShowAddTabular(true);
        break
      default:
        setShowAddGenericDataset(true);
    }
  };

  return (
    <>
      <Form.Group as={Row} style={{justifyContent: "end"}}>
        <Col sm={props.readOnly ? 12 : 11} style={{...(props.readOnly ? {} : { paddingRight: "unset" })}}>
          <SelectInput
            label={label}
            size={size}
            name={selectOptions.name}
            tooltip={tooltip}
            options={selectOptions.options}
            {...props}
          />
        </Col>
        {!props.readOnly && (
          <Col sm="auto" style={{paddingLeft: "8px"}}>
            <MinimalButton
              title={"Upload New File"}
              onClick={handleButtonClick}
              type="button"
            >
              <BsPlus strokeWidth={1.25} />
            </MinimalButton>
          </Col>
        )}
      </Form.Group>
    </>
  );
};

FileSelect.propTypes = {
  ...inputPropTypes,
  initialSwitch: PropTypes.bool,
  tooltip: PropTypes.string,
  selectOptions: PropTypes.shape({
    name: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]),
        label: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
};

export default FileSelect