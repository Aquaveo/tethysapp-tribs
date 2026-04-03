import { useContext, useEffect } from "react";
import { Camera as ResiumCamera } from "resium"
import useCameraCoordinates from "hooks/useCustomCamera";
import { AppContext, GraphicsWindowVisualsContext } from "react-tethys/context";
import { toast } from "react-toastify";
import { BAD_EXTENT, HOME } from "constants/GraphicsWindowConstants";

function arraysAreIdentical(arr1, arr2) {
  if (arr1 === null || arr2 === null) {
    return false;
  }

  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

const CustomCamera = () => {
  const { framedObject } = useContext(GraphicsWindowVisualsContext);
  const { backend } = useContext(AppContext);
  const { cameraCoordinates } = useCameraCoordinates();

  useEffect(() => {
    if (!arraysAreIdentical(cameraCoordinates, BAD_EXTENT) && cameraCoordinates !== null) {
      if (!arraysAreIdentical(cameraCoordinates, framedObject?.[HOME])) {
        // Prevention for setting the framedObject[HOME] a million times endlessly
        toast.success("Successfully set the Project Extent", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        backend.do(
          backend.actions.PROJECT_UPDATE,
          {attributes: {project_extent: cameraCoordinates}}
        );
      }
    } else if (cameraCoordinates !== null) {
      // This is due to the Camera not being able to get the extent of the full screen.
      // In order to avoid this, there must  no sky box visible on screen.
      toast.error("Project Extent was not set correctly. Please zoom in more and try again", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }, [backend, cameraCoordinates, framedObject]);

  return <ResiumCamera/>;
};

export default CustomCamera;
