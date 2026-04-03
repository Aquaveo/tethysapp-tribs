import PropTypes from "prop-types";

import LoadingAnimation from "react-tethys/components/loader/LoadingAnimation";
import { AppContext } from "react-tethys/context";
import { useAppLoad } from "hooks/useAppLoad";

function Loader({ children }) {
  const { error, appContext, isLoaded } = useAppLoad();
  if (error) {
    // Throw error so it will be caught by the ErrorBoundary
    throw error;
  } else if (!isLoaded) {
    return <LoadingAnimation />;
  } else {
    return (
      <>
        <AppContext.Provider value={appContext}>{children}</AppContext.Provider>
      </>
    );
  }
}

Loader.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element,
  ]),
};

export default Loader;
