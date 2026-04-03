import { useState, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from "prop-types";
import { Col, Row } from "react-bootstrap";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import FormikSheet from "components/dialogs/FormikSheet";
import modelControlSchema from '../../../constants/ModelControlValidation';
import { ModelControlInitialValues } from '../../../constants/ModelControlInitial';
import { ModelControlPropTypes } from '../../../constants/ModelControlPropTypes';
import VerticalTabs from 'components/buttons/VerticalTabs';
import { getCapitalizedKey, getKeyNames, groupByIdAndType, TabContent } from './TabContent';
import { modelControlDatasetPropTypes } from 'components/tree/propTypes';
import { NON_RENDER_KEYS } from 'constants/ModelControlConstants';

const StyledTabs = styled(Tabs)`
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 5;
  padding-top: 1rem;
  & > * {
    & :hover {
      color: #000;
      background-color: var(--app-secondary-color);
    }
    & > * {
      color: #000;
      &.active,
      &.show {
        color: #fff !important;
        background-color: var(--app-primary-color) !important;
      }
    }
  }
`;

const ModelControl = ({
  modelScenario: ms,
  datasets,
  onClose,
  updateScenario,
  show,
  readOnly = false,
  ...props
}) => {
  const handleClose = () => {
    onClose && onClose();
  };

  const handleSubmit = (values) => {
    updateScenario(values)
  };

  const initialValues = ModelControlInitialValues(ms);
  const [dataset_types_map, setDatasetTypesMap] = useState(groupByIdAndType(datasets));

  useEffect(() => {
    setDatasetTypesMap(groupByIdAndType(datasets));
  }, [datasets]);

  return (
    <FormikSheet
      title="Model Control"
      show={show}
      initialValues={initialValues}
      validationSchema={modelControlSchema}
      onClose={handleClose}
      onSubmit={handleSubmit}
      {...props}
    >
      {({ values }) => (
        <StyledTabs
          defaultActiveKey="run_parameters"
          id="file-tabs"
          className="mb-3"
        >
          {Object.entries(values.input_file)
            .filter(([key, value]) => typeof value === 'object')
            .map(([keyName, keysWithObjects], i) => {
              const allValuesAreObjects = Object.values(keysWithObjects).every(value => typeof value === 'object');
              const doNotRenderInput = NON_RENDER_KEYS.includes(keyName);

              if (doNotRenderInput) {
                return null;
              }

              return(
                <Tab key={i} eventKey={keyName} title={getCapitalizedKey(keyName)}>
                  {allValuesAreObjects ? (
                    <VerticalTabs tabNames={getKeyNames(values.input_file[keyName])}>
                      {TabContent(
                        keysWithObjects,
                        values.input_file[keyName],
                        keyName,
                        datasets,
                        dataset_types_map,
                        readOnly,
                      )}
                    </VerticalTabs>
                  ) :
                    <Row>
                      <Col sm={2} />
                      <Col sm={10}>
                        <Row>
                          <Col sm={3} />
                          <Col sm={9} >
                            <h5>{getCapitalizedKey(keyName)}</h5>
                          </Col>
                        </Row>
                        {TabContent(
                          keysWithObjects,
                          values.input_file[keyName],
                          keyName,
                          datasets,
                          dataset_types_map,
                          readOnly,
                        )}
                      </Col>
                    </Row>
                  }
                </Tab>
              )
          })}
        </StyledTabs>
      )}
    </FormikSheet>
  );
};

ModelControl.propTypes = {
  modelScenario: ModelControlPropTypes,
  datasets: PropTypes.arrayOf(
    modelControlDatasetPropTypes,
  ),
  updateScenario: PropTypes.func,
  onClose: PropTypes.func,
  show: PropTypes.bool,
  readOnly: PropTypes.bool,
};

export default ModelControl;
