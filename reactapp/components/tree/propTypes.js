import { DATASET_VIZ_TYPES } from "constants/GraphicsWindowConstants";
import { DATASET_TYPE_MAPS } from "constants/projectConstants";
import PropTypes from "prop-types";
import { validate as uuidValidate } from "uuid";

export const matchesUUID = (props, propName, componentName) => {
  if (!uuidValidate(props[propName]) && props[propName] !== null) {
    return new Error(`Invalid prop ${propName} passed to ${componentName}. Expected a valid UUID and got ${props[propName]}`);
  }
};

matchesUUID.isRequired = (props, propName, componentName) => {
  if (props[propName] == null) {
    return new Error(
      `The prop ${propName} is marked as required in ${componentName}, but its value is ${props[propName]}.`
    );
  }
  return matchesUUID(props, propName, componentName);
};

const datasetProps = {
  id: matchesUUID.isRequired,
  attributes: PropTypes.object,
  name: PropTypes.string.isRequired,
  dataset_type: PropTypes.oneOf(Object.keys(DATASET_TYPE_MAPS)),
  created_by: PropTypes.string,
  date_created: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.instanceOf(Date)
  ]),
  description: PropTypes.string,
  display_type_plural: PropTypes.string.isRequired,
  display_type_singular: PropTypes.string.isRequired,
  locked: PropTypes.bool.isRequired,
  public: PropTypes.bool.isRequired,
  slug: PropTypes.string.isRequired,
  status: PropTypes.string, // This can be null, so it's optional
  type: PropTypes.string.isRequired,
  organizations: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        id: matchesUUID.isRequired,
        name: PropTypes.string.isRequired,
      })
    ),
    PropTypes.array,
  ]).isRequired,
  viz: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(DATASET_VIZ_TYPES)),
    url: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]),
    legend: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]),
    layer: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.string,
    ]),
    center: PropTypes.arrayOf(PropTypes.number), // This will have 3 values: latitude, longitude and altitude
    extent: PropTypes.arrayOf(PropTypes.number), // This will be an array of 4 values, one for each corner of the boundary
    origin: PropTypes.arrayOf(PropTypes.number),
    env_str: PropTypes.oneOfType([
      PropTypes.object, // The keys to this object are dynamically created so this is as granular as it can get
      PropTypes.string,
    ]),
  }),
};

export const datasetPropTypes = PropTypes.shape({
  ...datasetProps
});

export const meshDatasetPropTypes = PropTypes.shape({
  ...datasetProps,
  datasets: PropTypes.arrayOf(PropTypes.shape({...datasetProps}))
});

export const modelControlDatasetPropTypes = PropTypes.shape({
  ...datasetProps,
  attributes: PropTypes.object.isRequired,
});
