import PropTypes from "prop-types";

export const idOrNameRequired = (props, _, componentName) => {
  if (!props.id && !props.name) {
    return new Error(
      `One of the props "id" or "name" was not specified in "${componentName}"`
    );
  }
};

export const inputPropTypes = {
  id: idOrNameRequired,
  name: idOrNameRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  size: PropTypes.oneOf(["", "sm", "m", "lg"]),
};
