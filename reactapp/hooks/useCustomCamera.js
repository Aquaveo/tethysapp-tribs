// import PropTypes from "prop-types";
import { Math as CesiumMath } from "cesium";
import { useContext, useEffect, useRef, useState } from "react";
import { GraphicsWindowVisualsContext } from "react-tethys/context";
import { useCesium } from "resium"

const useCameraCoordinates = () => {
  // This must be called in a component that is a child of the Viewer component
  const cesiumRef = useRef(null);
  const cesiumContext = useCesium();
  const [cameraCoordinates, setCameraCoordinates] = useState(null);
  const { updateFrame, setUpdateFrame } = useContext(GraphicsWindowVisualsContext);

  useEffect(() => {
    cesiumRef.current = cesiumContext;
  }, [cesiumContext, updateFrame]);

  useEffect(() => {
    const { camera, globe } = cesiumRef.current;
    if (updateFrame && camera && globe) {
      const ellipsoid = globe?.ellipsoid;

      const cameraRectangle = camera.computeViewRectangle(ellipsoid);
      setCameraCoordinates([
        CesiumMath.toDegrees(cameraRectangle.west),
        CesiumMath.toDegrees(cameraRectangle.south),
        CesiumMath.toDegrees(cameraRectangle.east),
        CesiumMath.toDegrees(cameraRectangle.north)
      ]);
    }
    setUpdateFrame(false);
  }, [updateFrame, setUpdateFrame]);

  return {updateFrame, cameraCoordinates};
};

useCameraCoordinates.propTypes = {};

export default useCameraCoordinates;
