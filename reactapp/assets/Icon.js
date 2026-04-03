import { useState } from "react";
import errorImage from "assets/HelpIcon.svg";
import PropTypes from "prop-types";

const Icon = ({ src, altText, width = '20px', height = '20px' }) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  return (
    <img
      src={error ? errorImage : src}
      alt={altText}
      width={width}
      height={height}
      onError={handleError}
    />
  );
};

Icon.propTypes = {
  src: PropTypes.string.isRequired,
  altText: PropTypes.string.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
};

export default Icon;
